import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { frameState } from '../app/journey';
import { LAST_STOP, STOPS } from '../content/story';
import { entryPose, exitPose, PLATE, stopPose, type AnatomyRefs, type Pose } from './presets';

// the anchors as they come out of public/models/urinary.glb (×5)
const refs: AnatomyRefs = {
  kidney: new THREE.Vector3(0.3, 0.376, -0.075),
  enter: new THREE.Vector3(0.3, 0.438, 0.002),
  n: new THREE.Vector3(0.03, 0.43, 0.9).normalize(),
  tumor: new THREE.Vector3(0.364, 0.27, 0.008),
  tn: new THREE.Vector3(0.33, 0.05, 0.94).normalize(),
};
const dist = (p: Pose, target: Pose['target']) => Math.hypot(p.pos[0] - target[0], p.pos[1] - target[1], p.pos[2] - target[2]);

describe('camera poses', () => {
  it('frames every modern stop with its own pose', () => {
    for (const s of STOPS) {
      const p = stopPose(s.id, refs);
      if (s.scene === 'history') expect(p).toBe(PLATE);
      else expect(p, s.id).not.toBe(PLATE);
      for (const v of [...p.pos, ...p.target, p.fov]) expect(Number.isFinite(v), s.id).toBe(true);
    }
  });

  it('keeps the zoom moving in one direction through each veil', () => {
    for (let i = 0; i < LAST_STOP; i++) {
      const fs = frameState(i + 0.5);
      if (!fs.cut) continue;
      const a = fs.a.id;
      const b = fs.b.id;
      const from = stopPose(a, refs);
      const to = stopPose(b, refs);
      const exit = exitPose(a, refs);
      const entry = entryPose(b, refs);
      expect(exit, `exit ${a}`).not.toBeNull();
      expect(entry, `entry ${b}`).not.toBeNull();
      if (fs.dir === 'in') {
        // head into a surface, then the next scene comes towards us
        expect(dist(exit!, from.target), `${a}>${b}`).toBeLessThan(dist(from, from.target));
        expect(dist(entry!, to.target), `${a}>${b}`).toBeGreaterThan(dist(to, to.target));
      } else {
        // back away, then settle back from close up in the larger scene
        expect(dist(exit!, from.target), `${a}>${b}`).toBeGreaterThan(dist(from, from.target));
        expect(dist(entry!, to.target), `${a}>${b}`).toBeLessThan(dist(to, to.target));
      }
    }
  });
});
