import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32 } from '../random';

/** The DNA double helix, along X and centred on 0 (DNA units). */
export const HELIX = { length: 5.2, turns: 5, radius: 0.27, gene: [0.5, 0.74] as const, change: 0.62 };

/** A curve given by a function of t (0..1). */
class Strand extends THREE.Curve<THREE.Vector3> {
  fn: (t: number) => THREE.Vector3;
  constructor(fn: (t: number) => THREE.Vector3) {
    super();
    this.fn = fn;
  }
  getPoint(t: number, out = new THREE.Vector3()) {
    return out.copy(this.fn(t));
  }
}

/** Two backbones and coloured base pairs; one stretch (the gene) is gold and one letter is changed. */
export function helixGeometry() {
  const { length, turns, radius, gene: GENE, change: CHANGE } = HELIX;
  const strand = (phase: number) => (t: number) => {
    const a = t * turns * Math.PI * 2 + phase;
    return new THREE.Vector3((t - 0.5) * length, Math.cos(a) * radius, Math.sin(a) * radius);
  };
  const s1 = strand(0);
  const s2 = strand(Math.PI * 0.8);
  const color = (g: THREE.BufferGeometry, pick: (i: number) => THREE.Color) => {
    const n = g.getAttribute('position').count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) arr.set(pick(i).toArray(), i * 3);
    g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    return g;
  };
  const inGene = (t: number) => t >= GENE[0] && t <= GENE[1];
  const parts: THREE.BufferGeometry[] = [];
  const gold = new THREE.Color('#f0b44c');
  for (const [fn, base] of [
    [s1, new THREE.Color('#efe7d6')],
    [s2, new THREE.Color('#9fb7c9')],
  ] as const) {
    const segs = 400;
    const radial = 8;
    const tube = new THREE.TubeGeometry(new Strand(fn), segs, 0.045, radial, false);
    parts.push(color(tube, (i) => (inGene(Math.floor(i / (radial + 1)) / segs) ? gold : base)).toNonIndexed());
  }
  const letters = ['#e07a5f', '#f2cc8f', '#81b29a', '#3d85c6'].map((c) => new THREE.Color(c));
  const rnd = mulberry32(8);
  const pairs = 120;
  let changeT = CHANGE;
  for (let i = 0; i < pairs; i++) {
    const t = (i + 0.5) / pairs;
    const a = s1(t);
    const b = s2(t);
    if (Math.abs(t - CHANGE) <= 0.5 / pairs) {
      changeT = t;
      continue;
    }
    const pair = Math.floor(rnd() * 2) * 2;
    for (const [from, to, c] of [
      [a, a.clone().lerp(b, 0.5), letters[pair]],
      [a.clone().lerp(b, 0.5), b, letters[pair + 1]],
    ] as const) {
      const g = new THREE.CylinderGeometry(0.022, 0.022, from.distanceTo(to), 6);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize()));
      g.translate((from.x + to.x) / 2, (from.y + to.y) / 2, (from.z + to.z) / 2);
      parts.push(color(g, () => c).toNonIndexed());
    }
  }
  const merged = mergeGeometries(parts)!;
  merged.computeVertexNormals();
  const ca = s1(changeT);
  const cb = s2(changeT);
  const mid = ca.clone().lerp(cb, 0.5);
  const change = new THREE.CylinderGeometry(0.04, 0.04, ca.distanceTo(cb), 10);
  change.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), cb.clone().sub(ca).normalize()));
  change.translate(mid.x, mid.y, mid.z);
  return { merged, change, changeAt: mid };
}
