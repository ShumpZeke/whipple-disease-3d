import * as THREE from 'three';
import type { StopId } from '../content/story';

export type V3 = [number, number, number];
export interface Pose {
  pos: V3;
  target: V3;
  fov: number;
}

/**
 * Anatomy anchors are resolved at runtime (the model is scaled ×4 in the world).
 * `enter` is a front-facing point on a loop of small intestine; `n` its outward normal.
 */
export interface AnatomyRefs {
  si: THREE.Vector3;
  enter: THREE.Vector3;
  n: THREE.Vector3;
}

const add = (a: THREE.Vector3, d: V3): V3 => [a.x + d[0], a.y + d[1], a.z + d[2]];
const along = (a: THREE.Vector3, n: THREE.Vector3, k: number): V3 => [a.x + n.x * k, a.y + n.y * k, a.z + n.z * k];

/**
 * Where each stop's subject sits on a landscape screen, as a fraction of half the screen
 * (x: + moves it right, y: + moves it up): clear of the big caption in the bottom-left corner.
 */
const LAYOUT: Partial<Record<StopId, [number, number]>> = {
  body: [0.3, 0],
  intestine: [0.4, 0.04],
  wall: [0.22, 0.12],
  villi: [0.3, 0],
  cause: [0.12, 0.04],
  symptoms: [0.25, 0],
  stain: [0.36, 0.04],
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
  const p = basePose(id, r, aspect);
  const at = aspect >= 1 ? LAYOUT[id] : undefined;
  return at ? frameAt(p, at[0], at[1], aspect) : p;
}

function basePose(id: StopId, r: AnatomyRefs, aspect: number): Pose {
  switch (id) {
    case 'body':
      return { pos: [0.55, 0.25, 4.15], target: [0, -0.04, 0], fov: 30 };
    case 'intestine':
      return { pos: add(r.si, [-0.5, 0.32, 2.85]), target: add(r.si, [0.02, 0.06, 0]), fov: 30 };
    case 'wall':
      return { pos: [3.7, 2.1, 6.3], target: [0.35, -0.1, 0], fov: 34 };
    case 'villi':
      return { pos: [1.5, 1.2, 3.45], target: [0.02, 0.5, 0.8], fov: 34 };
    case 'cause':
      return { pos: [0.6, 0.6, 7.2], target: [0, 0, 0], fov: 36 };
    case 'symptoms':
      return { pos: [0.3, 2.4, 4.1], target: [0, 0.5, 0.45], fov: 36 };
    case 'spread':
      // on a phone held upright there is no room beside the gut: frame the column of other organs
      if (aspect < 0.8) return { pos: [2.24, -0.5, 7.35], target: [2.24, -0.65, 0], fov: 30 };
      // the gut and the other organs sit in the top two-thirds, above the caption
      return { pos: [0.55, -0.5, 7.2], target: [0.55, -0.66, 0], fov: 30 };
    case 'biopsy':
      return { pos: [2.55, 1.5, 1.05], target: [0.2, 0.02, 0.12], fov: 42 };
    case 'stain':
      return { pos: [20, -0.1, 9.4], target: [20, -0.25, 0], fov: 34 };
    case 'pcr':
      return { pos: [40.3, 0.45, 7.75], target: [39.55, 0.15, 0], fov: 36 };
    case 'treatment':
      return { pos: [-1.2, 2.35, 3.8], target: [0, 0.5, 0.15], fov: 36 };
    case 'quiz':
      return { pos: [0.45, 0.22, 4.25], target: [0, -0.04, 0], fov: 30 };
    case 'end':
      return { pos: [0.9, 0.34, 4.4], target: [0, -0.03, 0], fov: 30 };
    default:
      // history stops: the engraved-plate framing (telephoto, like a flat atlas plate)
      return PLATE;
  }
}

/** Flat, telephoto framing used while the model is still a 1907-style engraving. */
export const PLATE: Pose = { pos: [0, -0.05, 8.7], target: [0, -0.05, 0], fov: 16 };

/** Where the camera dives to when leaving a stop through a surface (end of the zoom-in). */
export function exitPose(id: StopId, r: AnatomyRefs): Pose | null {
  switch (id) {
    case 'intestine':
    case 'spread':
      return { pos: along(r.enter, r.n, 0.07), target: along(r.enter, r.n, -0.08), fov: 30 };
    case 'wall':
      return { pos: [-0.248, -0.226, -0.457], target: [-0.23, -0.305, -0.606], fov: 34 };
    case 'villi':
      return { pos: [0.0, 0.5, 1.42], target: [0, 0.5, 1.1], fov: 34 };
    case 'cause':
      return { pos: [0.6, 0.6, 18], target: [0, 0, 0], fov: 36 };
    case 'symptoms':
      return { pos: [0.3, 5.5, 7.5], target: [0, 0.5, 0.2], fov: 40 };
    case 'biopsy':
      return { pos: [0.62, 0.22, 0.34], target: [0.35, -0.02, 0.2], fov: 42 };
    case 'stain':
      return { pos: [20.25, 0.35, 0.35], target: [20.25, 0.35, 0], fov: 34 };
    case 'pcr':
      return { pos: [40.2, 0.4, 17], target: [39.55, 0.15, 0], fov: 36 };
    case 'treatment':
      return { pos: [-1.2, 5.5, 7.5], target: [0, 0.5, 0.2], fov: 40 };
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
    case 'wall':
      return approach(stopPose(id, r), 1.9);
    case 'villi':
      return approach(stopPose(id, r), 1.7, -0.25);
    case 'cause':
      return approach(stopPose(id, r), 2.1);
    case 'biopsy':
      return approach(stopPose(id, r), 1.6, -0.2);
    case 'stain':
      return approach(stopPose(id, r), 2.3, 0.12);
    case 'pcr':
      return approach(stopPose(id, r), 2.1);
    case 'symptoms':
      return { pos: [0.0, 0.52, 1.5], target: [0, 0.5, 1.2], fov: 36 };
    case 'spread':
    case 'quiz':
      return { pos: along(r.enter, r.n, 0.12), target: along(r.enter, r.n, -0.02), fov: 30 };
    case 'treatment':
      return { pos: [-0.2, 1.6, 1.6], target: [0, 0.7, 0.4], fov: 36 };
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
