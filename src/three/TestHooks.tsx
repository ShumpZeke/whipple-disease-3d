import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { journey } from '../app/journey';
import { QUALITY } from '../app/quality';
import { useStory } from '../app/store';
import { QUESTIONS } from '../content/quiz';
import { STOPS } from '../content/story';
import { MODEL_SCALE, useAnatomy } from './anatomy/useAnatomy';

declare global {
  interface Window {
    __exhibit?: {
      organPoint: (organ: string) => { x: number; y: number } | null;
      state: () => { stop: number; id: string; t: number; world: string; quality: string };
      renderInfo: () => { calls: number; triangles: number; programs: number; geometries: number; textures: number };
      /** The compiled shader programs (name and cache key), to check that nothing compiles late. */
      programs: () => string[];
      /** The right answer to the current quick-check question (for the recorded tour), or null when done. */
      quizAnswer: () => { kind: 'organ' } | { kind: 'choice'; text: string } | null;
      /** Render once and wait for the graphics card to finish (for timing). */
      renderNow: () => void;
      scene: () => unknown;
      camera: () => { x: number; y: number; z: number; fov: number };
    };
  }
}

/** Automation hooks, only enabled with ?e2e in the URL (used by the Playwright smoke tests). */
export function TestHooks() {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const data = useAnatomy();
  useEffect(() => {
    if (!new URLSearchParams(window.location.search).has('e2e')) return;
    window.__exhibit = {
      organPoint: (organ) => {
        const a = data.anchors[`label_${organ}`];
        if (!a) return null;
        const p = a.position.clone().multiplyScalar(MODEL_SCALE).project(camera);
        const r = gl.domElement.getBoundingClientRect();
        return { x: r.left + ((p.x + 1) / 2) * r.width, y: r.top + ((1 - p.y) / 2) * r.height };
      },
      state: () => {
        const s = useStory.getState();
        return { stop: s.stop, id: STOPS[s.stop].id, t: journey.t, world: s.displayWorld, quality: QUALITY };
      },
      scene: () => scene,
      camera: () => ({ x: camera.position.x, y: camera.position.y, z: camera.position.z, fov: (camera as { fov?: number }).fov ?? 0 }),
      renderNow: () => {
        gl.render(scene, camera);
        const ctx = gl.getContext();
        ctx.readPixels(0, 0, 1, 1, ctx.RGBA, ctx.UNSIGNED_BYTE, new Uint8Array(4));
      },
      quizAnswer: () => {
        const q = QUESTIONS[useStory.getState().quizIndex];
        if (!q) return null;
        return { kind: 'choice', text: q.options.find((o) => o.correct)!.text };
      },
      programs: () => (gl.info.programs ?? []).map((p) => `${p.name} ${(p as unknown as { cacheKey: string }).cacheKey}`),
      renderInfo: () => ({
        calls: gl.info.render.calls,
        triangles: gl.info.render.triangles,
        programs: gl.info.programs?.length ?? 0,
        geometries: gl.info.memory.geometries,
        textures: gl.info.memory.textures,
      }),
    };
  }, [camera, gl, data, scene]);
  return null;
}

