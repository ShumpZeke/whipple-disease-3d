import * as THREE from 'three';
import { mulberry32 } from '../random';

/*
 * Drawn illustrations of scan pictures (NOT patient images). Each is painted pixel by pixel from
 * a few simple shapes plus noise. The shapes are placed where the 3D organs really cross the scan's
 * plane, so the picture lines up with the model it is drawn over.
 */

const smooth = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Signed distance to an ellipse (approximate; negative inside). */
function ellipse(x: number, y: number, cx: number, cy: number, rx: number, ry: number, rot = 0) {
  const c = Math.cos(rot);
  const s = Math.sin(rot);
  const dx = x - cx;
  const dy = y - cy;
  const u = (dx * c + dy * s) / rx;
  const v = (-dx * s + dy * c) / ry;
  return (Math.hypot(u, v) - 1) * Math.min(rx, ry);
}

/** Smoothed random field (blocky noise blurred by bilinear sampling), values 0..1. */
function field(n: number, seed: number) {
  const rnd = mulberry32(seed);
  const a = new Float32Array(n * n);
  for (let i = 0; i < a.length; i++) a[i] = rnd();
  return (x: number, y: number) => {
    const fx = (((x % 1) + 1) % 1) * n;
    const fy = (((y % 1) + 1) % 1) * n;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;
    const at = (i: number, j: number) => a[((j + n) % n) * n + ((i + n) % n)];
    const top = at(x0, y0) * (1 - tx) + at(x0 + 1, y0) * tx;
    const bot = at(x0, y0 + 1) * (1 - tx) + at(x0 + 1, y0 + 1) * tx;
    return top * (1 - ty) + bot * ty;
  };
}

function toTexture(c: HTMLCanvasElement) {
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export interface Blob {
  x: number;
  y: number;
  rx: number;
  ry: number;
  rot?: number;
}
export interface Ball {
  x: number;
  y: number;
  r: number;
}

/**
 * Ultrasound: a fan-shaped grey picture made of speckle. The canvas covers a square of side
 * 2·`outer` centred on the probe; the fan opens downwards (−y is deeper).
 */
export const FAN = { inner: 0.25, outer: 2.05, half: THREE.MathUtils.degToRad(36) };
export interface SonoLayout {
  kidney: Blob;
  tumor: Ball;
}

export function makeSonogramTexture(L: SonoLayout, size = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  const speckle = field(160, 11);
  const blotch = field(14, 12);
  const grain = mulberry32(13);
  const { inner, outer, half } = FAN;
  const K = L.kidney;
  const T = L.tumor;
  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const x = ((i + 0.5) / size) * 2 * outer - outer;
      const y = outer - ((j + 0.5) / size) * 2 * outer;
      const r = Math.hypot(x, y);
      const a = Math.atan2(x, -y);
      let v = 0;
      if (y < 0 && r > inner && r < outer && Math.abs(a) < half) {
        const depth = r - inner;
        // skin, fat and muscle near the probe
        let echo = 0.34 + 0.5 * Math.exp(-((depth - 0.02) ** 2) / 0.0006) + 0.22 * Math.exp(-((depth - 0.2) ** 2) / 0.0012);
        echo += 0.14 * Math.exp(-((depth - 0.34) ** 2) / 0.002);
        // the kidney: darker outer layer, bright middle where the fat and collecting system are
        const dk = ellipse(x, y, K.x, K.y, K.rx, K.ry, K.rot ?? 0);
        if (dk < 0.02) {
          const rim = Math.exp(-(dk ** 2) / 0.0004);
          const sinus = ellipse(x, y, K.x, K.y + K.ry * 0.05, K.rx * 0.55, K.ry * 0.35, K.rot ?? 0);
          echo = dk < 0 ? 0.22 + 0.55 * smooth(0.04, -0.06, sinus) : echo;
          echo += 0.5 * rim;
        }
        // the tumor: a big round lump with a bright thin edge and a patchy inside
        const dt = Math.hypot(x - T.x, y - T.y) - T.r;
        if (dt < 0.03) {
          const inside = 0.3 + 0.28 * blotch(x * 0.9 + 0.3, y * 0.9) + 0.12 * blotch(x * 2.1, y * 2.1 + 0.5);
          echo = dt < 0 ? inside - 0.18 * smooth(0.4, 0.62, blotch(x * 1.7 + 0.2, y * 1.7)) : echo;
          echo += 0.55 * Math.exp(-(dt ** 2) / 0.0003);
        }
        // grainy speckle, stretched sideways like a real scan
        const s = speckle(x * 0.9 + 0.5, y * 3.2) * 0.65 + grain() * 0.5;
        v = echo * (0.35 + 0.95 * s);
        v *= 1 - 0.38 * (depth / (outer - inner));
        v *= smooth(half, half - 0.04, Math.abs(a)) * smooth(outer, outer - 0.05, r);
      }
      const n = Math.max(0, Math.min(255, Math.round(v * 225)));
      img.data.set([n, n, Math.min(255, n + 4), 255], (j * size + i) * 4);
    }
  }
  g.putImageData(img, 0, 0);
  // depth marks along the right edge, like on a scanner screen
  g.fillStyle = 'rgba(235,240,245,0.75)';
  for (let d = 0.5; d < outer - inner; d += 0.25) {
    const r = inner + d;
    const x = Math.sin(half) * r + 0.06;
    const y = -Math.cos(half) * r;
    const px = ((x + outer) / (2 * outer)) * size;
    const py = ((outer - y) / (2 * outer)) * size;
    g.beginPath();
    g.arc(px, py, d % 1 === 0 ? 2.4 : 1.4, 0, Math.PI * 2);
    g.fill();
  }
  return toTexture(c);
}

/**
 * CT: one slice across the belly, the way doctors look at it (from the feet: the patient's right
 * side on the left of the picture, the front at the top). Image units: the picture's radius is 1.
 */
export interface CtLayout {
  body: Blob;
  spine: { x: number; y: number };
  aorta: Ball;
  ivc: Blob;
  rightKidney: Blob;
  leftKidney: Blob;
  tumor: Ball;
}

export function makeCtTexture(L: CtLayout, size = 512): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const g = c.getContext('2d')!;
  const img = g.createImageData(size, size);
  const blotch = field(12, 21);
  const fine = mulberry32(22);
  const rnd = mulberry32(23);
  const T = L.tumor;
  const B = L.body;
  const sp = L.spine;
  // loops of bowel in front: grey walls, some with air (black) inside
  const bowel = Array.from({ length: 16 }, () => ({
    x: B.x - B.rx * 0.45 + rnd() * B.rx * 0.9,
    y: B.y + B.ry * (0.05 + rnd() * 0.6),
    r: 0.05 + rnd() * 0.05,
    air: rnd() < 0.45,
  })).filter((b) => Math.hypot(b.x - T.x, b.y - T.y) > T.r + b.r + 0.02 && ellipse(b.x, b.y, B.x, B.y, B.rx * 0.85, B.ry * 0.82) < -b.r);

  for (let j = 0; j < size; j++) {
    for (let i = 0; i < size; i++) {
      const x = ((i + 0.5) / size) * 2 - 1;
      const y = 1 - ((j + 0.5) / size) * 2;
      let v = 0.02; // air outside the body
      const body = ellipse(x, y, B.x, B.y, B.rx, B.ry);
      if (body < 0) {
        const wall = ellipse(x, y, B.x, B.y + 0.01, B.rx - 0.1, B.ry - 0.11);
        v = wall > 0 ? 0.24 : 0.28; // fat under the skin, fat around the organs
        if (body > -0.012) v = 0.5; // skin
        if (wall < 0 && wall > -0.035) v = 0.52; // belly muscles
        // liver, on the patient's right (left of the picture), in front of the right kidney
        if (ellipse(x, y, L.rightKidney.x - 0.12, L.rightKidney.y + 0.26, 0.3, 0.26, 0.3) < 0 && wall < 0) v = 0.6 + 0.03 * blotch(x * 3, y * 3);
        for (const b of bowel) {
          const d = Math.hypot(x - b.x, y - b.y) - b.r;
          if (d < 0) v = d > -0.018 ? 0.55 : b.air ? 0.04 : 0.36;
        }
        // back muscles and the muscles beside the spine
        for (const s of [-1, 1]) {
          if (ellipse(x, y, sp.x + s * 0.2, sp.y - 0.14, 0.15, 0.1, s * 0.3) < 0) v = 0.5;
          if (ellipse(x, y, sp.x + s * 0.13, sp.y + 0.09, 0.07, 0.09) < 0) v = 0.5;
        }
        // spine: bright bone, with the dark spinal canal behind the vertebra
        const vert = Math.hypot(x - sp.x, y - sp.y) - 0.12;
        if (vert < 0) v = vert > -0.02 ? 0.97 : 0.8;
        if (ellipse(x, y, sp.x, sp.y - 0.2, 0.11, 0.07) < 0 && Math.abs(x - sp.x) < 0.14) v = 0.9;
        if (Math.hypot(x - sp.x, y - (sp.y - 0.17)) < 0.05) v = 0.3;
        // aorta and the big vein, bright with dye
        if (Math.hypot(x - L.aorta.x, y - L.aorta.y) < L.aorta.r) v = 0.88;
        if (ellipse(x, y, L.ivc.x, L.ivc.y, L.ivc.rx, L.ivc.ry) < 0) v = 0.72;
        // right kidney: bright outer layer, darker middle, fat at the notch
        const R = L.rightKidney;
        const rk = ellipse(x, y, R.x, R.y, R.rx, R.ry, R.rot ?? 0);
        if (rk < 0) v = rk > -0.035 ? 0.84 : ellipse(x, y, R.x + 0.05, R.y + 0.03, R.rx * 0.36, R.ry * 0.36, R.rot ?? 0) < 0 ? 0.3 : 0.64;
        // left kidney, stretched thin around the tumor like a claw
        const K = L.leftKidney;
        const lk = ellipse(x, y, K.x, K.y, K.rx, K.ry, K.rot ?? 0);
        if (lk < 0) v = lk > -0.035 ? 0.84 : 0.64;
        const dt = Math.hypot(x - T.x, y - T.y) - T.r;
        if (dt < 0.03 && dt > 0 && lk < 0.06) v = 0.82;
        if (dt < 0) {
          v = 0.46 + 0.1 * blotch(x * 2.2 + 0.4, y * 2.2) - 0.14 * smooth(0.55, 0.75, blotch(x * 3.3, y * 3.3 + 0.2));
          if (dt > -0.012) v = 0.58;
        }
        v += (fine() - 0.5) * 0.05;
      }
      const n = Math.max(0, Math.min(255, Math.round(v * 240)));
      img.data.set([n, n, n, 255], (j * size + i) * 4);
    }
  }
  g.putImageData(img, 0, 0);
  // round field of view
  g.globalCompositeOperation = 'destination-in';
  g.beginPath();
  g.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  g.fill();
  return toTexture(c);
}
