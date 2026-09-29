import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { HINGE, journey, onJourneyFrame } from '../../app/journey';
import { ProfileCard, WordPartsCard } from '../../ui/HistoryCards';
import { sharedOrganUniforms } from '../anatomy/organMaterial';
import { useAnatomyRefs } from '../Director';
import { hingeState } from '../hinge';
import { Label3D } from '../Label3D';
import { useLevels } from '../levels';
import { PAGE } from '../nested';
import { worldPose } from '../presets';
import { ensureNoiseTexture, NOISE_GLSL, noiseUniform } from '../shaders/noise';
import { pageGeometry, platePage, titlePage } from './pages';

export const STUDY_URL = '/models/study.glb';
/** Study objects live on layer 1, so the organs' soft floor shadow never picks up the desk. */
export const STUDY_LAYER = 1;

/** Where the room's sweep line is (see hinge.ts); the whole room dissolves above it. */
const uStudyReveal = { value: 1e3 };

/** The desk, the man and everything else in the room dissolve (with a burnt edge) above the sweep. */
function withSweep<M extends THREE.Material>(m: M): M {
  ensureNoiseTexture();
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uNoise3D: noiseUniform, uRevealMin: sharedOrganUniforms.uRevealMin, uRevealMax: sharedOrganUniforms.uRevealMax, uStudyReveal });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSweepW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSweepW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vSweepW;\nuniform float uStudyReveal; uniform float uRevealMin; uniform float uRevealMax;\n${NOISE_GLSL}`)
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float sweepY = (vSweepW.y - uRevealMin) / max(uRevealMax - uRevealMin, 1e-4);
        float sweepEdge = uStudyReveal + snoise(vec3(vSweepW.xz * 2.0, vSweepW.y)) * 0.05;
        if (sweepY > sweepEdge) discard;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.42, 0.26, 0.12), (1.0 - smoothstep(0.0, 0.05, sweepEdge - sweepY)) * 0.6 * step(uStudyReveal, 50.0));`,
      );
  };
  m.customProgramCacheKey = () => 'study-sweep';
  return m;
}

/** The paper of the two pages dissolves behind the sweep that develops the drawing into 3D. */
function pageMaterial(map: THREE.Texture) {
  ensureNoiseTexture();
  const m = new THREE.MeshBasicMaterial({ map, toneMapped: false });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, { uNoise3D: noiseUniform, uRevealMin: sharedOrganUniforms.uRevealMin, uRevealMax: sharedOrganUniforms.uRevealMax, uReveal: sharedOrganUniforms.uReveal });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vW;\nuniform float uReveal; uniform float uRevealMin; uniform float uRevealMax;\n${NOISE_GLSL}`)
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float yN = (vW.y - uRevealMin) / max(uRevealMax - uRevealMin, 1e-4);
        float edge = uReveal + snoise(vec3(vW.xy * 3.0, 0.5)) * 0.035;
        if (yN > edge) discard;`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        // the paper browns and curls a little right at the dissolving edge
        float burn = 1.0 - smoothstep(0.0, 0.05, edge - yN);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.42, 0.26, 0.12), burn * 0.55 * step(yN, 1.25));`,
      );
  };
  return m;
}

/**
 * Max Wilms at his desk in 1899, seen over his shoulder (a model made for this exhibit, not a
 * likeness). His book lies open on a stand; the right-hand page's drawing is the 3D organs
 * themselves, so zooming into it carries straight on into the rest of the exhibit.
 */
export function StudyLevel({ visible }: { visible: boolean }) {
  const gltf = useGLTF(STUDY_URL);
  const levels = useLevels();
  const refs = useAnatomyRefs();
  const invalidate = useThree((s) => s.invalidate);
  const camera = useThree((s) => s.camera);
  const group = useRef<THREE.Group>(null);
  const pages = useRef<THREE.Group>(null);

  const built = useMemo(() => {
    const root = gltf.scene.clone(true);
    const flameMat = withSweep(new THREE.MeshBasicMaterial({ color: '#ffe0a8', toneMapped: false }));
    root.traverse((o) => {
      o.layers.set(STUDY_LAYER);
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const fix = (raw: THREE.Material) => {
        const name = raw.name.replace(/\.\d+$/, '');
        if (name === 'Flame') return flameMat;
        const m = withSweep((raw as THREE.MeshStandardMaterial).clone());
        m.envMapIntensity = 0.35;
        if (name === 'Glass') {
          m.transparent = true;
          m.opacity = 0.22;
          m.depthWrite = false;
          m.roughness = 0.05;
          m.metalness = 0;
          m.envMapIntensity = 1;
        }
        if (name === 'Jacket' || name === 'Trousers') m.roughness = 0.92;
        if (name === 'Hair') m.roughness = 0.75;
        if (name === 'Skin') m.roughness = 0.6;
        if (name === 'Brass') m.envMapIntensity = 1.2;
        return m;
      };
      mesh.material = Array.isArray(mesh.material) ? mesh.material.map(fix) : fix(mesh.material);
    });
    const w = PAGE.width;
    const h = PAGE.top - PAGE.bottom;
    const cy = (PAGE.top + PAGE.bottom) / 2;
    const left = new THREE.Mesh(pageGeometry(w, h, false), pageMaterial(titlePage()));
    left.position.set(PAGE.gutter - w / 2, cy, PAGE.z);
    const right = new THREE.Mesh(pageGeometry(w, h, true), pageMaterial(platePage()));
    right.position.set(PAGE.gutter + w / 2, cy, PAGE.z);
    left.layers.set(STUDY_LAYER);
    right.layers.set(STUDY_LAYER);
    left.renderOrder = right.renderOrder = -10;
    return { root, left, right };
  }, [gltf]);

  useEffect(() => {
    camera.layers.enable(STUDY_LAYER);
  }, [camera]);

  // the two cards sit at fixed places on screen at their stops (on a 16:9 screen), but they are
  // pinned in the room, so they move with it while the camera travels
  const cards = useMemo(() => {
    const at = (id: 'doctor' | 'name', fx: number, fy: number) => {
      const p = worldPose(id, refs, levels, 16 / 9);
      const fwd = p.target.clone().sub(p.pos);
      const d = fwd.length();
      fwd.normalize();
      const right = new THREE.Vector3().crossVectors(fwd, p.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, fwd);
      const halfH = Math.tan(THREE.MathUtils.degToRad(p.fov / 2)) * d;
      return p.target.clone().addScaledVector(right, fx * halfH * (16 / 9)).addScaledVector(up, fy * halfH);
    };
    return { doctor: at('doctor', -0.92, 0.74), name: at('name', -0.92, 0.74) };
  }, [refs, levels]);

  useEffect(() => {
    const apply = (t: number) => {
      const h = hingeState(t);
      uStudyReveal.value = h.studyReveal;
      if (group.current && group.current.visible !== h.study) {
        group.current.visible = h.study;
        invalidate();
      }
      const showPages = t < HINGE + 1;
      if (pages.current && pages.current.visible !== showPages) {
        pages.current.visible = showPages;
        invalidate();
      }
    };
    apply(journey.t);
    return onJourneyFrame(apply);
  }, [invalidate]);

  const setMatrix = (g: THREE.Group | null) => {
    group.current = g;
    if (!g) return;
    g.matrixAutoUpdate = false;
    g.matrix.copy(levels.study);
    g.matrixWorldNeedsUpdate = true;
  };

  return (
    <>
      <group ref={setMatrix}>
        <primitive object={built.root} />
      </group>
      <Label3D visible={visible} at="doctor" position={cards.doctor} interactive>
        <ProfileCard className="profile--label" />
      </Label3D>
      <group ref={pages}>
        <primitive object={built.left} />
        <primitive object={built.right} />
      </group>
      <Label3D visible={visible} at="name" position={cards.name} interactive>
        <WordPartsCard className="wordparts--label" />
      </Label3D>
    </>
  );
}

useGLTF.preload(STUDY_URL);
