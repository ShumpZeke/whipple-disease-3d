import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { isOverviewTreatmentTravel, journey, pokeJourney, registerInvalidate, travel, travelProgress } from '../app/journey';
import { LITE, rememberLite } from '../app/quality';
import { useStory } from '../app/store';
import { LAST_STOP, STOPS, type StopId } from '../content/story';
import { AnatomyWorld } from './anatomy/AnatomyWorld';
import { Scans } from './diagnosis/Scans';
import { Director, view } from './Director';
import { hingeState } from './hinge';
import { useLevels } from './levels';
import { StudyLevel } from './study/StudyLevel';
import { TestHooks } from './TestHooks';

/** Stops whose scene moves by itself (flowing filter, dividing cells, spinning DNA, scans). */
const ANIMATED: StopId[] = ['nephron', 'cause', 'genes', 'ultrasound', 'scans'];

/**
 * Rendering only happens when something changes: while scrolling, and while a scene that moves by
 * itself is on screen. Those scenes are paced at 60 frames a second at most (screens that refresh
 * 120 times a second would otherwise draw twice as often), and at 30 on slower devices.
 */
function LoopControl() {
  const stop = useStory((s) => s.stop);
  const reduced = useStory((s) => s.reducedMotion);
  const lowPower = useStory((s) => s.lowPower);
  const setFrameloop = useThree((s) => s.setFrameloop);
  const invalidate = useThree((s) => s.invalidate);
  // the scroll journey renders on demand: it calls invalidate() while t is moving
  useEffect(() => {
    registerInvalidate(invalidate);
    return () => registerInvalidate(null);
  }, [invalidate]);
  useEffect(() => {
    setFrameloop('demand');
    invalidate();
    if (isOverviewTreatmentTravel() || !ANIMATED.includes(STOPS[stop].id) || reduced) return;
    const gap = 1000 / (LITE || lowPower ? 30 : 60) - 2;
    let last = 0;
    let raf = requestAnimationFrame(function tick(now) {
      if (now - last >= gap) {
        last = now;
        invalidate();
      }
      raf = requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [stop, reduced, lowPower, setFrameloop, invalidate]);
  return null;
}

/* ------------------------------------------------------------------ lights */

/**
 * One fixed set of lights for the whole journey (ambient, hemisphere, a key and a rim light, a
 * fill light that travels with the camera, and the oil lamp in the study). Each stop sets their
 * strengths and the scroll blends between neighbouring stops, so the light changes as smoothly as
 * the camera moves. The number of lights never changes, so every shader stays valid.
 */
type Rig = { amb: number; hemi: number; key: number; rim: number; fill: number; fillAt: [number, number, number]; fillColor: string };
const ORGANS: Rig = { amb: 0.14, hemi: 0.08, key: 1.55, rim: 1.3, fill: 0, fillAt: [0.4, 0.4, 0.6], fillColor: '#ffe8da' };
const STUDY: Rig = { amb: 0.05, hemi: 0.05, key: 0.22, rim: 0.35, fill: 0, fillAt: [0.4, 0.4, 0.6], fillColor: '#ffe8da' };
const RIGS: Record<StopId, Rig> = {
  title: STUDY,
  // a soft warm light on the side of his face we see (the lamp lights the other side)
  doctor: { ...STUDY, fill: 0.9, fillAt: [0.35, 0.45, 0.55], fillColor: '#ffdcc0' },
  book: STUDY,
  name: { ...STUDY, key: 0.4 },
  body: ORGANS,
  kidneys: ORGANS,
  inside: { amb: 0.16, hemi: 0.5, key: 1.6, rim: 1.1, fill: 1.4, fillAt: [0.35, 0.4, 0.7], fillColor: '#ffe8da' },
  nephron: { amb: 0.14, hemi: 0.35, key: 1.9, rim: 1.2, fill: 1.6, fillAt: [0.2, 0.35, 0.5], fillColor: '#ffe2d2' },
  cause: { amb: 0.14, hemi: 0.25, key: 1.2, rim: 1.2, fill: 1.8, fillAt: [0.3, 0.45, 0.8], fillColor: '#ffe9f2' },
  genes: { amb: 0.14, hemi: 0.25, key: 1.2, rim: 1.2, fill: 1.8, fillAt: [0.3, 0.45, 0.8], fillColor: '#ffe9f2' },
  lump: ORGANS,
  signs: ORGANS,
  ultrasound: { ...ORGANS, hemi: 0.3, fill: 0.8, fillAt: [0.3, 0.5, 0.7], fillColor: '#eef3ff' },
  scans: { ...ORGANS, hemi: 0.3, fill: 0.8, fillAt: [0.3, 0.5, 0.7], fillColor: '#eef3ff' },
  treatment: ORGANS,
  outlook: ORGANS,
  // back at his desk: the lamp is lit again, and a soft light on his face as he looks up at us
  end: { ...STUDY, fill: 0.7, fillAt: [0.3, 0.45, 0.6], fillColor: '#ffdcc0' },
  quiz: { ...STUDY, fill: 0.7, fillAt: [0.3, 0.45, 0.6], fillColor: '#ffdcc0' },
};
const ease = (k: number) => k * k * (3 - 2 * k);
/** The oil lamp's flame, in the study (metres, three.js axes). */
const FLAME = new THREE.Vector3(-0.46, 1.09, -0.12);

function LightRig() {
  const levels = useLevels();
  const amb = useRef<THREE.AmbientLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const rim = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.PointLight>(null);
  const lamp = useRef<THREE.PointLight>(null);
  const camera = useThree((s) => s.camera);
  const flame = useMemo(() => FLAME.clone().applyMatrix4(levels.study), [levels]);
  const color = useMemo(() => ({ a: new THREE.Color(), b: new THREE.Color() }), []);
  const v = useMemo(() => ({ right: new THREE.Vector3(), up: new THREE.Vector3(), back: new THREE.Vector3() }), []);
  useFrame(() => {
    const t = Math.min(LAST_STOP, Math.max(0, journey.t));
    let k: number;
    let A: Rig;
    let B: Rig;
    if (isOverviewTreatmentTravel()) {
      k = ease(travelProgress(t));
      A = RIGS[STOPS[travel.from].id];
      B = RIGS[STOPS[travel.to].id];
    } else {
      const i = Math.min(LAST_STOP - 1, Math.floor(t));
      k = ease(t - i);
      A = RIGS[STOPS[i].id];
      B = RIGS[STOPS[i + 1].id];
    }
    const mix = (a: number, b: number) => a + (b - a) * k;
    if (amb.current) amb.current.intensity = mix(A.amb, B.amb);
    if (hemi.current) hemi.current.intensity = mix(A.hemi, B.hemi);
    if (key.current) key.current.intensity = mix(A.key, B.key);
    if (rim.current) rim.current.intensity = mix(A.rim, B.rim);
    if (fill.current) {
      // travels with the camera and scales with the zoom, so it lights every scale the same way
      const d = view.d;
      v.back.copy(camera.position).sub(view.target).normalize();
      v.up.copy(camera.up).normalize();
      v.right.crossVectors(v.up, v.back).normalize();
      const off = [0, 1, 2].map((j) => mix(A.fillAt[j], B.fillAt[j]));
      fill.current.position
        .copy(view.target)
        .addScaledVector(v.right, off[0] * d)
        .addScaledVector(v.up, off[1] * d)
        .addScaledVector(v.back, off[2] * d);
      const r2 = d * d * (off[0] ** 2 + off[1] ** 2 + off[2] ** 2);
      fill.current.intensity = mix(A.fill, B.fill) * r2 * 1.6;
      fill.current.color.copy(color.a.set(A.fillColor)).lerp(color.b.set(B.fillColor), k);
    }
    if (lamp.current) {
      lamp.current.position.copy(flame);
      lamp.current.intensity = 42 * hingeState(journey.t).lamp;
    }
  });
  return (
    <>
      <ambientLight ref={amb} intensity={0.14} />
      <hemisphereLight ref={hemi} args={['#fff1ea', '#3a1d22', 0]} />
      <directionalLight ref={key} position={[2.6, 4.2, 3.6]} intensity={1.55} color="#fff1e2" />
      <directionalLight ref={rim} position={[-3.5, 1.8, -3.8]} intensity={1.3} color="#ffd6c6" />
      <pointLight ref={fill} intensity={0} decay={2} distance={0} />
      <pointLight ref={lamp} intensity={0} decay={2} distance={0} color="#ffc27a" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#fff4e8" position={[0, 4.5, 2.5]} scale={[7, 2.4, 1]} rotation-x={Math.PI / 2.6} />
        <Lightformer form="rect" intensity={1.3} color="#ffd9c4" position={[-5, 1, 1.5]} scale={[3, 6, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={0.9} color="#d6e4ff" position={[5, 1.5, -2.5]} scale={[3, 6, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="circle" intensity={0.7} color="#ffe7d6" position={[0, 1, 6]} scale={3} />
        <Lightformer form="rect" intensity={0.45} color="#b9c7ff" position={[-3, -3, 4]} scale={[4, 4, 1]} />
        <Lightformer form="rect" intensity={0.35} color="#3a2520" position={[0, -5, 0]} scale={[10, 10, 1]} rotation-x={-Math.PI / 2} />
      </Environment>
    </>
  );
}

/* ------------------------------------------------------------------ the one world */

/**
 * Moments of the journey drawn once, off screen, while the exhibit loads: some parts only take
 * their final form while you scroll (the kidney's cut faces, the cells' colours, the scan
 * pictures), so this compiles their shaders and uploads their textures before the first scroll
 * instead of in the middle of a zoom.
 */
const WARM_UP = [3.5, 5.7, 6.6, 7.6, 8.6, 9, 9.6, 11.7, 12.2, 12.9, 13.6, 14.2, 15.4, 15.7];

/**
 * Everything lives in one scene, each scale nested inside the last: the study holds the book, the
 * book's drawing is the organs, the kidney holds the filter, and so on. On mount every shader is
 * compiled in the background (renderer.compileAsync) and the journey's key moments are drawn once
 * before the stage says it is ready.
 */
function World() {
  const ref = useRef<THREE.Group>(null);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const advance = useThree((s) => s.advance);
  const setStageReady = useStory((s) => s.setStageReady);
  const setWorldReady = useStory((s) => s.setWorldReady);
  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    let alive = true;
    // draw everything once, hidden parts too, so their shaders compile up front
    const hidden: THREE.Object3D[] = [];
    g.traverse((o) => {
      if (!o.visible) {
        hidden.push(o);
        o.visible = true;
      }
    });
    const t0 = performance.now();
    gl.compileAsync(scene, camera)
      .catch(() => undefined)
      .then(() => {
        if (!alive) return;
        const t1 = performance.now();
        const keep = journey.t;
        for (const t of WARM_UP) {
          journey.t = t;
          pokeJourney();
          advance(performance.now());
        }
        journey.t = keep;
        pokeJourney();
        advance(performance.now());
        if (import.meta.env.DEV || window.location.search.includes('e2e'))
          console.info(`[stage] compiled in ${Math.round(t1 - t0)} ms, warmed up in ${Math.round(performance.now() - t1)} ms`);
        setWorldReady('anatomy');
        setStageReady(true);
        invalidate();
      });
    for (const o of hidden) o.visible = false;
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <group ref={ref}>
      <StudyLevel visible />
      <AnatomyWorld visible />
      <Scans visible />
    </group>
  );
}

/**
 * Pixel budget: big screens (a 4K smart board, a projector) would otherwise draw millions of
 * pixels per frame. The 3D is drawn at most ~2200 pixels wide (~1920 on lite devices) and
 * stretched to fill the screen. It only goes lower if the device keeps dropping frames.
 */
const CSS_WIDTH = Math.max(1, window.innerWidth);
const LITE_CAP = Math.min(1, Math.max(0.5, 1920 / CSS_WIDTH));
const DPR_CAP = LITE ? LITE_CAP : Math.min(1.5, Math.max(0.75, 2200 / CSS_WIDTH));

/**
 * If a device that looked fast keeps dropping frames once everything has loaded, switch it to the
 * lighter settings now (fewer pixels, 30 fps) and remember that for next time. Frames are only
 * watched once the stage is ready (loading and compiling the shaders stalls every device).
 */
let readyAt = Infinity;
let declines = 0;

export default function Stage() {
  const setWebgl = useStory((s) => s.setWebgl);
  const setLowPower = useStory((s) => s.setLowPower);
  const ready = useStory((s) => s.stageReady);
  const [dpr, setDpr] = useState(DPR_CAP);
  useEffect(() => {
    if (ready) readyAt = performance.now();
  }, [ready]);
  const onDecline = () => {
    setDpr(Math.max(0.5, Math.min(DPR_CAP, LITE_CAP) * 0.85));
    if (LITE || performance.now() - readyAt < 10000 || ++declines < 2) return;
    setLowPower();
    rememberLite();
    document.documentElement.classList.add('lite');
  };
  return (
    <Canvas
      className="stage-canvas"
      frameloop="demand"
      dpr={[Math.min(1, dpr), dpr]}
      camera={{ position: [0, 0.05, 7.4], fov: 16, near: 0.05, far: 80 }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: 'high-performance',
        preserveDrawingBuffer: false,
      }}
      onCreated={({ gl, camera }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.localClippingEnabled = true;
        camera.layers.enableAll();
        // the picture is described by the captions; its labels and buttons stay reachable
        gl.domElement.setAttribute('aria-hidden', 'true');
        // if the graphics card drops the 3D and doesn't bring it back, switch to the still images
        let lost: ReturnType<typeof setTimeout> | undefined;
        gl.domElement.addEventListener('webglcontextlost', (e) => {
          e.preventDefault();
          lost = setTimeout(() => setWebgl('failed'), 5000);
        });
        gl.domElement.addEventListener('webglcontextrestored', () => clearTimeout(lost));
        setWebgl('ok');
      }}
    >
      {ready && <PerformanceMonitor onDecline={onDecline} onIncline={() => setDpr(useStory.getState().lowPower ? LITE_CAP : DPR_CAP)} flipflops={3} />}
      <AdaptiveDpr pixelated={false} />
      <LoopControl />
      <Suspense fallback={null}>
        <Director />
        <LightRig />
        <World />
        <TestHooks />
      </Suspense>
    </Canvas>
  );
}
