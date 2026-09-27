import { CameraControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import type CameraControlsImpl from 'camera-controls';
import gsap from 'gsap';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useStory } from '../app/store';
import { STEPS, type World } from '../content/story';
import { MODEL_SCALE, useAnatomy } from './anatomy/useAnatomy';
import { presetFor, type AnatomyRefs, type CameraPreset } from './presets';

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Resolve once the world's shaders are compiled (or after a safety timeout). */
async function waitReady(w: World, isCurrent: () => boolean) {
  const t0 = performance.now();
  while (!useStory.getState().worldReady[w] && performance.now() - t0 < 9000 && isCurrent()) await wait(50);
}

/**
 * Owns the camera and the world switches.
 * Same world: authored camera move. Different world: fade through a veil, swap, then reveal.
 * Anatomy → tissue (forward): first fly into the small intestine so the cut feels continuous.
 */
export function Director() {
  const controls = useRef<CameraControlsImpl>(null);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const invalidate = useThree((s) => s.invalidate);
  const step = useStory((s) => s.step);
  const sub = useStory((s) => s.sub);
  const reduced = useStory((s) => s.reducedMotion);
  const resetNonce = useStory((s) => s.cameraResetNonce);
  const anatomy = useAnatomy();
  const busy = useRef(0);

  const refs: AnatomyRefs = useMemo(() => {
    const a = anatomy.anchors;
    const w = (n: string, fb: THREE.Vector3) => (a[n] ? a[n].position.clone().multiplyScalar(MODEL_SCALE) : fb);
    const si = w('anchor_si_center', new THREE.Vector3(0, -0.28, 0.1));
    return {
      si,
      facts: [1, 2, 3, 4].map((i) => w(`anchor_fact${i}`, si)),
      enter: w('anchor_enter', si),
    };
  }, [anatomy]);

  const apply = (p: CameraPreset, smooth: boolean) => {
    const c = controls.current;
    if (!c) return;
    c.minDistance = p.minDistance;
    c.maxDistance = p.maxDistance;
    c.minPolarAngle = p.minPolar ?? 0;
    c.maxPolarAngle = p.maxPolar ?? Math.PI;
    c.enabled = p.free;
    c.smoothTime = reduced ? 0.0001 : 0.75;
    void c.setLookAt(...p.pos, ...p.target, smooth && !reduced);
    if (Math.abs(camera.fov - p.fov) > 0.01) {
      gsap.to(camera, {
        fov: p.fov,
        duration: smooth && !reduced ? 1.6 : 0,
        ease: 'power2.inOut',
        onUpdate: () => {
          camera.updateProjectionMatrix();
          invalidate();
        },
      });
    }
  };

  // react to story changes
  useEffect(() => {
    const st = useStory.getState();
    const target: World = STEPS[step].world;
    const id = STEPS[step].id;
    const preset = presetFor(id, sub, target, refs);
    const from = st.displayWorld;
    const token = ++busy.current;

    if (target === 'none') {
      // history chapters: keep the last world hidden behind the HTML layers
      st.setDisplayWorld('none');
      return;
    }
    if (from === target) {
      apply(preset, true);
      return;
    }

    (async () => {
      const c = controls.current;
      if (!c) return;
      const forwardIntoTissue = from === 'anatomy' && target === 'tissue' && st.direction === 1;
      if (forwardIntoTissue && !reduced) {
        // fly into the surface of a small-intestine loop
        const e = refs.enter;
        c.smoothTime = 0.55;
        void c.setLookAt(e.x * 1.05, e.y + 0.05, e.z + 0.35, e.x, e.y, e.z, true);
        await wait(950);
        if (token !== busy.current) return;
      }
      if (from !== 'none') {
        st.setVeil(true);
        await wait(reduced ? 60 : 380);
        if (token !== busy.current) return;
      }
      await waitReady(target, () => token === busy.current);
      if (token !== busy.current) return;
      st.setDisplayWorld(target);
      // start slightly off the final pose, then glide in
      const p = preset;
      const dir = new THREE.Vector3(...p.pos).sub(new THREE.Vector3(...p.target));
      const startScale = target === 'tissue' && forwardIntoTissue ? 0.28 : target === 'anatomy' && id === 'modern' ? 1 : 1.18;
      const start = new THREE.Vector3(...p.target).add(dir.multiplyScalar(startScale));
      c.enabled = p.free;
      void c.setLookAt(start.x, start.y, start.z, ...p.target, false);
      camera.fov = p.fov;
      camera.updateProjectionMatrix();
      invalidate();
      await wait(40);
      if (token !== busy.current) return;
      st.setVeil(false);
      apply(p, true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sub]);

  // explicit reset (R key / button)
  useEffect(() => {
    if (resetNonce === 0) return;
    const id = STEPS[step].id;
    apply(presetFor(id, sub, STEPS[step].world, refs), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetNonce]);

  return (
    <CameraControls
      ref={controls}
      makeDefault
      draggingSmoothTime={0.12}
      truckSpeed={0}
      onStart={() => useStory.getState().markInteracted()}
    />
  );
}
