import { useLayoutEffect } from 'react';
import * as THREE from 'three';
import type { StopId } from '../content/story';
import { stopPose, type AnatomyRefs } from './presets';

// the zoomed-in scenes' poses don't use the anatomy anchors
const ZERO = new THREE.Vector3();
const Z = new THREE.Vector3(0, 0, 1);
const NO_REFS: AnatomyRefs = { kidney: ZERO, enter: ZERO, n: Z, tumor: ZERO, tn: Z };

/**
 * Reorder an opaque InstancedMesh so the copies nearest the camera are drawn first. The picture
 * is exactly the same, but the graphics card can skip shading everything hidden behind what it
 * has already drawn (the early depth test). Where many copies overlap, most of the screen is
 * covered several times over, so this saves a lot of work on slower computers.
 * Per-instance attributes on the geometry are reordered together with the matrices.
 */
export function sortFrontToBack(mesh: THREE.InstancedMesh, eyeWorld: THREE.Vector3) {
  mesh.updateWorldMatrix(true, false);
  const eye = eyeWorld.clone().applyMatrix4(mesh.matrixWorld.clone().invert());
  const n = mesh.count;
  const m = mesh.instanceMatrix.array as Float32Array;
  const dist = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const o = i * 16;
    const dx = m[o + 12] - eye.x;
    const dy = m[o + 13] - eye.y;
    const dz = m[o + 14] - eye.z;
    dist[i] = dx * dx + dy * dy + dz * dz;
  }
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => dist[a] - dist[b]);
  const permute = (attr: THREE.BufferAttribute | THREE.InstancedBufferAttribute) => {
    const size = attr.itemSize;
    const src = (attr.array as Float32Array).slice(0, n * size);
    const dst = attr.array as Float32Array;
    for (let i = 0; i < n; i++) dst.set(src.subarray(order[i] * size, order[i] * size + size), i * size);
    attr.needsUpdate = true;
  };
  permute(mesh.instanceMatrix);
  if (mesh.instanceColor) permute(mesh.instanceColor);
  for (const attr of Object.values(mesh.geometry.attributes)) {
    if ((attr as THREE.InstancedBufferAttribute).isInstancedBufferAttribute) permute(attr as THREE.InstancedBufferAttribute);
  }
}

/** Sort once, as seen from the camera position of the stop this mesh is mainly viewed from. */
export function useFrontToBack(mesh: THREE.InstancedMesh, stop: StopId) {
  useLayoutEffect(() => {
    const p = stopPose(stop, NO_REFS);
    sortFrontToBack(mesh, new THREE.Vector3(...p.pos));
  }, [mesh, stop]);
}
