import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { DOTS, dotInCell } from '../hash';
import { mulberry32 } from '../random';

/**
 * The left kidney cut in half from top to bottom (a coronal section, seen from the front). The
 * outline is sliced from the real 3D kidney, so the painted cut face fits it exactly. Units are the
 * kidney mesh's own: about 1.1 wide and 2 tall, the cut in the plane z = 0, facing +Z. The notch
 * where the vessels and the ureter attach (the hilum) faces the body's midline, which is −X.
 */
export const HALF = 1.05; // the painted texture covers [-HALF, HALF]² of the cut plane
export const CORTEX = 0.16; // thickness of the outer layer

/** Slice a mesh with the plane z = `z` and return the longest closed outline, in (x, y). */
export function sliceContour(source: THREE.BufferGeometry, z = 0): THREE.Vector2[] {
  // plain float positions (the loaded model's are packed and interleaved)
  const src = source.getAttribute('position');
  const flat = new Float32Array(src.count * 3);
  for (let i = 0; i < src.count; i++) flat.set([src.getX(i), src.getY(i), src.getZ(i)], i * 3);
  const bare = new THREE.BufferGeometry();
  bare.setAttribute('position', new THREE.BufferAttribute(flat, 3));
  if (source.getIndex()) bare.setIndex(source.getIndex());
  const g = mergeVertices(bare, 1e-6);
  const pos = g.getAttribute('position');
  const index = g.getIndex();
  const n = index ? index.count : pos.count;
  const at = (i: number) => (index ? index.getX(i) : i);
  const side = (i: number) => {
    const d = pos.getZ(i) - z;
    return d === 0 ? 1e-9 : d;
  };
  const points = new Map<number, THREE.Vector2>();
  const links = new Map<number, number[]>();
  const edge = (a: number, b: number) => {
    const key = a < b ? a * 4194304 + b : b * 4194304 + a;
    if (!points.has(key)) {
      const da = side(a);
      const db = side(b);
      const k = da / (da - db);
      points.set(key, new THREE.Vector2(pos.getX(a) + (pos.getX(b) - pos.getX(a)) * k, pos.getY(a) + (pos.getY(b) - pos.getY(a)) * k));
    }
    return key;
  };
  const link = (a: number, b: number) => {
    if (!links.has(a)) links.set(a, []);
    if (!links.has(b)) links.set(b, []);
    links.get(a)!.push(b);
    links.get(b)!.push(a);
  };
  for (let i = 0; i < n; i += 3) {
    const tri = [at(i), at(i + 1), at(i + 2)];
    const crossing: number[] = [];
    for (let e = 0; e < 3; e++) {
      const a = tri[e];
      const b = tri[(e + 1) % 3];
      if (side(a) > 0 !== side(b) > 0) crossing.push(edge(a, b));
    }
    if (crossing.length === 2) link(crossing[0], crossing[1]);
  }
  // walk the links into closed loops and keep the longest
  const seen = new Set<number>();
  let best: THREE.Vector2[] = [];
  let bestLen = 0;
  for (const start of links.keys()) {
    if (seen.has(start)) continue;
    const loop: THREE.Vector2[] = [];
    let prev = -1;
    let cur = start;
    while (!seen.has(cur)) {
      seen.add(cur);
      loop.push(points.get(cur)!);
      const next = links.get(cur)!.find((k) => k !== prev && !seen.has(k));
      if (next === undefined) break;
      prev = cur;
      cur = next;
    }
    let len = 0;
    for (let i = 0; i < loop.length; i++) len += loop[i].distanceTo(loop[(i + 1) % loop.length]);
    if (len > bestLen) {
      bestLen = len;
      best = loop;
    }
  }
  // counter-clockwise, lightly thinned
  let area = 0;
  for (let i = 0; i < best.length; i++) {
    const a = best[i];
    const b = best[(i + 1) % best.length];
    area += a.x * b.y - b.x * a.y;
  }
  if (area < 0) best.reverse();
  return best.filter((p, i) => i === 0 || p.distanceTo(best[i - 1]) > 1e-4);
}

/**
 * Distance from every grid point of the cut face to the outline (negative outside), by
 * rasterising the outline and running a two-pass chamfer distance transform. Works for any shape,
 * notches included. Grid covers [-HALF, HALF]², row j = y from bottom.
 */
function distanceField(contour: THREE.Vector2[], n: number) {
  const inside = new Uint8Array(n * n);
  // scanline fill with the even-odd rule
  for (let j = 0; j < n; j++) {
    const y = ((j + 0.5) / n) * 2 * HALF - HALF;
    const xs: number[] = [];
    for (let k = 0; k < contour.length; k++) {
      const a = contour[k];
      const b = contour[(k + 1) % contour.length];
      if (a.y > y !== b.y > y) xs.push(a.x + ((y - a.y) / (b.y - a.y)) * (b.x - a.x));
    }
    xs.sort((p, q) => p - q);
    for (let k = 0; k + 1 < xs.length; k += 2) {
      const i0 = Math.max(0, Math.ceil(((xs[k] + HALF) / (2 * HALF)) * n - 0.5));
      const i1 = Math.min(n - 1, Math.floor(((xs[k + 1] + HALF) / (2 * HALF)) * n - 0.5));
      for (let i = i0; i <= i1; i++) inside[j * n + i] = 1;
    }
  }
  const px = (2 * HALF) / n;
  const run = (want: number) => {
    // distance (in cells) to the nearest cell that is not `want`
    const d = new Float32Array(n * n);
    for (let k = 0; k < n * n; k++) d[k] = inside[k] === want ? 1e6 : 0;
    const R2 = Math.SQRT2;
    for (let j = 0; j < n; j++)
      for (let i = 0; i < n; i++) {
        const k = j * n + i;
        if (d[k] === 0) continue;
        let v = d[k];
        if (i > 0) v = Math.min(v, d[k - 1] + 1);
        if (j > 0) {
          v = Math.min(v, d[k - n] + 1);
          if (i > 0) v = Math.min(v, d[k - n - 1] + R2);
          if (i < n - 1) v = Math.min(v, d[k - n + 1] + R2);
        }
        d[k] = v;
      }
    for (let j = n - 1; j >= 0; j--)
      for (let i = n - 1; i >= 0; i--) {
        const k = j * n + i;
        if (d[k] === 0) continue;
        let v = d[k];
        if (i < n - 1) v = Math.min(v, d[k + 1] + 1);
        if (j < n - 1) {
          v = Math.min(v, d[k + n] + 1);
          if (i < n - 1) v = Math.min(v, d[k + n + 1] + R2);
          if (i > 0) v = Math.min(v, d[k + n - 1] + R2);
        }
        d[k] = v;
      }
    return d;
  };
  const din = run(1);
  const dout = run(0);
  const f = new Float32Array(n * n);
  for (let k = 0; k < n * n; k++) f[k] = inside[k] ? (din[k] - 0.5) * px : -(dout[k] - 0.5) * px;
  return f;
}

/** Convex hull (Andrew's monotone chain), counter-clockwise. */
function convexHull(points: THREE.Vector2[]) {
  const p = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
  const cross = (o: THREE.Vector2, a: THREE.Vector2, b: THREE.Vector2) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
  const lower: THREE.Vector2[] = [];
  for (const q of p) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], q) <= 0) lower.pop();
    lower.push(q);
  }
  const upper: THREE.Vector2[] = [];
  for (const q of [...p].reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], q) <= 0) upper.pop();
    upper.push(q);
  }
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

/** Distance from a point to a polygon's edges. */
function distanceToPolygon(p: THREE.Vector2, poly: THREE.Vector2[]) {
  let best = Infinity;
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const k = Math.max(0, Math.min(1, ((p.x - a.x) * abx + (p.y - a.y) * aby) / (abx * abx + aby * aby || 1)));
    best = Math.min(best, Math.hypot(a.x + abx * k - p.x, a.y + aby * k - p.y));
  }
  return best;
}

export interface Pyramid {
  phi: number;
  half: number;
  /** where its tip (papilla) pokes into the sinus, and where its base meets the cortex */
  tip: number;
  reach: number;
}

/**
 * Everything the painted cut face needs to know about the outline. The real kidney's cut outline
 * has a deep notch in its inner side: the renal sinus, where the pelvis, fat and vessels sit and
 * the ureter leaves. The cut face is drawn over the outline with that notch filled in (`filled`),
 * so the sinus can be painted; depths for the cortex are measured from the filled outline.
 */
export class KidneySection {
  contour: THREE.Vector2[];
  /** The outline with the sinus notch closed off at its opening. */
  filled: THREE.Vector2[];
  center = new THREE.Vector2();
  /** Middle of the sinus (inside the notch), and its deepest point. */
  sinus = new THREE.Vector2();
  hilum = new THREE.Vector2();
  /** The opening of the notch, where the ureter and vessels leave. */
  mouth = new THREE.Vector2();
  pyramids: Pyramid[];
  private shell: Float32Array;
  private tissue: Float32Array;
  private static GRID = 384;

  constructor(contour: THREE.Vector2[]) {
    this.contour = contour;
    let a = 0;
    let cx = 0;
    let cy = 0;
    for (let i = 0; i < contour.length; i++) {
      const p = contour[i];
      const q = contour[(i + 1) % contour.length];
      const cr = p.x * q.y - q.x * p.y;
      a += cr;
      cx += (p.x + q.x) * cr;
      cy += (p.y + q.y) * cr;
    }
    this.center.set(cx / (3 * a), cy / (3 * a));
    // the notch: the point farthest inside the convex hull, on the midline side
    const hull = convexHull(contour);
    let deepest = 0.03;
    let hi = -1;
    contour.forEach((p, i) => {
      if (p.x > this.center.x - 0.05 || Math.abs(p.y - this.center.y) > 0.45) return;
      const depth = distanceToPolygon(p, hull);
      if (depth > deepest) {
        deepest = depth;
        hi = i;
      }
    });
    this.filled = contour;
    if (hi >= 0) {
      this.hilum.copy(contour[hi]);
      // walk both ways from the deepest point to where the outline meets its hull again: the notch's lips
      const onHull = (p: THREE.Vector2) => distanceToPolygon(p, hull) < 0.012;
      const n = contour.length;
      let i0 = hi;
      let i1 = hi;
      for (let k = 0; k < n && !onHull(contour[(i0 - 1 + n) % n]); k++) i0 = (i0 - 1 + n) % n;
      for (let k = 0; k < n && !onHull(contour[(i1 + 1) % n]); k++) i1 = (i1 + 1) % n;
      const lipA = contour[(i0 - 1 + n) % n];
      const lipB = contour[(i1 + 1) % n];
      this.mouth.copy(lipA).add(lipB).multiplyScalar(0.5);
      // the filled outline skips the notch between its two lips
      const out: THREE.Vector2[] = [];
      for (let k = (i1 + 1) % n; ; k = (k + 1) % n) {
        out.push(contour[k]);
        if (k === (i0 - 1 + n) % n) break;
      }
      this.filled = out;
      this.sinus.copy(this.hilum).lerp(this.mouth, 0.3);
    } else {
      // no notch at this cut: a small sinus just inside the inner edge
      this.hilum.set(this.center.x - 0.3, this.center.y);
      this.mouth.set(this.center.x - 0.6, this.center.y);
      this.sinus.set(this.center.x - 0.2, this.center.y);
    }
    this.shell = distanceField(this.filled, KidneySection.GRID);
    this.tissue = distanceField(contour, KidneySection.GRID);
    // pyramids all round the sinus except towards its opening, tips poking into the sinus
    const toMouth = Math.atan2(this.mouth.y - this.sinus.y, this.mouth.x - this.sinus.x);
    const count = 8;
    const gap = THREE.MathUtils.degToRad(55);
    const spread = Math.PI * 2 - 2 * gap;
    this.pyramids = [];
    for (let i = 0; i < count; i++) {
      const phi = toMouth + gap + (spread * (i + 0.5)) / count;
      const tip = Math.max(0.03, this.entry(phi) - 0.012);
      const reach = this.medullaReach(phi);
      if (reach - tip < 0.06) continue;
      this.pyramids.push({ phi, half: (spread / count) * 0.34, tip, reach });
    }
  }

  private sample(f: Float32Array, x: number, y: number) {
    const n = KidneySection.GRID;
    const fx = ((x + HALF) / (2 * HALF)) * n - 0.5;
    const fy = ((y + HALF) / (2 * HALF)) * n - 0.5;
    const i = Math.max(0, Math.min(n - 2, Math.floor(fx)));
    const j = Math.max(0, Math.min(n - 2, Math.floor(fy)));
    const a = Math.max(0, Math.min(1, fx - i));
    const b = Math.max(0, Math.min(1, fy - j));
    const top = f[j * n + i] * (1 - a) + f[j * n + i + 1] * a;
    const bot = f[(j + 1) * n + i] * (1 - a) + f[(j + 1) * n + i + 1] * a;
    return top * (1 - b) + bot * b;
  }

  /** How deep a point is inside the (filled) outline: the cortex is the first CORTEX of it. */
  depthInside(x: number, y: number) {
    return this.sample(this.shell, x, y);
  }

  /** Is the point kidney tissue (not the sinus notch, not outside)? */
  inTissue(x: number, y: number) {
    return this.sample(this.tissue, x, y) > 0;
  }

  /** Distance from the sinus centre along `phi` to where the tissue begins. */
  private entry(phi: number) {
    const dx = Math.cos(phi);
    const dy = Math.sin(phi);
    for (let t = 0; t < 1.5; t += 0.003) if (this.inTissue(this.sinus.x + dx * t, this.sinus.y + dy * t)) return t;
    return 0.05;
  }

  /** From the sinus, how far along direction `phi` the medulla ends and the cortex begins. */
  medullaReach(phi: number) {
    const dx = Math.cos(phi);
    const dy = Math.sin(phi);
    let seenDeep = false;
    for (let t = 0.02; t < 2; t += 0.004) {
      const d = this.depthInside(this.sinus.x + dx * t, this.sinus.y + dy * t);
      if (d > CORTEX) seenDeep = true;
      else if (seenDeep || d < 0) return t;
    }
    return 0.5;
  }

  /** A point in the middle of the outer layer, in direction `phi` from the sinus. */
  cortexPoint(phi: number) {
    const r = this.medullaReach(phi) + CORTEX * 0.5;
    return new THREE.Vector2(this.sinus.x + Math.cos(phi) * r, this.sinus.y + Math.sin(phi) * r);
  }

  /** The painted filter dot nearest to `p` (so the zoom lands exactly on one). */
  nearestDot(p: THREE.Vector2) {
    const cx0 = Math.floor(p.x / DOTS.G);
    const cy0 = Math.floor(p.y / DOTS.G);
    let best: { x: number; y: number; r: number } | null = null;
    let bd = Infinity;
    for (let cy = cy0 - 2; cy <= cy0 + 2; cy++) {
      for (let cx = cx0 - 2; cx <= cx0 + 2; cx++) {
        const d = dotInCell(cx, cy);
        if (!d) continue;
        const dist = Math.hypot(d.x - p.x, d.y - p.y);
        if (dist < bd) {
          bd = dist;
          best = d;
        }
      }
    }
    return best ?? { x: p.x, y: p.y, r: DOTS.G * 0.2 };
  }

  /** The flat cut face (the filled outline), with UVs matching the painted texture. */
  capGeometry() {
    const shape = new THREE.Shape(this.filled.map((p) => new THREE.Vector2(p.x, p.y)));
    const g = new THREE.ShapeGeometry(shape, 1);
    const pos = g.getAttribute('position');
    const uv = g.getAttribute('uv');
    for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + HALF) / (2 * HALF), (pos.getY(i) + HALF) / (2 * HALF));
    return g;
  }
}

/**
 * The painted cut face (an illustration, colours chosen for clarity): the outer cortex dotted
 * with tiny filters, the dark striped pyramids of the medulla with their tips in the sinus, the
 * sinus fat and the pale renal pelvis with its cups, and the arteries and veins between them.
 * Also returns a mask (red = cortex) so the shader knows where to draw the close-up detail.
 */
export function paintSection(sec: KidneySection, size = 1024) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const m = document.createElement('canvas');
  m.width = m.height = size / 2;
  const mg = m.getContext('2d')!;
  const rnd = mulberry32(1899);
  const k = size / (2 * HALF);
  const X = (x: number) => (x + HALF) * k;
  const Y = (y: number) => (HALF - y) * k;
  const S = sec.sinus;
  const at = (phi: number, d: number) => [X(S.x + Math.cos(phi) * d), Y(S.y + Math.sin(phi) * d)] as const;
  const px = size / 1024;
  const path = (pts: THREE.Vector2[]) => {
    const p = new Path2D();
    pts.forEach((q, i) => (i === 0 ? p.moveTo(X(q.x), Y(q.y)) : p.lineTo(X(q.x), Y(q.y))));
    p.closePath();
    return p;
  };
  const filled = path(sec.filled);
  const tissue = path(sec.contour);
  const toMouth = Math.atan2(sec.mouth.y - S.y, sec.mouth.x - S.x);

  // the sinus: fat, with little lobules
  g.fillStyle = '#d9b77e';
  g.fill(filled);
  g.save();
  g.clip(filled);
  for (let s = 0; s < 160; s++) {
    g.fillStyle = s % 2 ? 'rgba(255,240,200,0.25)' : 'rgba(150,110,50,0.14)';
    g.beginPath();
    g.arc(X(S.x + (rnd() - 0.5) * 0.7), Y(S.y + (rnd() - 0.5) * 0.9), (2 + rnd() * 6) * px, 0, Math.PI * 2);
    g.fill();
  }
  // the kidney tissue itself in cortex colour (the renal columns between the pyramids are cortex too)
  g.fillStyle = '#bf6350';
  g.fill(tissue);
  g.save();
  g.clip(tissue);

  // pyramids of the medulla, tips towards the sinus
  sec.pyramids.forEach((py) => {
    const base: (readonly [number, number])[] = [];
    for (let s = 0; s <= 14; s++) {
      const phi = py.phi - py.half + (2 * py.half * s) / 14;
      base.push(at(phi, sec.medullaReach(phi) + 0.01));
    }
    const mid = (py.tip + py.reach) * 0.5;
    const apex = at(py.phi, py.tip);
    const shape = new Path2D();
    shape.moveTo(...apex);
    shape.quadraticCurveTo(...at(py.phi - py.half * 0.95, mid), ...base[0]);
    for (const b of base) shape.lineTo(...b);
    shape.quadraticCurveTo(...at(py.phi + py.half * 0.95, mid), ...apex);
    shape.closePath();
    const grad = g.createLinearGradient(...at(py.phi, py.reach), ...apex);
    grad.addColorStop(0, '#561519');
    grad.addColorStop(0.7, '#6a2024');
    grad.addColorStop(1, '#94463e');
    g.fillStyle = grad;
    g.fill(shape);
    g.save();
    g.clip(shape);
    for (let s = 0; s < 34; s++) {
      const b = base[Math.min(14, Math.round((s / 33) * 14))];
      g.strokeStyle = s % 2 ? 'rgba(35,6,8,0.22)' : 'rgba(255,196,180,0.08)';
      g.lineWidth = 1.3 * px;
      g.beginPath();
      g.moveTo(...apex);
      g.lineTo(b[0] + (rnd() - 0.5) * 6 * px, b[1] + (rnd() - 0.5) * 6 * px);
      g.stroke();
    }
    g.restore();
  });

  // arteries (red) and veins (blue): up between the pyramids, arching along their bases, with
  // small branches into the cortex
  const gaps = sec.pyramids.slice(0, -1).map((py, i) => (py.phi + sec.pyramids[i + 1].phi) / 2);
  const vessel = (color: string, w: number, shift: number, inset: number, twigs: boolean) => {
    g.strokeStyle = color;
    g.lineCap = 'round';
    for (const phi of gaps) {
      const a = phi + shift;
      g.lineWidth = w * k;
      g.beginPath();
      g.moveTo(...at(a, 0.06));
      g.lineTo(...at(a, sec.medullaReach(a) - 0.01));
      g.stroke();
    }
    sec.pyramids.forEach((py) => {
      g.lineWidth = w * 0.8 * k;
      g.beginPath();
      for (let s = 0; s <= 16; s++) {
        const phi = py.phi - py.half - 0.12 + ((2 * py.half + 0.24) * s) / 16;
        const [x, y] = at(phi, sec.medullaReach(phi) + inset);
        if (s === 0) g.moveTo(x, y);
        else g.lineTo(x, y);
      }
      g.stroke();
      if (!twigs) return;
      g.lineWidth = w * 0.35 * k;
      for (let s = 0; s <= 6; s++) {
        const phi = py.phi - py.half + (2 * py.half * s) / 6;
        const r0 = sec.medullaReach(phi) + inset;
        g.beginPath();
        g.moveTo(...at(phi, r0));
        g.lineTo(...at(phi + (rnd() - 0.5) * 0.04, r0 + CORTEX * (0.55 + rnd() * 0.25)));
        g.stroke();
      }
    });
  };
  vessel('#3f5c97', 0.024, 0.045, -0.012, false);
  vessel('#bf332d', 0.019, 0, 0.006, true);
  g.restore(); // back to the whole filled outline

  // in the sinus: the main vessels come in through the opening and branch out
  const branch = (color: string, w: number, shift: number) => {
    g.strokeStyle = color;
    g.lineCap = 'round';
    g.lineWidth = w * k;
    for (const phi of gaps) {
      g.beginPath();
      g.moveTo(...at(toMouth + shift * 3, 0.4));
      g.quadraticCurveTo(...at(toMouth + shift, 0.1), ...at(phi + shift, 0.07));
      g.stroke();
    }
  };
  branch('#3f5c97', 0.022, 0.05);
  branch('#bf332d', 0.017, -0.04);

  // renal pelvis in the sinus, a cup (calyx) round each pyramid tip, the funnel narrowing to the ureter
  const cups = (color: string, extra: number) => {
    g.strokeStyle = color;
    g.fillStyle = color;
    g.lineCap = 'round';
    for (const py of sec.pyramids) {
      g.lineWidth = (0.034 + extra) * k;
      g.beginPath();
      g.moveTo(...at(toMouth, 0.02));
      g.quadraticCurveTo(...at(py.phi, py.tip * 0.4), ...at(py.phi, py.tip - 0.03));
      g.stroke();
      const [tx, ty] = at(py.phi, py.tip);
      const back = -py.phi; // canvas y points down, so angles flip
      g.lineWidth = (0.024 + extra) * k;
      g.beginPath();
      g.arc(tx, ty, 0.045 * k, back + Math.PI - 1.2, back + Math.PI + 1.2);
      g.stroke();
    }
    g.beginPath();
    g.ellipse(...at(toMouth, 0.02), (0.08 + extra) * k, (0.11 + extra) * k, -toMouth, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = (0.09 + extra) * k;
    g.beginPath();
    g.moveTo(...at(toMouth, 0.02));
    g.lineTo(...at(toMouth, 0.6));
    g.stroke();
  };
  cups('#b8a591', 0.014);
  cups('#eee2d3', 0);
  g.restore();

  // tiny filters (glomeruli) in the cortex: the same dots the shader draws when the camera zooms in
  const { G } = DOTS;
  const lo = Math.floor(-HALF / G);
  const hi = Math.ceil(HALF / G);
  const inCortex = (x: number, y: number) => {
    const d = sec.depthInside(x, y);
    return d > 0.02 && d < CORTEX - 0.012 && sec.inTissue(x, y);
  };
  g.fillStyle = 'rgba(112,20,24,0.8)';
  g.beginPath();
  for (let cy = lo; cy <= hi; cy++) {
    for (let cx = lo; cx <= hi; cx++) {
      const d = dotInCell(cx, cy);
      if (!d || !inCortex(d.x, d.y)) continue;
      const r = Math.max(0.8 * px, d.r * k);
      g.moveTo(X(d.x) + r, Y(d.y));
      g.arc(X(d.x), Y(d.y), r, 0, Math.PI * 2);
    }
  }
  g.fill();

  // soft mottling and fine grain, so it reads as tissue rather than flat paint
  const noise = (n: number) => {
    const nc = document.createElement('canvas');
    nc.width = nc.height = n;
    const ng = nc.getContext('2d')!;
    const img = ng.createImageData(n, n);
    for (let i = 0; i < n * n; i++) {
      const v = 90 + rnd() * 76;
      img.data.set([v, v, v, 255], i * 4);
    }
    ng.putImageData(img, 0, 0);
    return nc;
  };
  g.save();
  g.clip(filled);
  g.globalCompositeOperation = 'overlay';
  g.globalAlpha = 0.3;
  g.drawImage(noise(48), 0, 0, size, size);
  g.globalAlpha = 0.12;
  g.drawImage(noise(512), 0, 0, size, size);
  g.restore();
  // the thin, shiny capsule round the kidney tissue (not across the sinus opening)
  g.save();
  g.clip(filled);
  g.lineWidth = 3.2 * px;
  g.strokeStyle = 'rgba(246,224,210,0.95)';
  g.stroke(tissue);
  g.restore();

  // mask: the cortex band in red
  const mk = m.width / (2 * HALF);
  const img = mg.createImageData(m.width, m.height);
  for (let j = 0; j < m.height; j++) {
    for (let i = 0; i < m.width; i++) {
      const x = (i + 0.5) / mk - HALF;
      const y = HALF - (j + 0.5) / mk;
      const d = sec.depthInside(x, y);
      const cortex = d > 0.008 && d < CORTEX - 0.004 && sec.inTissue(x, y) ? 255 : 0;
      img.data.set([cortex, 0, 0, 255], (j * m.width + i) * 4);
    }
  }
  mg.putImageData(img, 0, 0);

  const map = new THREE.CanvasTexture(c);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 4;
  const mask = new THREE.CanvasTexture(m);
  return { map, mask };
}
