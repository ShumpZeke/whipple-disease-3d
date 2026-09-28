import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { frameState } from '../app/journey';
import { LAST_STOP, STOPS } from '../content/story';
import { entryPose, exitPose, PLATE, stopPose, type AnatomyRefs, type Pose } from './presets';

const refs: AnatomyRefs = {
  si: new THREE.Vector3(0, -0.15, 0.15),
  enter: new THREE.Vector3(0.1, -0.2, 0.45),
  n: new THREE.Vector3(0.1, 0.15, 1).normalize(),
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
