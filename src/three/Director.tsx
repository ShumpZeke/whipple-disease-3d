import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { journey, nearestStop } from '../app/journey';
import { useStory } from '../app/store';
import { LAST_STOP, STOPS } from '../content/story';
import { MODEL_SCALE, useAnatomy } from './anatomy/useAnatomy';
import { useLevels } from './levels';
import { makePose, worldPose, zoomLerp, type AnatomyRefs, type WorldPose } from './presets';

/**
 * What the camera is doing this frame, for scenes that react to the zoom (a surface that opens
 * as we dive into it, a nucleus that clears as we enter it). `d` is the distance to the point the
 * camera looks at, in world units.
 */
export const view = { d: 4, target: new THREE.Vector3(), position: new THREE.Vector3() };

export function useAnatomyRefs(): AnatomyRefs {
  const anatomy = useAnatomy();
  return useMemo(() => {
    const a = anatomy.anchors;
    const w = (n: string, fb: THREE.Vector3) => (a[n] ? a[n].position.clone().multiplyScalar(MODEL_SCALE) : fb);
    // the dives must head into the visible (front) face of the kidney
    const front = (v?: THREE.Vector3) => {
      const n = v?.clone() ?? new THREE.Vector3(0, 0, 1);
      return (n.z < 0.3 ? new THREE.Vector3(0.1, 0.15, 1) : n).normalize();
    };
    const kidney = w('anchor_kidney_center', new THREE.Vector3(0.3, 0.38, -0.07));
    return {
      kidney,
      enter: w('anchor_enter', kidney),
      n: front(a.anchor_enter?.normal),
      tumor: w('anchor_tumor', kidney),
      tn: front(a.anchor_tumor?.normal),
    };
  }, [anatomy]);
}

/**
 * Drives the camera from the scroll position. Every scene is nested inside the previous one, so
 * moving between two stops is always one continuous camera move: a glide within a scene, or a
 * zoom that dives into (or pulls back out of) the next scale. A small drag-to-orbit offset lets
 * the visitor turn the view at any stop; it eases away once they scroll on.
 */
export function Director() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const resetNonce = useStory((s) => s.cameraResetNonce);
  const refs = useAnatomyRefs();
  const levels = useLevels();

  const cache = useRef<{ aspect: number; list: WorldPose[] } | null>(null);
  const poses = (aspect: number) => {
    if (!cache.current || Math.abs(cache.current.aspect - aspect) > 1e-3) {
      cache.current = { aspect, list: STOPS.map((s) => worldPose(s.id, refs, levels, aspect)) };
    }
    return cache.current.list;
  };
  useEffect(() => {
    cache.current = null;
  }, [refs, levels]);

  const orbit = useRef({ yaw: 0, pitch: 0, dragging: false, lastX: 0, lastY: 0 });
  const cur = useMemo(makePose, []);
  const off = useMemo(() => new THREE.Vector3(), []);
  const right = useMemo(() => new THREE.Vector3(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);

  // drag to orbit (the wheel is left alone: it scrolls the page, i.e. zooms the journey)
  useEffect(() => {
    const el = gl.domElement;
    const o = orbit.current;
    const down = (e: PointerEvent) => {
      if (e.button !== 0) return;
      o.dragging = true;
      o.lastX = e.clientX;
      o.lastY = e.clientY;
    };
    const move = (e: PointerEvent) => {
      if (!o.dragging) return;
      const dx = e.clientX - o.lastX;
      const dy = e.clientY - o.lastY;
      o.lastX = e.clientX;
      o.lastY = e.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 0) useStory.getState().markInteracted();
      o.yaw = THREE.MathUtils.clamp(o.yaw - dx * 0.006, -1.3, 1.3);
      o.pitch = THREE.MathUtils.clamp(o.pitch + (e.pointerType === 'touch' ? 0 : dy * 0.004), -0.45, 0.35);
      invalidate();
    };
    const up = () => {
      o.dragging = false;
    };
    const dbl = () => {
      o.yaw = 0;
      o.pitch = 0;
      invalidate();
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    el.addEventListener('dblclick', dbl);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      el.removeEventListener('dblclick', dbl);
    };
  }, [gl, invalidate]);

  // reset button / R key: ease the orbit offset back
  const resetting = useRef(false);
  useEffect(() => {
    if (resetNonce) {
      resetting.current = true;
      invalidate();
    }
  }, [resetNonce, invalidate]);

  useFrame((_, dt) => {
    const t = Math.min(LAST_STOP, Math.max(0, journey.t));
    const list = poses(camera.aspect);
    const i = Math.min(LAST_STOP - 1, Math.floor(t));
    zoomLerp(list[i], list[i + 1], t - i, cur);

    // orbit offset: free at a stop, eases away while travelling between stops
    const o = orbit.current;
    const between = Math.abs(t - nearestStop(t)) > 0.2;
    if ((between || resetting.current) && !o.dragging) {
      const k = 1 - Math.exp(-dt * 5);
      o.yaw -= o.yaw * k;
      o.pitch -= o.pitch * k;
      if (Math.abs(o.yaw) < 1e-3 && Math.abs(o.pitch) < 1e-3) {
        o.yaw = 0;
        o.pitch = 0;
        resetting.current = false;
      } else invalidate();
    }
    off.copy(cur.pos).sub(cur.target);
    if (o.yaw !== 0 || o.pitch !== 0) {
      off.applyQuaternion(q.setFromAxisAngle(cur.up, o.yaw));
      right.crossVectors(off, cur.up).normalize();
      off.applyQuaternion(q.setFromAxisAngle(right, o.pitch));
    }
    const d = off.length();
    camera.position.copy(cur.target).add(off);
    camera.up.copy(cur.up);
    camera.lookAt(cur.target);
    // near and far follow the zoom, so depth stays precise from the study down to the DNA
    const near = d * 0.02;
    const far = d * 600;
    if (Math.abs(camera.fov - cur.fov) > 1e-3 || Math.abs(camera.near / near - 1) > 1e-3 || Math.abs(camera.far / far - 1) > 1e-3) {
      camera.fov = cur.fov;
      camera.near = near;
      camera.far = far;
      camera.updateProjectionMatrix();
    }
    view.d = d;
    view.target.copy(cur.target);
    view.position.copy(camera.position);
  });

  return null;
}
