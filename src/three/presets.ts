import * as THREE from 'three';
import type { StepId, World } from '../content/story';

export type V3 = [number, number, number];

export interface CameraPreset {
  pos: V3;
  target: V3;
  fov: number;
  /** Allow the visitor to orbit/zoom in this step. */
  free: boolean;
  minDistance: number;
  maxDistance: number;
  minPolar?: number;
  maxPolar?: number;
}

const PI = Math.PI;
const base = { minPolar: PI * 0.18, maxPolar: PI * 0.82 };

/** Anatomy anchors are resolved at runtime; these are world-space fallbacks (model scaled ×4). */
export interface AnatomyRefs {
  si: THREE.Vector3;
  facts: THREE.Vector3[];
  enter: THREE.Vector3;
}

const add = (a: THREE.Vector3, d: V3): V3 => [a.x + d[0], a.y + d[1], a.z + d[2]];
const v = (a: THREE.Vector3): V3 => [a.x, a.y, a.z];

export function presetFor(id: StepId, sub: number, world: World, refs: AnatomyRefs | null): CameraPreset {
  const si = refs?.si ?? new THREE.Vector3(0, -0.28, 0.1);
  switch (world) {
    case 'anatomy': {
      const common = { free: true, minDistance: 1.3, maxDistance: 7.5, ...base };
      switch (id) {
        case 'modern':
          return { ...common, free: false, pos: [0, -0.05, 8.7], target: [0, -0.05, 0], fov: 16 };
        case 'overview':
          return { ...common, pos: [0.85, 0.32, 3.95], target: [0, -0.02, 0], fov: 30 };
        case 'focus':
          return { ...common, pos: add(si, [-0.6, 0.34, 2.95]), target: add(si, [0.02, 0.08, 0]), fov: 30 };
        case 'facts': {
          const offs: V3[] = [
            [-0.75, 0.35, 2.95],
            [0.75, 0.25, 3.0],
            [0.1, 0.8, 2.95],
            [0.0, 0.1, 3.15],
          ];
          const f = refs?.facts[sub] ?? si;
          const t = si.clone().lerp(f, 0.25);
          return { ...common, pos: add(t, offs[Math.min(sub, 3)]), target: v(t), fov: 30 };
        }
        case 'systems':
          return { ...common, pos: [0.72, 0.18, 5.6], target: [0.72, 0.02, 0], fov: 30, minDistance: 2.5 };
        case 'quiz':
          return { ...common, pos: [0.45, 0.22, 4.25], target: [0, -0.04, 0], fov: 30 };
        case 'end':
        default:
          return { ...common, pos: [0.95, 0.36, 4.35], target: [0, -0.02, 0], fov: 30 };
      }
    }
    case 'tissue':
      return {
        free: true,
        pos: [3.7, 2.1, 6.3],
        target: [0.35, -0.1, 0],
        fov: 34,
        minDistance: 3,
        maxDistance: 10,
        minPolar: PI * 0.12,
        maxPolar: PI * 0.62,
      };
    case 'villi':
      if (id === 'villi')
        return { free: true, pos: [1.5, 1.2, 3.45], target: [0.02, 0.5, 0.8], fov: 34, minDistance: 1.4, maxDistance: 8, minPolar: PI * 0.12, maxPolar: PI * 0.49 };
      if (id === 'treatment')
        return { free: true, pos: [-1.2, 2.35, 3.8], target: [0, 0.5, 0.15], fov: 36, minDistance: 1.8, maxDistance: 8, minPolar: PI * 0.12, maxPolar: PI * 0.49 };
      return { free: true, pos: [0.3, 2.4, 4.1], target: [0, 0.5, 0.45], fov: 36, minDistance: 1.8, maxDistance: 8, minPolar: PI * 0.12, maxPolar: PI * 0.49 };
    case 'micro':
      return { free: true, pos: [0.6, 0.6, 7.2], target: [0, 0, 0], fov: 36, minDistance: 3.2, maxDistance: 12, ...base };
    case 'diagnosis': {
      const x = [0, 20, 40][Math.min(sub, 2)];
      const views: CameraPreset[] = [
        { free: false, pos: [x + 2.55, 1.5, 1.05], target: [x + 0.2, 0.02, 0.12], fov: 42, minDistance: 1, maxDistance: 6 },
        { free: false, pos: [x + 0.0, -0.1, 7.6], target: [x, -0.25, 0], fov: 34, minDistance: 2, maxDistance: 11 },
        { free: true, pos: [x + 0.9, 0.4, 6.4], target: [x + 0.1, 0.2, 0], fov: 36, minDistance: 3, maxDistance: 12, ...base },
      ];
      return views[Math.min(sub, 2)];
    }
    default:
      return { free: false, pos: [0, 0, 6], target: [0, 0, 0], fov: 30, minDistance: 1, maxDistance: 10 };
  }
}
