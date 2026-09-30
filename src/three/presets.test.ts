import * as THREE from 'three';
import { describe, expect, it } from 'vitest';
import { LAST_STOP, STOPS } from '../content/story';
import { nestLevels, type Levels } from './levels';
import { manLine } from './hinge';
import { WILMS_HEAD } from './nested';
import { localPose, makePose, worldPose, zoomLerp, type AnatomyRefs } from './presets';

// the anchors as they come out of public/models/urinary.glb (×5)
const refs: AnatomyRefs = {
  kidney: new THREE.Vector3(0.3, 0.376, -0.075),
  enter: new THREE.Vector3(0.3, 0.438, 0.002),
  n: new THREE.Vector3(0.03, 0.43, 0.9).normalize(),
  tumor: new THREE.Vector3(0.364, 0.27, 0.008),
  tn: new THREE.Vector3(0.33, 0.05, 0.94).normalize(),
};
// the left kidney at rest: 5 × (its node position, scale 0.0528)
const kidney = new THREE.Matrix4().makeScale(5, 5, 5).multiply(new THREE.Matrix4().compose(new THREE.Vector3(0.0601, 0.0751, -0.015), new THREE.Quaternion(), new THREE.Vector3(0.0528, 0.0528, 0.0528)));
const levels = { section: null, ...nestLevels(kidney, { x: 0.3, y: -0.5, r: 0.002 }) } as unknown as Levels;

describe('camera poses', () => {
  it('gives every stop a finite pose in its own scene', () => {
    for (const s of STOPS) {
      const p = worldPose(s.id, refs, levels);
      for (const v of [...p.pos.toArray(), ...p.target.toArray(), ...p.up.toArray(), p.fov]) expect(Number.isFinite(v), s.id).toBe(true);
      expect(p.pos.distanceTo(p.target), s.id).toBeGreaterThan(0);
      const level = localPose(s.id, refs).level;
      if (s.scene === 'history' && s.id !== 'name') expect(level, s.id).toBe('study');
      else expect(level, s.id).not.toBe('study');
    }
  });

  it('nests each scene far inside the one before it', () => {
    expect(levels.size.nephron).toBeLessThan(levels.size.kidney / 100);
    expect(levels.size.clump).toBeLessThan(levels.size.nephron);
    expect(levels.size.dna).toBeLessThan(levels.size.clump / 10);
    expect(levels.size.study).toBeGreaterThan(1);
  });

  it('never flies through Max Wilms’s head while he is there', () => {
    const head = WILMS_HEAD.clone().applyMatrix4(levels.study);
    const scale = levels.size.study; // world units per metre
    const cur = makePose();
    // on the way in to his book, and on the way back out of it at the end
    for (let i = 0; i < LAST_STOP; i++) {
      const a = worldPose(STOPS[i].id, refs, levels);
      const b = worldPose(STOPS[i + 1].id, refs, levels);
      for (let s = 0; s <= 100; s++) {
        // (he dissolves from the top down before the camera leans past him to his book)
        if (manLine(i + s / 100) < WILMS_HEAD.y - 0.14) continue;
        zoomLerp(a, b, s / 100, cur);
        expect(cur.pos.distanceTo(head) / scale, `${STOPS[i].id}>${STOPS[i + 1].id} at ${s}`).toBeGreaterThan(0.2);
      }
    }
  });

  it('moves between every pair of stops in one smooth, unbroken camera move', () => {
    const cur = makePose();
    const prev = makePose();
    for (let i = 0; i < LAST_STOP; i++) {
      const a = worldPose(STOPS[i].id, refs, levels);
      const b = worldPose(STOPS[i + 1].id, refs, levels);
      zoomLerp(a, b, 0, cur);
      expect(cur.pos.distanceTo(a.pos) / a.pos.distanceTo(a.target), `${STOPS[i].id} start`).toBeLessThan(1e-6);
      zoomLerp(a, b, 1, cur);
      expect(cur.pos.distanceTo(b.pos) / b.pos.distanceTo(b.target), `${STOPS[i + 1].id} end`).toBeLessThan(1e-6);
      for (let s = 0; s <= 200; s++) {
        zoomLerp(a, b, s / 200, cur);
        const d = cur.pos.distanceTo(cur.target);
        if (s > 0) {
          // each small step of scroll moves the camera by only a small part of what it sees
          const step = cur.pos.distanceTo(prev.pos) / Math.min(d, prev.pos.distanceTo(prev.target));
          expect(step, `${STOPS[i].id}>${STOPS[i + 1].id} at ${s}`).toBeLessThan(0.25);
        }
        prev.pos.copy(cur.pos);
        prev.target.copy(cur.target);
      }
    }
  });
});
