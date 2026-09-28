import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Canvas, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import * as THREE from 'three';
import { registerInvalidate } from '../app/journey';
import { LITE, rememberLite } from '../app/quality';
import { useStory } from '../app/store';
import { STOPS, type World } from '../content/story';
import { AnatomyWorld } from './anatomy/AnatomyWorld';
import { DiagnosisWorld } from './diagnosis/DiagnosisWorld';
import { Director } from './Director';
import { MicroWorld } from './micro/MicroWorld';
import { TestHooks } from './TestHooks';
import { TissueWorld } from './tissue/TissueWorld';
import { VilliWorld } from './tissue/VilliWorld';

const ANIMATED: World[] = ['villi', 'micro', 'diagnosis'];
const ORDER: World[] = ['anatomy', 'tissue', 'villi', 'micro', 'diagnosis'];

/**
 * Rendering only happens when something changes: while scrolling, and while a scene that moves by
 * itself (villi, cells, the biopsy, PCR) is on screen. Those scenes are paced at 60 frames a
 * second at most (screens that refresh 120 times a second would otherwise draw twice as often),
 * and at 30 on slower devices.
 */
function LoopControl() {
  const world = useStory((s) => s.displayWorld);
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
    const animated = ANIMATED.includes(world) || (world === 'anatomy' && STOPS[stop].id === 'end');
    if (!animated || reduced) return;
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
  }, [world, stop, reduced, lowPower, setFrameloop, invalidate]);
  return null;
}

/* ------------------------------------------------------------------ light rig */

type PointCfg = { pos: [number, number, number]; i: number; d: number; color: string };
type LightCfg = { hemi: number; key: number; point: PointCfg };
const OFF: PointCfg = { pos: [0, 0, 0], i: 0, d: 1, color: '#ffffff' };
const RIG: Record<World, LightCfg> = {
  none: { hemi: 0, key: 1.55, point: OFF },
  anatomy: { hemi: 0.08, key: 1.55, point: OFF },
  tissue: { hemi: 0.6, key: 1.55, point: { pos: [0.6, 0.15, 0.25], i: 2.2, d: 5, color: '#ffe4d6' } },
  villi: { hemi: 0.35, key: 2.1, point: { pos: [0.9, 1.3, 2.6], i: 2.6, d: 5, color: '#ffe2d2' } },
  micro: { hemi: 0.25, key: 1.2, point: { pos: [2, 3, 5], i: 2.6, d: 14, color: '#ffe9f2' } },
  diagnosis: { hemi: 0.3, key: 1.9, point: { pos: [-0.25, 0.39, -0.08], i: 3.2, d: 2.6, color: '#fff3e2' } },
};

/**
 * One fixed set of lights for every world (2 directional, 1 point, hemisphere, ambient).
 * Worlds change intensities, never the number of lights, so every shader program stays valid:
 * each world compiles once and switches instantly. Fewer lights also means smaller shaders.
 */
function LightRig() {
  const world = useStory((s) => s.displayWorld);
  const invalidate = useThree((s) => s.invalidate);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const key = useRef<THREE.DirectionalLight>(null);
  const point = useRef<THREE.PointLight>(null);
  useLayoutEffect(() => {
    const c = RIG[world];
    if (hemi.current) hemi.current.intensity = c.hemi;
    if (key.current) key.current.intensity = c.key;
    if (point.current) {
      point.current.position.set(...c.point.pos);
      point.current.intensity = c.point.i;
      point.current.distance = c.point.d;
      point.current.color.set(c.point.color);
    }
    invalidate();
  }, [world, invalidate]);
  return (
    <>
      <ambientLight intensity={0.14} />
      <hemisphereLight ref={hemi} args={['#fff1ea', '#3a1d22', 0]} />
      <directionalLight ref={key} position={[2.6, 4.2, 3.6]} intensity={1.55} color="#fff1e2" />
      <directionalLight position={[-3.5, 1.8, -3.8]} intensity={1.3} color="#ffd6c6" />
      <pointLight ref={point} intensity={0} decay={2} />
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

/* ------------------------------------------------------------------ worlds */

/**
 * Owns a world's visibility. On mount it compiles the world's shaders in parallel
 * (renderer.compileAsync) while the world is still hidden, then reports it ready.
 */
function WorldShell({ name, children }: { name: World; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const display = useStory((s) => s.displayWorld);
  const setReady = useStory((s) => s.setWorldReady);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);

  useLayoutEffect(() => {
    const g = ref.current;
    if (!g) return;
    let alive = true;
    const was = g.visible;
    g.visible = true;
    const t0 = performance.now();
    gl.compileAsync(g, camera, scene)
      .catch(() => undefined)
      .then(() => {
        if (!alive) return;
        if (import.meta.env.DEV || window.location.search.includes('e2e'))
          console.info(`[stage] ${name} compiled in ${Math.round(performance.now() - t0)} ms (t=${Math.round(performance.now())})`);
        setReady(name);
        invalidate();
      });
    g.visible = was;
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group ref={ref} visible={display === name}>
      {children}
    </group>
  );
}

/** Mount the needed world first, then the rest one at a time when the browser is idle. */
function useProgressiveMount() {
  const stop = useStory((s) => s.stop);
  const display = useStory((s) => s.displayWorld);
  const worldReady = useStory((s) => s.worldReady);
  const [mounted, setMounted] = useState<World[]>(() => {
    const w = STOPS[useStory.getState().stop].world;
    return w === 'none' || w === 'anatomy' ? ['anatomy'] : ['anatomy', w];
  });
  // the world on screen (and the next stop's) must be mounted right away
  useEffect(() => {
    const need = [STOPS[stop].world, STOPS[Math.min(STOPS.length - 1, stop + 1)].world, display].filter(
      (w) => w !== 'none' && !mounted.includes(w),
    );
    if (need.length) setMounted((m) => [...m, ...need.filter((w, i) => need.indexOf(w) === i)]);
  }, [stop, display, mounted]);
  // then warm up the rest in story order, once the previous one has compiled
  useEffect(() => {
    if (!worldReady.anatomy) return;
    const pending = ORDER.filter((w) => !mounted.includes(w));
    if (!pending.length) return;
    const allReady = mounted.every((w) => worldReady[w]);
    if (!allReady) return;
    const go = () => setMounted((m) => (m.includes(pending[0]) ? m : [...m, pending[0]]));
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(go, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(go, 300);
    return () => clearTimeout(id);
  }, [worldReady, mounted]);
  return mounted;
}

function Worlds() {
  const display = useStory((s) => s.displayWorld);
  const mounted = useProgressiveMount();
  const ready = useStory((s) => s.worldReady.anatomy);
  const setStageReady = useStory((s) => s.setStageReady);
  useEffect(() => {
    if (ready) setStageReady(true);
  }, [ready, setStageReady]);
  return (
    <>
      {ORDER.filter((w) => mounted.includes(w)).map((w) => {
        const vis = display === w;
        return (
          <WorldShell key={w} name={w}>
            {w === 'anatomy' && <AnatomyWorld visible={vis} />}
            {w === 'tissue' && <TissueWorld visible={vis} />}
            {w === 'villi' && <VilliWorld visible={vis} />}
            {w === 'micro' && <MicroWorld visible={vis} />}
            {w === 'diagnosis' && <DiagnosisWorld visible={vis} />}
          </WorldShell>
        );
      })}
    </>
  );
}

/**
 * Pixel budget: big screens (a 4K smart board, a projector) would otherwise draw millions of
 * pixels per frame. The 3D is drawn at most ~2600 pixels wide (~1920 on lite devices) and
 * stretched to fill the screen. It only goes lower if the device keeps dropping frames.
 */
const CSS_WIDTH = Math.max(1, window.innerWidth);
const LITE_CAP = Math.min(1, Math.max(0.5, 1920 / CSS_WIDTH));
const DPR_CAP = LITE ? LITE_CAP : Math.min(1.5, Math.max(0.75, 2600 / CSS_WIDTH));

/**
 * If a device that looked fast keeps dropping frames once everything has loaded, switch it to the
 * lighter settings now (fewer pixels, 30 fps, no screen effects) and remember that for next time.
 */
const started = performance.now();
let declines = 0;

export default function Stage() {
  const setWebgl = useStory((s) => s.setWebgl);
  const setLowPower = useStory((s) => s.setLowPower);
  const [dpr, setDpr] = useState(DPR_CAP);
  const onDecline = () => {
    setDpr(Math.max(0.5, Math.min(DPR_CAP, LITE_CAP) * 0.85));
    if (LITE || performance.now() - started < 10000 || ++declines < 2) return;
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
      onCreated={({ gl }) => {
        gl.setClearColor(0x000000, 0);
        gl.toneMapping = THREE.NeutralToneMapping;
        gl.toneMappingExposure = 1.05;
        gl.localClippingEnabled = true;
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
      <PerformanceMonitor onDecline={onDecline} onIncline={() => setDpr(useStory.getState().lowPower ? LITE_CAP : DPR_CAP)} flipflops={3} />
      <AdaptiveDpr pixelated={false} />
      <LoopControl />
      <LightRig />
      <Suspense fallback={null}>
        <Director />
        <Worlds />
        <TestHooks />
      </Suspense>
    </Canvas>
  );
}
