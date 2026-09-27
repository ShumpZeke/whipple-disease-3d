import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * Procedural segment of small intestine (axis = X), built for the cutaway scene.
 * Units: tube outer radius = 1. Layers from outside in: serosa, muscularis (longitudinal, circular),
 * submucosa, mucosa. Plicae circulares (circular folds) are mucosa + submucosa ridges.
 */
export const SEG = {
  length: 5.2,
  rOuter: 1.0,
  rSerosa: 0.975,
  rLong: 0.915,
  rCirc: 0.8,
  rMucosaBase: 0.64,
  mucosa: 0.045,
  /** wedge removed so the visitor can see in: centre angle and half-width (radians) */
  wedgeCenter: THREE.MathUtils.degToRad(28),
  wedgeHalf: THREE.MathUtils.degToRad(62),
};

export interface Fold {
  x: number;
  h: number;
  w: number;
  phase: number;
  span: number;
}

export function makeFolds(seed = 7): Fold[] {
  const rnd = mulberry32(seed);
  const folds: Fold[] = [];
  let x = -SEG.length / 2 + 0.22;
  while (x < SEG.length / 2 - 0.1) {
    folds.push({
      x,
      h: 0.13 + rnd() * 0.08,
      w: 0.075 + rnd() * 0.03,
      phase: rnd() * Math.PI * 2,
      span: Math.PI * (1.25 + rnd() * 0.7),
    });
    x += 0.3 + rnd() * 0.1;
  }
  return folds;
}

/** Angular window (smooth) for a crescent-shaped fold. */
function arc(theta: number, phase: number, span: number) {
  let d = Math.abs(((theta - phase + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
  d = d / (span / 2);
  return d >= 1 ? 0 : 0.5 + 0.5 * Math.cos(Math.PI * d);
}

export function innerRadius(x: number, theta: number, folds: Fold[]) {
  let f = 0;
  for (const k of folds) {
    const t = (x - k.x) / k.w;
    if (Math.abs(t) > 2.6) continue;
    f = Math.max(f, k.h * Math.exp(-t * t) * arc(theta, k.phase, k.span));
  }
  return SEG.rMucosaBase - f;
}

/** Point on a tube surface: θ = 0 points toward +Z, θ = π/2 toward +Y. */
export function tubePoint(x: number, theta: number, r: number, out = new THREE.Vector3()) {
  return out.set(x, r * Math.sin(theta), r * Math.cos(theta));
}

export function mulberry32(a: number) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Parametric sheet over (x, θ) outside the removed wedge. */
function sheet(
  nx: number,
  nt: number,
  radius: (x: number, t: number) => number,
  flip: boolean,
): THREE.BufferGeometry {
  const t0 = SEG.wedgeCenter + SEG.wedgeHalf;
  const t1 = SEG.wedgeCenter + Math.PI * 2 - SEG.wedgeHalf;
  const pos: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  for (let i = 0; i <= nx; i++) {
    const x = -SEG.length / 2 + (SEG.length * i) / nx;
    for (let j = 0; j <= nt; j++) {
      const t = t0 + ((t1 - t0) * j) / nt;
      tubePoint(x, t, radius(x, t), p);
      pos.push(p.x, p.y, p.z);
    }
  }
  const row = nt + 1;
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nt; j++) {
      const a = i * row + j;
      const b = a + row;
      if (flip) idx.push(a, a + 1, b, b, a + 1, b + 1);
      else idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

export function outerSurface() {
  return sheet(90, 120, () => SEG.rOuter, false);
}

export function innerSurface(folds: Fold[]) {
  return sheet(260, 180, (x, t) => innerRadius(x, t, folds), true);
}

export type Layer = 0 | 1 | 2 | 3 | 4; // serosa, longitudinal, circular, submucosa, mucosa

export const LAYER_COLORS = ['#efc9bb', '#b65a52', '#a4463f', '#ecc0ad', '#cf7568'];
export const LAYER_NAMES = ['Serosa', 'Muscularis · longitudinal', 'Muscularis · circular', 'Submucosa', 'Mucosa'];

/**
 * Cut faces (the two wedge planes and the two open ends), split into layer strips.
 * Each vertex gets a `layer` attribute for the fibre/vessel detail shader.
 */
export function cutFaces(folds: Fold[]) {
  const pos: number[] = [];
  const col: number[] = [];
  const lay: number[] = [];
  const nrm: number[] = [];
  const idx: number[] = [];
  const c = new THREE.Color();
  const p = new THREE.Vector3();
  const bounds = (x: number, t: number): [number, number, Layer][] => {
    const rin = innerRadius(x, t, folds);
    return [
      [SEG.rSerosa, SEG.rOuter, 0],
      [SEG.rLong, SEG.rSerosa, 1],
      [SEG.rCirc, SEG.rLong, 2],
      [rin + SEG.mucosa, SEG.rCirc, 3],
      [rin, rin + SEG.mucosa, 4],
    ];
  };
  const pushQuadStrip = (samples: { x: number; t: number }[], normal: THREE.Vector3, flip: boolean) => {
    for (let L = 0; L < 5; L++) {
      const base = pos.length / 3;
      for (const s of samples) {
        const b = bounds(s.x, s.t)[L];
        for (const r of [b[0], b[1]]) {
          tubePoint(s.x, s.t, r, p);
          pos.push(p.x, p.y, p.z);
          nrm.push(normal.x, normal.y, normal.z);
          c.set(LAYER_COLORS[L]);
          col.push(c.r, c.g, c.b);
          lay.push(L);
        }
      }
      for (let i = 0; i < samples.length - 1; i++) {
        const a = base + i * 2;
        if (flip) idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        else idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
  };
  // wedge planes (θ fixed, x varies)
  for (const [t, flip] of [
    [SEG.wedgeCenter + SEG.wedgeHalf, false],
    [SEG.wedgeCenter - SEG.wedgeHalf + Math.PI * 2, true],
  ] as [number, boolean][]) {
    const samples = Array.from({ length: 261 }, (_, i) => ({ x: -SEG.length / 2 + (SEG.length * i) / 260, t }));
    // plane normal = derivative direction of θ (tangent), sign chosen to face the opening
    const n = new THREE.Vector3(0, Math.cos(t), -Math.sin(t)).multiplyScalar(flip ? 1 : -1);
    pushQuadStrip(samples, n, flip);
  }
  // end rings (x fixed, θ varies)
  for (const [x, flip] of [
    [SEG.length / 2, true],
    [-SEG.length / 2, false],
  ] as [number, boolean][]) {
    const t0 = SEG.wedgeCenter + SEG.wedgeHalf;
    const t1 = SEG.wedgeCenter + Math.PI * 2 - SEG.wedgeHalf;
    const samples = Array.from({ length: 181 }, (_, i) => ({ x, t: t0 + ((t1 - t0) * i) / 180 }));
    pushQuadStrip(samples, new THREE.Vector3(Math.sign(x), 0, 0), flip);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.setAttribute('layer', new THREE.Float32BufferAttribute(lay, 1));
  g.setIndex(idx);
  return g;
}

/** A single villus: tapered, round-tipped finger along +Y, height 1, base radius 1 (scaled per instance). */
export function villusGeometry(radial = 7, rings = 5) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= rings; i++) {
    const v = i / rings;
    pts.push(new THREE.Vector2(1 - 0.18 * v, v * 0.82));
  }
  for (let i = 1; i <= 4; i++) {
    const a = (i / 4) * (Math.PI / 2);
    pts.push(new THREE.Vector2(0.82 * Math.cos(a) + 0.0001, 0.82 + 0.18 * Math.sin(a)));
  }
  const lathe = new THREE.LatheGeometry(pts, radial);
  lathe.deleteAttribute('uv');
  lathe.deleteAttribute('normal');
  const g = mergeVertices(lathe, 1e-3);
  g.computeVertexNormals();
  return g;
}

/** Instance transforms for villi covering the inner surface. */
export function villiInstances(folds: Fold[], count: number, seed = 3) {
  const rnd = mulberry32(seed);
  const mats: THREE.Matrix4[] = [];
  const t0 = SEG.wedgeCenter + SEG.wedgeHalf + 0.02;
  const t1 = SEG.wedgeCenter + Math.PI * 2 - SEG.wedgeHalf - 0.02;
  const p = new THREE.Vector3();
  const px = new THREE.Vector3();
  const pt = new THREE.Vector3();
  const n = new THREE.Vector3();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const e = 0.004;
  for (let i = 0; i < count; i++) {
    const x = -SEG.length / 2 + 0.04 + rnd() * (SEG.length - 0.08);
    const t = t0 + rnd() * (t1 - t0);
    const r = innerRadius(x, t, folds);
    tubePoint(x, t, r, p);
    tubePoint(x + e, t, innerRadius(x + e, t, folds), px).sub(p);
    tubePoint(x, t + e, innerRadius(x, t + e, folds), pt).sub(p);
    n.crossVectors(pt, px).normalize(); // points inward (toward the axis)
    if (n.dot(p) > 0) n.negate();
    q.setFromUnitVectors(up, n);
    const h = 0.085 + rnd() * 0.03;
    const w = 0.02 + rnd() * 0.006;
    mats.push(new THREE.Matrix4().compose(p.clone(), q.clone(), new THREE.Vector3(w, h, w)));
  }
  return mats;
}
