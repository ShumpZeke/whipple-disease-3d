import { useMemo } from 'react';
import * as THREE from 'three';
import { KidneySection, sliceContour } from './kidney/section';
import { MODEL_SCALE, useAnatomy, type AnatomyData } from './anatomy/useAnatomy';
import { CLUMP_AT, CLUMP_SCALE, DNA_SCALE, DNA_TILT, FRONT, G, NEPHRON_PHI, NEPHRON_SCALE, pageFrame, R_CAPSULE, SLOTS } from './nested';

/** Where each nested scene sits in the world (the organ scene is the world). */
export interface Levels {
  section: KidneySection;
  /** world ← the left kidney's own units, at rest */
  kidney: THREE.Matrix4;
  /** the filter dot we zoom into, on the cut face (kidney units) */
  dot: { x: number; y: number; r: number };
  nephron: THREE.Matrix4;
  clump: THREE.Matrix4;
  dna: THREE.Matrix4;
  study: THREE.Matrix4;
  /** world units per unit of each scene */
  size: { kidney: number; nephron: number; clump: number; dna: number; study: number };
}

const cache = new WeakMap<AnatomyData, Levels>();

/** Nest the scenes inside the kidney (at rest) around the filter dot we zoom into. */
export function nestLevels(kidney: THREE.Matrix4, dot: { x: number; y: number; r: number }): Omit<Levels, 'section'> {
  // nephron → kidney: the glomerulus sits on the dot, bulging a little out of the cut face
  const toKidney = new THREE.Matrix4()
    .makeTranslation(dot.x, dot.y, R_CAPSULE * 0.35 * NEPHRON_SCALE)
    .multiply(new THREE.Matrix4().makeScale(NEPHRON_SCALE, NEPHRON_SCALE, NEPHRON_SCALE))
    .multiply(new THREE.Matrix4().makeTranslation(-G.x, -G.y, -G.z));
  const nephron = kidney.clone().multiply(toKidney);
  const clump = nephron.clone().multiply(new THREE.Matrix4().makeTranslation(CLUMP_AT.x, CLUMP_AT.y, CLUMP_AT.z).scale(new THREE.Vector3().setScalar(CLUMP_SCALE)));
  const front = SLOTS[FRONT];
  const dna = clump
    .clone()
    .multiply(new THREE.Matrix4().makeTranslation(front.x, front.y, front.z))
    .multiply(new THREE.Matrix4().makeRotationFromEuler(DNA_TILT))
    .multiply(new THREE.Matrix4().makeScale(DNA_SCALE, DNA_SCALE, DNA_SCALE));
  const study = pageFrame().invert();
  const scaleOf = (m: THREE.Matrix4) => new THREE.Vector3().setFromMatrixColumn(m, 0).length();
  return {
    kidney,
    dot,
    nephron,
    clump,
    dna,
    study,
    size: { kidney: scaleOf(kidney), nephron: scaleOf(nephron), clump: scaleOf(clump), dna: scaleOf(dna), study: scaleOf(study) },
  };
}

export function computeLevels(data: AnatomyData): Levels {
  const hit = cache.get(data);
  if (hit) return hit;
  const mesh = data.meshes.LeftKidney!;
  const base = (mesh.userData.base as THREE.Vector3 | undefined) ?? mesh.position;
  const kidney = new THREE.Matrix4()
    .makeScale(MODEL_SCALE, MODEL_SCALE, MODEL_SCALE)
    .multiply(new THREE.Matrix4().compose(base, mesh.quaternion, mesh.scale));
  const section = new KidneySection(sliceContour(mesh.geometry, 0));
  const dot = section.nearestDot(section.cortexPoint(NEPHRON_PHI));
  const levels: Levels = { section, ...nestLevels(kidney, dot) };
  cache.set(data, levels);
  return levels;
}

export function useLevels() {
  const data = useAnatomy();
  return useMemo(() => computeLevels(data), [data]);
}
