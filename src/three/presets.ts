import * as THREE from 'three';
import type { StopId } from '../content/story';

export type V3 = [number, number, number];
export interface Pose {
  pos: V3;
  target: V3;
  fov: number;
}

/**
 * Anatomy anchors are resolved at runtime (the model is scaled ×5 in the world).
 * `enter` is a front-facing point on the left kidney and `n` its outward normal;
 * `tumor` is where the tumor sits on that kidney's lower half and `tn` its outward normal.
 */
export interface AnatomyRefs {
  kidney: THREE.Vector3;
  enter: THREE.Vector3;
  n: THREE.Vector3;
  tumor: THREE.Vector3;
  tn: THREE.Vector3;
}

const add = (a: THREE.Vector3, d: V3): V3 => [a.x + d[0], a.y + d[1], a.z + d[2]];
const along = (a: THREE.Vector3, n: THREE.Vector3, k: number): V3 => [a.x + n.x * k, a.y + n.y * k, a.z + n.z * k];

/**
 * Where each stop's subject sits on a landscape screen, as a fraction of half the screen
 * (x: + moves it right, y: + moves it up): clear of the big caption in the bottom-left corner.
 */
const LAYOUT: Partial<Record<StopId, [number, number]>> = {
  body: [0.3, 0],
  kidneys: [0.3, 0.02],
  inside: [0.25, 0.02],
  nephron: [0.25, 0],
  cause: [0.12, 0.08],
  genes: [0.22, 0.05],
  lump: [0.3, 0.04],
  signs: [0.3, 0],
  ultrasound: [0.28, 0.02],
  scans: [0.26, 0.02],
  treatment: [0.3, 0],
  outlook: [0.3, 0],
  quiz: [0.3, 0],
  end: [0.3, 0],
};

/** Slide the camera sideways/up so the subject lands at (fx, fy) of the half-screen. */
function frameAt(p: Pose, fx: number, fy: number, aspect: number): Pose {
  const pos = new THREE.Vector3(...p.pos);
  const target = new THREE.Vector3(...p.target);
  const fwd = target.clone().sub(pos);
  const halfH = Math.tan(THREE.MathUtils.degToRad(p.fov / 2)) * fwd.length();
  fwd.normalize();
  const right = new THREE.Vector3().crossVectors(fwd, THREE.Object3D.DEFAULT_UP).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd);
  const off = right.multiplyScalar(-fx * halfH * aspect).addScaledVector(up, -fy * halfH);
  return { pos: pos.add(off).toArray() as V3, target: target.add(off).toArray() as V3, fov: p.fov };
}

/** The pose the camera rests at for each stop (`aspect` = viewport width / height). */
export function stopPose(id: StopId, r: AnatomyRefs, aspect = 16 / 9): Pose {
  const p = basePose(id, r);
  const at = aspect >= 1 ? LAYOUT[id] : undefined;
  return at ? frameAt(p, at[0], at[1], aspect) : p;
}

function basePose(id: StopId, r: AnatomyRefs): Pose {
  switch (id) {
    case 'body':
      return { pos: [0.45, 0.2, 4.0], target: [0, -0.02, 0], fov: 30 };
    case 'kidneys':
      return { pos: [0.28, 0.5, 2.55], target: [0, 0.2, -0.04], fov: 30 };
    case 'inside':
      return { pos: [0.35, 0.15, 4.2], target: [0, 0, 0], fov: 34 };
    case 'nephron':
      return { pos: [0.75, 0.3, 6.3], target: [0.45, -0.3, 0], fov: 34 };
    case 'cause':
      return { pos: [0, 0.25, 6.6], target: [0, 0, 0], fov: 36 };
    case 'genes':
      return { pos: [20.2, 0.15, 5.2], target: [20, 0, 0], fov: 34 };
    case 'lump':
      return { pos: add(r.tumor, [0.75, 0.22, 2.1]), target: add(r.tumor, [-0.1, 0.08, 0]), fov: 30 };
    case 'signs':
      return { pos: [0.6, 0.05, 3.9], target: [0.06, -0.08, 0], fov: 30 };
    case 'ultrasound':
      return { pos: [0.35, 0.3, 5.3], target: [0, 0.1, 0], fov: 34 };
    case 'scans':
      return { pos: [20.45, 0.35, 7.6], target: [20, -0.05, 0], fov: 34 };
    case 'treatment':
      return { pos: [0.75, 0.42, 2.7], target: [0.15, 0.22, 0], fov: 30 };
    case 'outlook':
      return { pos: [-0.35, 0.42, 2.7], target: [-0.05, 0.2, 0], fov: 30 };
    case 'quiz':
      return { pos: [0.4, 0.18, 4.1], target: [0, -0.02, 0], fov: 30 };
    case 'end':
      return { pos: [0.8, 0.28, 4.2], target: [0, -0.02, 0], fov: 30 };
    default:
      // history stops: the engraved-plate framing (telephoto, like a flat atlas plate)
      return PLATE;
  }
}

/** Flat, telephoto framing used while the model is still an engraving. */
export const PLATE: Pose = { pos: [0, 0, 8.7], target: [0, 0, 0], fov: 16 };

/** Where the camera dives to when leaving a stop through a surface (end of the zoom-in). */
export function exitPose(id: StopId, r: AnatomyRefs): Pose | null {
  switch (id) {
    case 'kidneys':
      return { pos: along(r.enter, r.n, 0.06), target: along(r.enter, r.n, -0.1), fov: 30 };
    case 'inside':
      // into the outer layer, where the filters are
      return { pos: [0.56, 0.32, 0.26], target: [0.56, 0.32, 0], fov: 34 };
    case 'nephron':
      // into the wall of the tube, down to its cells
      return { pos: [1.28, -0.95, 0.55], target: [1.28, -0.95, 0.1], fov: 34 };
    case 'cause':
      // into the nucleus of a young cell
      return { pos: [1.45, 0.2, 0.9], target: [1.45, 0.2, 0], fov: 36 };
    case 'genes':
      return { pos: [20.2, 0.2, 14], target: [20, 0, 0], fov: 36 };
    case 'signs':
      return { pos: along(r.tumor, r.tn, 0.1), target: along(r.tumor, r.tn, -0.08), fov: 30 };
    case 'ultrasound':
      // into the lump on the scan
      return { pos: [0.38, -0.55, 0.6], target: [0.38, -0.55, 0], fov: 34 };
    case 'scans':
      return { pos: [20.3, 0.3, 17], target: [20, 0, 0], fov: 36 };
    default:
      return null;
  }
}

/**
 * Arriving by diving in: the next scene comes towards the camera from farther away (along a
 * slightly turned line, for parallax), so the whole journey keeps moving forward.
 */
function approach(p: Pose, k: number, yaw = 0.2): Pose {
  const dx = p.pos[0] - p.target[0];
  const dy = p.pos[1] - p.target[1];
  const dz = p.pos[2] - p.target[2];
  const c = Math.cos(yaw);
  const s = Math.sin(yaw);
  return {
    pos: [p.target[0] + (dx * c + dz * s) * k, p.target[1] + dy * k, p.target[2] + (dz * c - dx * s) * k],
    target: p.target,
    fov: p.fov,
  };
}

/**
 * Where the camera appears when arriving at a stop through the veil. Dive-ins approach from
 * farther away; pull-backs start close to a surface of the larger scene and back away from it.
 */
export function entryPose(id: StopId, r: AnatomyRefs): Pose | null {
  switch (id) {
    case 'inside':
      return approach(stopPose(id, r), 1.9);
    case 'nephron':
      return approach(stopPose(id, r), 2.0, -0.22);
    case 'cause':
      return approach(stopPose(id, r), 2.1);
    case 'genes':
      return approach(stopPose(id, r), 2.2, 0.12);
    case 'ultrasound':
      return approach(stopPose(id, r), 2.0, -0.2);
    case 'scans':
      return approach(stopPose(id, r), 2.1, 0.12);
    case 'lump':
      return { pos: along(r.tumor, r.tn, 0.14), target: along(r.tumor, r.tn, -0.04), fov: 30 };
    case 'treatment':
      return { pos: along(r.enter, r.n, 0.18), target: along(r.enter, r.n, -0.02), fov: 30 };
    default:
      return null;
  }
}

export function lerpPose(a: Pose, b: Pose, k: number, out: { pos: THREE.Vector3; target: THREE.Vector3 }) {
  out.pos.set(a.pos[0] + (b.pos[0] - a.pos[0]) * k, a.pos[1] + (b.pos[1] - a.pos[1]) * k, a.pos[2] + (b.pos[2] - a.pos[2]) * k);
  out.target.set(
    a.target[0] + (b.target[0] - a.target[0]) * k,
    a.target[1] + (b.target[1] - a.target[1]) * k,
    a.target[2] + (b.target[2] - a.target[2]) * k,
  );
  return a.fov + (b.fov - a.fov) * k;
}
