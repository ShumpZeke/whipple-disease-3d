import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { frameState, journey, nearestStop } from '../app/journey';
import { useStory } from '../app/store';
import { STOPS } from '../content/story';
import { MODEL_SCALE, useAnatomy } from './anatomy/useAnatomy';
import { entryPose, exitPose, lerpPose, PLATE, stopPose, type AnatomyRefs } from './presets';

const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const easeIn = (k: number) => k * k * k;
const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);

/**
 * Drives the camera from the scroll position. Between two stops of the same scene the camera
 * glides; between different scenes it accelerates into a surface, passes a colour veil, and
 * decelerates out of the next scene — the zoom "through" illusion. A small drag-to-orbit offset
 * lets the visitor turn the model at any stop; it eases away once they scroll on.
 */
export function Director() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const invalidate = useThree((s) => s.invalidate);
  const resetNonce = useStory((s) => s.cameraResetNonce);
  const anatomy = useAnatomy();

  const refs: AnatomyRefs = useMemo(() => {
    const a = anatomy.anchors;
    const w = (n: string, fb: THREE.Vector3) => (a[n] ? a[n].position.clone().multiplyScalar(MODEL_SCALE) : fb);
    const si = w('anchor_si_center', new THREE.Vector3(0, -0.15, 0.15));
    const enter = w('anchor_enter', si);
    let n = a.anchor_enter?.normal.clone() ?? new THREE.Vector3(0, 0, 1);
    // the dive must head into the visible (front) face of the loop
    if (n.z < 0.3) n = new THREE.Vector3(0.1, 0.15, 1);
    return { si, enter, n: n.normalize() };
  }, [anatomy]);

  const orbit = useRef({ yaw: 0, pitch: 0, dragging: false, lastX: 0, lastY: 0 });
  const tmp = useMemo(() => ({ pos: new THREE.Vector3(), target: new THREE.Vector3() }), []);
  const off = useMemo(() => new THREE.Vector3(), []);
  const sph = useMemo(() => new THREE.Spherical(), []);

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
    const t = journey.t;
    const fs = frameState(t);
    let fov: number;
    const A = STOPS[fs.i].id;
    const B = STOPS[Math.min(STOPS.length - 1, fs.i + 1)].id;
    const aspect = camera.aspect;
    if (fs.hinge) {
      // 1907 plate → modern model: hold the flat plate framing, then glide to the studio view
      fov = lerpPose(PLATE, stopPose('body', refs, aspect), easeInOut(Math.max(0, (fs.f - 0.5) / 0.5)), tmp);
    } else if (fs.i < 3) {
      fov = lerpPose(PLATE, PLATE, 0, tmp);
    } else if (!fs.cut) {
      fov = lerpPose(stopPose(A, refs, aspect), stopPose(B, refs, aspect), easeInOut(fs.f), tmp);
    } else if (fs.f < 0.5) {
      const ex = exitPose(A, refs) ?? stopPose(A, refs, aspect);
      fov = lerpPose(stopPose(A, refs, aspect), ex, easeIn(fs.f / 0.5), tmp);
    } else {
      const en = entryPose(B, refs) ?? stopPose(B, refs, aspect);
      fov = lerpPose(en, stopPose(B, refs, aspect), easeOut((fs.f - 0.5) / 0.5), tmp);
    }

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
    off.copy(tmp.pos).sub(tmp.target);
    if (o.yaw !== 0 || o.pitch !== 0) {
      sph.setFromVector3(off);
      sph.theta += o.yaw;
      sph.phi = THREE.MathUtils.clamp(sph.phi - o.pitch, 0.25, Math.PI - 0.25);
      off.setFromSpherical(sph);
    }
    camera.position.copy(tmp.target).add(off);
    camera.lookAt(tmp.target);
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  });

  return null;
}
