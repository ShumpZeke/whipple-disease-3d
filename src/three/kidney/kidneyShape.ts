import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/**
 * A kidney cut in half from top to bottom (a coronal section of the LEFT kidney seen from the
 * front, so the notch where vessels and the ureter attach, the hilum, faces left). Units: the
 * section is about 1.9 tall. The cut face lies in the plane z = 0, facing +Z.
 */
export const HALF = 1.05; // the section texture covers [-HALF, HALF]² of the cut plane
export const DEPTH = 0.42; // how far the rounded back half reaches behind the cut
/** Centre of the renal sinus, the hollow the pyramids point at. */
export const SINUS = new THREE.Vector2(-0.12, 0);
export const CORTEX = 0.16;

/** Distance from the centre to the outline in direction `a` (radians from +X). */
export function outlineRadius(a: number) {
  const ax = 0.62;
  const ay = 0.95;
  const c = Math.cos(a);
  const s = Math.sin(a);
  let r = (ax * ay) / Math.hypot(ay * c, ax * s);
  // the upper pole is a little broader than the lower one
  r *= 1 + 0.04 * s;
  // the hilum: a notch on the inner (left) side
  const d = Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI));
  r *= 1 - 0.38 * Math.exp(-(d * d) / (0.42 * 0.42));
  return r;
}

export function outlinePoint(a: number, inset = 0, out = new THREE.Vector2()) {
  const r = outlineRadius(a) - inset;
  return out.set(Math.cos(a) * r, Math.sin(a) * r);
}

/** How deep a point of the cut face is inside the outline (negative outside). */
export function depthInside(x: number, y: number) {
  const a = Math.atan2(y, x);
  return outlineRadius(a) - Math.hypot(x, y);
}

/** From the sinus centre, how far along direction `phi` the medulla ends and the cortex begins. */
export function medullaReach(phi: number) {
  const dx = Math.cos(phi);
  const dy = Math.sin(phi);
  for (let t = 0.02; t < 2; t += 0.004) {
    if (depthInside(SINUS.x + dx * t, SINUS.y + dy * t) < CORTEX) return t;
  }
  return 0.5;
}

/** The renal pyramids: centre angle around the sinus, half-width and where the tip (papilla) is. */
export const PYRAMIDS = [-120, -80, -40, 0, 40, 80, 120].map((deg, i) => ({
  phi: THREE.MathUtils.degToRad(deg),
  half: THREE.MathUtils.degToRad(i === 0 || i === 6 ? 12 : 14),
  tip: 0.3 + (i % 3) * 0.015,
}));

/** The cut face: a flat shape with UVs matching the painted section texture. */
export function sectionGeometry(segments = 256) {
  const shape = new THREE.Shape();
  for (let i = 0; i < segments; i++) {
    const p = outlinePoint((i / segments) * Math.PI * 2);
    if (i === 0) shape.moveTo(p.x, p.y);
    else shape.lineTo(p.x, p.y);
  }
  shape.closePath();
  const g = new THREE.ShapeGeometry(shape, 1);
  const pos = g.getAttribute('position');
  const uv = g.getAttribute('uv');
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) + HALF) / (2 * HALF), (pos.getY(i) + HALF) / (2 * HALF));
  }
  return g;
}

/** The rounded back half of the kidney behind the cut (its rim meets the outline exactly). */
export function backGeometry(around = 160, down = 18) {
  const pos: number[] = [];
  const idx: number[] = [];
  for (let j = 0; j <= down; j++) {
    const phi = (j / down) * (Math.PI / 2);
    for (let i = 0; i <= around; i++) {
      const a = (i / around) * Math.PI * 2;
      const r = outlineRadius(a) * Math.cos(phi);
      pos.push(Math.cos(a) * r, Math.sin(a) * r, -DEPTH * Math.sin(phi));
    }
  }
  const row = around + 1;
  for (let j = 0; j < down; j++) {
    for (let i = 0; i < around; i++) {
      const a = j * row + i;
      // wound so the faces (and normals) point out of the kidney
      idx.push(a, a + row, a + 1, a + 1, a + row, a + row + 1);
    }
  }
  const raw = new THREE.BufferGeometry();
  raw.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  raw.setIndex(idx);
  // weld the seam and the back pole so the shading is smooth all the way round
  const g = mergeVertices(raw, 1e-5);
  g.computeVertexNormals();
  return g;
}
