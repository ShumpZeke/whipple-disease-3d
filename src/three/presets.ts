import * as THREE from 'three';
import type { StopId } from '../content/story';
import type { Levels } from './levels';
import { CAUSE_MID } from './nested';

export type V3 = [number, number, number];

/** Which scene's units a pose is written in (see nested.ts). */
export type LevelId = 'study' | 'organs' | 'kidney' | 'nephron' | 'dna';

export interface LocalPose {
  level: LevelId;
  pos: V3;
  target: V3;
  fov: number;
  /** "Up" on screen, in the scene's units (default +Y). */
  up?: V3;
}

export interface WorldPose {
  pos: THREE.Vector3;
  target: THREE.Vector3;
  up: THREE.Vector3;
  fov: number;
}

/**
 * Organ-scene anchors resolved at runtime (the model is scaled ×5). `enter` is a front-facing
 * point on the left kidney and `n` its outward normal; `tumor` is where the tumor sits on that
 * kidney's lower half and `tn` its outward normal.
 */
export interface AnatomyRefs {
  kidney: THREE.Vector3;
  enter: THREE.Vector3;
  n: THREE.Vector3;
  tumor: THREE.Vector3;
  tn: THREE.Vector3;
}

/** Tumor radius in organ-scene units, and where its centre sits along the surface normal. */
export const TUMOR_R = 0.13;
export const tumorCenter = (r: AnatomyRefs) => r.tumor.clone().addScaledVector(r.tn, TUMOR_R * 0.45);

const add = (a: THREE.Vector3, d: V3): V3 => [a.x + d[0], a.y + d[1], a.z + d[2]];

/**
 * Where each stop's subject sits on a landscape screen, as a fraction of half the screen
 * (x: + moves it right, y: + moves it up): clear of the big caption in the bottom-left corner.
 */
const LAYOUT: Partial<Record<StopId, [number, number]>> = {
  title: [0.18, -0.04],
  doctor: [0.22, 0.02],
  body: [0.3, 0],
  kidneys: [0.3, 0.02],
  inside: [0.25, 0.02],
  nephron: [0.25, 0],
  cause: [0.12, 0.06],
  genes: [0.22, 0.05],
  lump: [0.3, 0.04],
  signs: [0.3, 0],
  ultrasound: [0.26, 0.02],
  scans: [0.26, 0],
  treatment: [0.3, 0],
  outlook: [0.3, 0],
  quiz: [0.3, 0],
  end: [0.3, 0],
};

/** The pose each stop rests at, in its own scene's units. */
export function localPose(id: StopId, r: AnatomyRefs): LocalPose {
  const organs = (pos: V3, target: V3, fov: number, up?: V3): LocalPose => ({ level: 'organs', pos, target, fov, up });
  switch (id) {
    // the study: Max Wilms at his desk (metres)
    case 'title':
      return { level: 'study', pos: [2.05, 1.8, 2.75], target: [-0.02, 1.0, 0.08], fov: 30 };
    case 'doctor':
      // his face, from the front and to his right, next to his portrait
      return { level: 'study', pos: [0.63, 1.45, -0.52], target: [0.0, 1.24, 0.4], fov: 30 };
    case 'book':
      // over his right shoulder, looking at the open book on its stand
      return { level: 'study', pos: [0.5, 1.5, 0.66], target: [0.0, 0.95, -0.13], fov: 30 };
    // the name: square on to the open book, between Max Wilms and his book (half a metre from the
    // page, in front of his face), the book on the right of the screen, clear of the caption and the
    // word card (organ-scene units: the page is the scene)
    case 'name':
      return organs([-1.8, 0.02, 4.77], [-1.8, 0, 0], 38);
    case 'body':
      return organs([0.45, 0.2, 4.0], [0, -0.02, 0], 30);
    case 'kidneys':
      return organs([0.28, 0.5, 2.55], [0, 0.2, -0.04], 30);
    // inside the left kidney, cut in half (kidney units: it is 2 tall)
    case 'inside':
      return { level: 'kidney', pos: [0.3, 0.12, 4.1], target: [0.02, -0.02, 0], fov: 34 };
    // one filter in the outer layer (nephron units)
    case 'nephron':
      return { level: 'nephron', pos: [0.75, 0.3, 6.3], target: [0.45, -0.3, 0], fov: 34 };
    case 'cause':
      return { level: 'nephron', pos: add(CAUSE_MID, [0.1, 0.18, 1.35]), target: CAUSE_MID.toArray() as V3, fov: 36 };
    // inside the nucleus of a young cell (DNA units)
    case 'genes':
      return { level: 'dna', pos: [0.2, 0.15, 5.2], target: [0, 0, 0], fov: 34 };
    case 'lump':
      return organs(add(r.tumor, [0.75, 0.22, 2.1]), add(r.tumor, [-0.1, 0.08, 0]), 30);
    case 'signs':
      return organs([0.6, 0.05, 3.9], [0.06, -0.08, 0], 30);
    case 'ultrasound': {
      // from the left side, looking at the scan's fan face-on; the probe (at the front) is at the top
      const c = tumorCenter(r);
      const t: V3 = [ULTRASOUND_X(r), c.y - 0.02, c.z + 0.16];
      return organs([t[0] + 2.7, t[1] + 0.05, t[2] + 0.1], t, 34, [0, 0, 1]);
    }
    case 'scans': {
      // from the feet, looking up at the slice (front of the body at the top, as doctors view it)
      const y = tumorCenter(r).y;
      return organs([0.15, y - 3.4, 0.7], [0.05, y, 0], 36, [0, 0, 1]);
    }
    case 'treatment':
      return organs([0.75, 0.42, 2.7], [0.15, 0.22, 0], 30);
    case 'outlook':
      return organs([-0.35, 0.42, 2.7], [-0.05, 0.2, 0], 30);
    case 'quiz':
      return organs([0.4, 0.18, 4.1], [0, -0.02, 0], 30);
    case 'end':
      return organs([0.8, 0.28, 4.2], [0, -0.02, 0], 30);
  }
}

/** The ultrasound's slice: a plane at this x through the tumor (organ-scene units). */
export const ULTRASOUND_X = (r: AnatomyRefs) => tumorCenter(r).x - 0.03;

/** Slide the camera sideways/up so the subject lands at (fx, fy) of the half-screen. */
function frameAt(p: LocalPose, fx: number, fy: number, aspect: number): LocalPose {
  const pos = new THREE.Vector3(...p.pos);
  const target = new THREE.Vector3(...p.target);
  const up0 = new THREE.Vector3(...(p.up ?? [0, 1, 0]));
  const fwd = target.clone().sub(pos);
  const halfH = Math.tan(THREE.MathUtils.degToRad(p.fov / 2)) * fwd.length();
  fwd.normalize();
  const right = new THREE.Vector3().crossVectors(fwd, up0).normalize();
  const up = new THREE.Vector3().crossVectors(right, fwd);
  const off = right.multiplyScalar(-fx * halfH * aspect).addScaledVector(up, -fy * halfH);
  return { ...p, pos: pos.add(off).toArray() as V3, target: target.add(off).toArray() as V3 };
}

/** The local pose with the screen layout applied (`aspect` = viewport width / height). */
export function stopPose(id: StopId, r: AnatomyRefs, aspect = 16 / 9): LocalPose {
  const p = localPose(id, r);
  const at = aspect >= 1 ? LAYOUT[id] : undefined;
  return at ? frameAt(p, at[0], at[1], aspect) : p;
}

export function levelMatrix(level: LevelId, levels: Levels | null): THREE.Matrix4 | null {
  if (level === 'organs' || !levels) return null;
  return levels[level];
}

/** A stop's pose in world units (the organ scene). */
export function worldPose(id: StopId, r: AnatomyRefs, levels: Levels | null, aspect = 16 / 9): WorldPose {
  const p = stopPose(id, r, aspect);
  const m = levelMatrix(p.level, levels);
  const pos = new THREE.Vector3(...p.pos);
  const target = new THREE.Vector3(...p.target);
  const up = new THREE.Vector3(...(p.up ?? [0, 1, 0]));
  if (m) {
    pos.applyMatrix4(m);
    target.applyMatrix4(m);
    up.transformDirection(m);
  }
  return { pos, target, up, fov: p.fov };
}

const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

const tmpA = new THREE.Vector3();
const q = new THREE.Quaternion();
const qa = new THREE.Quaternion();
const qb = new THREE.Quaternion();
const m4 = new THREE.Matrix4();

/** Camera orientation (as a quaternion) looking from `pos` at `target` with `up`. */
function orientation(p: WorldPose, out: THREE.Quaternion) {
  m4.lookAt(p.pos, p.target, p.up);
  return out.setFromRotationMatrix(m4);
}

/**
 * A continuous zoom from pose A to pose B, even when they are at very different scales: the
 * viewing distance changes geometrically (every second of the move zooms by the same factor), the
 * point we look at travels in step with the zoom so the spot we dive into stays in view, and the
 * camera turns smoothly (quaternion slerp). `k` is 0..1 (eased inside).
 */
export function zoomLerp(a: WorldPose, b: WorldPose, k: number, out: WorldPose) {
  const e = easeInOut(Math.min(1, Math.max(0, k)));
  const dA = a.pos.distanceTo(a.target);
  const dB = b.pos.distanceTo(b.target);
  const la = Math.log(dA);
  const lb = Math.log(dB);
  const d = Math.exp(la + (lb - la) * e);
  const span = Math.abs(lb - la);
  const wLog = span > 1e-4 ? (d - dA) / (dB - dA) : e;
  const w = e + (wLog - e) * Math.min(1, span / 1.2);
  out.target.copy(a.target).lerp(b.target, w);
  qa.copy(orientation(a, qa));
  qb.copy(orientation(b, qb));
  q.slerpQuaternions(qa, qb, e);
  // the camera looks down its −Z: the camera sits at +Z (in its own frame) from the target
  tmpA.set(0, 0, 1).applyQuaternion(q);
  out.pos.copy(out.target).addScaledVector(tmpA, d);
  out.up.set(0, 1, 0).applyQuaternion(q);
  out.fov = a.fov + (b.fov - a.fov) * e;
  return out;
}

export function makePose(): WorldPose {
  return { pos: new THREE.Vector3(), target: new THREE.Vector3(), up: new THREE.Vector3(0, 1, 0), fov: 30 };
}

