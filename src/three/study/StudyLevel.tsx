import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { journey, onJourneyFrame, smoothstep } from '../../app/journey';
import { STOP_INDEX } from '../../content/story';
import { Portrait } from '../../ui/HistoryCards';
import { sharedOrganUniforms } from '../anatomy/organMaterial';
import { useAnatomyRefs } from '../Director';
import { hingeState, manLine } from '../hinge';
import { Label3D } from '../Label3D';
import { useLevels } from '../levels';
import { PAGE, pageFrame } from '../nested';
import { worldPose } from '../presets';
import { ensureNoiseTexture, NOISE_GLSL, noiseUniform } from '../shaders/noise';
import { pageGeometry, platePage, titlePage } from './pages';

export const STUDY_URL = '/models/study.glb';
/** Study objects live on layer 1, so the organs' soft floor shadow never picks up the desk. */
export const STUDY_LAYER = 1;

/** Where the room's sweep line is (see hinge.ts); the whole room dissolves above it. */
const uStudyReveal = { value: 1e3 };
/** Max Wilms's own sweep line (a height in the study, see manLine), and a line that never moves. */
const uManLine = { value: 1e3 };
const uNoLine = { value: 1e3 };
/** study ← world, to measure heights in the study */
const uToStudy = { value: pageFrame() };

const DEG = Math.PI / 180;
/** The top of his neck, which his head turns about (study metres; see HEAD_C in build_study.py). */
const NECK_TOP = new THREE.Vector3(0, 1.225, 0.435);

/** The meshes that make up the man (he leaves before the room does). */
const MAN = /^(Suit|Cuff|Shoe|Hand|Pen|Nib|Head|Eye|Moustache|Brow|Neck|Collar|JacketCollar|BowTie|ShirtFront|Lapel)/;

/** The desk, the man and everything else in the room dissolve (with a burnt edge) above the sweep. */
function withSweep<M extends THREE.Material>(m: M, man = false): M {
  ensureNoiseTexture();
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uNoise3D: noiseUniform,
      uRevealMin: sharedOrganUniforms.uRevealMin,
      uRevealMax: sharedOrganUniforms.uRevealMax,
      uStudyReveal,
      uManLine: man ? uManLine : uNoLine,
      uToStudy,
    });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSweepW;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvSweepW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>\nvarying vec3 vSweepW;\nuniform float uStudyReveal; uniform float uRevealMin; uniform float uRevealMax; uniform float uManLine; uniform mat4 uToStudy;\n${NOISE_GLSL}`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        float sweepN = snoise(vec3(vSweepW.xz * 2.0, vSweepW.y));
        float sweepY = (vSweepW.y - uRevealMin) / max(uRevealMax - uRevealMin, 1e-4);
        float sweepEdge = uStudyReveal + sweepN * 0.05;
        if (sweepY > sweepEdge) discard;
        float manY = (uToStudy * vec4(vSweepW, 1.0)).y;
        float manEdge = uManLine + sweepN * 0.03;
        if (manY > manEdge) discard;`,
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
        float burn = max((1.0 - smoothstep(0.0, 0.05, sweepEdge - sweepY)) * step(uStudyReveal, 50.0), (1.0 - smoothstep(0.0, 0.03, manEdge - manY)) * step(uManLine, 50.0));
        gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(0.42, 0.26, 0.12), burn * 0.6);`,
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
 * Max Wilms at his desk in 1899 (a simple likeness made for this exhibit from his portrait), seen
 * over his shoulder. His book lies open on a stand; the right-hand page's drawing is the 3D organs
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
      const man = MAN.test(mesh.name);
      const fix = (raw: THREE.Material) => {
        const name = raw.name.replace(/\.\d+$/, '');
        if (name === 'Flame') return flameMat;
        const m = withSweep((raw as THREE.MeshStandardMaterial).clone(), man);
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
    // When we meet him ("Dr. Max Wilms") he looks up from his book at us, then back down: his head
    // turns about the top of his neck, and his eyes (lids painted on) about their own centres.
    const headPivot = new THREE.Group();
    headPivot.position.copy(NECK_TOP);
    root.add(headPivot);
    root.updateMatrixWorld(true);
    const heads: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && /^(Head|Eye|Moustache|Brow)/.test(o.name)) heads.push(o as THREE.Mesh);
    });
    for (const o of heads) headPivot.attach(o);
    const eyes: THREE.Group[] = [];
    for (const side of ['L', 'R']) {
      const eye = heads.find((o) => o.name === `Eye${side}`);
      if (!eye) continue;
      eye.updateMatrix();
      eye.geometry.computeBoundingSphere();
      const g = new THREE.Group();
      g.position.copy(eye.geometry.boundingSphere!.center).applyMatrix4(eye.matrix);
      headPivot.add(g);
      g.attach(eye);
      eyes.push(g);
    }

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
    return { root, left, right, headPivot, eyes };
  }, [gltf]);

  useEffect(() => {
    camera.layers.enable(STUDY_LAYER);
  }, [camera]);

  // his photograph sits at a fixed place on screen at his stop (on a 16:9 screen), but it is pinned
  // in the room, so it moves with the room while the camera travels
  const photo = useMemo(() => {
    const at = (id: 'doctor', fx: number, fy: number) => {
      const p = worldPose(id, refs, levels, 16 / 9);
      const fwd = p.target.clone().sub(p.pos);
      const d = fwd.length();
      fwd.normalize();
      const right = new THREE.Vector3().crossVectors(fwd, p.up).normalize();
      const up = new THREE.Vector3().crossVectors(right, fwd);
      const halfH = Math.tan(THREE.MathUtils.degToRad(p.fov / 2)) * d;
      return p.target.clone().addScaledVector(right, fx * halfH * (16 / 9)).addScaledVector(up, fy * halfH);
    };
    return at('doctor', -0.92, 0.74);
  }, [refs, levels]);

  useEffect(() => {
    const apply = (t: number) => {
      const h = hingeState(t);
      uStudyReveal.value = h.studyReveal;
      uManLine.value = manLine(t);
      // he looks up at the class when we meet him, and again when we are back at his desk at the end
      const look = Math.max(1 - smoothstep(0.22, 0.62, Math.abs(t - STOP_INDEX.doctor)), smoothstep(STOP_INDEX.end - 0.5, STOP_INDEX.end - 0.1, t));
      built.headPivot.rotation.set(DEG * 10 * look, DEG * -24 * look, 0, 'YXZ');
      for (const g of built.eyes) g.rotation.set(DEG * 24 * look, DEG * -9 * look, 0, 'YXZ');
      if (group.current && group.current.visible !== h.study) {
        group.current.visible = h.study;
        invalidate();
      }
      const showPages = h.page > 0;
      if (pages.current && pages.current.visible !== showPages) {
        pages.current.visible = showPages;
        invalidate();
      }
    };
    apply(journey.t);
    return onJourneyFrame(apply);
  }, [invalidate, built]);

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
      <Label3D visible={visible} at="doctor" position={photo}>
        <Portrait />
      </Label3D>
      <group ref={pages}>
        <primitive object={built.left} />
        <primitive object={built.right} />
      </group>
    </>
  );
}

useGLTF.preload(STUDY_URL);
