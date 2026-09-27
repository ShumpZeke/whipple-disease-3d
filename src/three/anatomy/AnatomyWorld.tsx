import { ContactShadows, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import gsap from 'gsap';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useStory } from '../../app/store';
import { STEPS } from '../../content/story';
import { Cites, TermButton } from '../../ui/RichText';
import { Label3D } from '../Label3D';
import { DigestiveModel } from './DigestiveModel';
import { createOrganMaterial, sharedOrganUniforms } from './organMaterial';
import { MODEL_SCALE, useAnatomy } from './useAnatomy';

/* ------------------------------------------------------------ 1907 plate → modern model */

function HingeController() {
  const step = useStory((s) => s.step);
  const reduced = useStory((s) => s.reducedMotion);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const data = useAnatomy();
  const id = STEPS[step].id;

  useEffect(() => {
    sharedOrganUniforms.uPixelRatio.value = gl.getPixelRatio();
    const b = data.bounds;
    sharedOrganUniforms.uRevealMin.value = b.min.y * MODEL_SCALE;
    sharedOrganUniforms.uRevealMax.value = b.max.y * MODEL_SCALE;
  }, [gl, data]);

  useEffect(() => {
    const u = sharedOrganUniforms;
    const paper = document.querySelector<HTMLElement>('.hinge-paper');
    const label = document.querySelector<HTMLElement>('.plate-label');
    const main = document.querySelector<HTMLElement>('main.exhibit');
    const setPaper = (on: boolean) => main?.classList.toggle('is-paper', on);
    const setSweep = (r: number) => {
      // model height maps to roughly 8%–92% of the viewport in the plate framing
      const line = 0.08 + (1 - r) * 0.84;
      paper?.style.setProperty('--sweep', String(line));
    };
    if (id !== 'modern') {
      u.uEngrave.value = 0;
      u.uReveal.value = -0.2;
      setSweep(-0.3);
      setPaper(false);
      invalidate();
      return;
    }
    u.uEngrave.value = 1;
    u.uReveal.value = 1.3;
    setSweep(1.3);
    setPaper(true);
    if (label) label.style.opacity = '1';
    invalidate();
    const state = { r: 1.3 };
    const tl = gsap.timeline({ delay: reduced ? 0.4 : 2.2 });
    tl.to(state, {
      r: -0.15,
      duration: reduced ? 0.01 : 3.2,
      ease: 'power1.inOut',
      onStart: () => {
        if (label) label.style.opacity = '0';
      },
      onUpdate: () => {
        u.uReveal.value = state.r;
        setSweep(state.r);
        if (state.r < 0.45) setPaper(false);
        invalidate();
      },
    });
    tl.add(() => {
      u.uEngrave.value = 0;
      invalidate();
    });
    return () => {
      tl.kill();
      setPaper(false);
    };
  }, [id, reduced, invalidate]);

  return null;
}

/* ------------------------------------------------------------ anchored markers */

function FactMarkers({ visible }: { visible: boolean }) {
  const step = useStory((s) => s.step);
  const sub = useStory((s) => s.sub);
  const goTo = useStory((s) => s.goTo);
  const next = useStory((s) => s.next);
  const data = useAnatomy();
  const id = STEPS[step].id;
  const a = data.anchors;
  const world = (n: string) => (a[n] ? a[n].position.clone().multiplyScalar(MODEL_SCALE) : null);
  const focusPt = world('label_SmallIntestine') ?? world('anchor_si_center');
  const labels = ['Cause', 'Symptoms', 'Diagnosis', 'Treatment'];
  const factsStep = STEPS.findIndex((s) => s.id === 'facts');
  return (
    <>
      {focusPt && (
        <Label3D visible={visible && id === 'overview'} position={focusPt} center interactive>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button type="button" className="marker marker--pulse" aria-label="Focus on the small intestine" onClick={next}>
              +
            </button>
            <span className="tag" style={{ pointerEvents: 'none' }}>
              Small intestine
            </span>
          </div>
        </Label3D>
      )}
      {[1, 2, 3, 4].map((i) => {
        const p = world(`anchor_fact${i}`);
        if (!p) return null;
        return (
          <Label3D key={i} visible={visible && id === 'facts'} position={p} center interactive>
            <button
              type="button"
              className={`marker${sub === i - 1 ? ' is-active' : ''}`}
              aria-label={`Clinical fact ${i}: ${labels[i - 1]}`}
              onClick={() => goTo(factsStep, i - 1)}
            >
              {i}
            </button>
          </Label3D>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------ other organ systems */

const SAT = [
  {
    url: '/models/brain.glb',
    key: 'brain',
    name: 'Brain',
    pos: [1.62, 0.74, -0.1] as const,
    rot: -1.25,
    size: 0.52,
    color: '#d8b2a8',
    text: 'Memory loss, confusion, unusual eye movements.',
    cites: [1, 3],
  },
  {
    url: '/models/heart.glb',
    key: 'heart',
    name: 'Heart',
    pos: [1.62, 0.02, 0] as const,
    rot: 0.35,
    size: 0.46,
    color: '#a9463d',
    text: (
      <>
        Can infect the heart’s lining and valves — <TermButton termKey="endocarditis">endocarditis</TermButton>.
      </>
    ),
    cites: [1, 3],
  },
  {
    url: '/models/knee.glb',
    key: 'knee',
    name: 'Joints',
    pos: [1.62, -0.72, 0] as const,
    rot: 0.25,
    size: 0.5,
    color: '#e3d6c3',
    text: 'Joint pain is often the first sign — sometimes years earlier.',
    cites: [2, 3],
  },
];

function Satellite({ s, visible }: { s: (typeof SAT)[number]; visible: boolean }) {
  const gltf = useGLTF(s.url);
  const invalidate = useThree((st) => st.invalidate);
  const group = useRef<THREE.Group>(null);
  const { object, scale } = useMemo(() => {
    const root = gltf.scene.clone(true);
    const box = new THREE.Box3().setFromObject(root);
    const dim = box.getSize(new THREE.Vector3());
    const scale = s.size / Math.max(dim.x, dim.y, dim.z);
    const mat = createOrganMaterial(
      {
        id: 'SmallIntestine',
        name: s.name,
        color: s.color,
        vein: '#6d2a2a',
        veinStrength: s.key === 'knee' ? 0 : 0.15,
        roughness: s.key === 'knee' ? 0.6 : 0.4,
        clearcoat: s.key === 'knee' ? 0.2 : 0.6,
        sheen: 0.3,
        sheenColor: '#ffd9cc',
        bumpScale: 60,
        bumpStrength: 0.0004,
        mottle: 0.08,
      },
      scale,
    );
    root.updateMatrixWorld(true);
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) {
        (o as THREE.Mesh).material = mat;
        // noise in model units (undo quantization); satellites are ≈0.1–0.2 m models
        mat.userData.uniforms.uObjMatrix.value.copy(o.matrixWorld);
      }
    });
    return { object: root, scale };
  }, [gltf, s]);

  useEffect(() => {
    if (!group.current) return;
    const g = group.current;
    gsap.to(g.scale, {
      x: visible ? scale : 0.0001,
      y: visible ? scale : 0.0001,
      z: visible ? scale : 0.0001,
      duration: 0.9,
      ease: 'power3.out',
      delay: visible ? 0.35 : 0,
      onUpdate: invalidate,
    });
  }, [visible, scale, invalidate]);

  return (
    <group position={[s.pos[0], s.pos[1], s.pos[2]]}>
      <group ref={group} scale={0.0001} rotation-y={s.rot}>
        <primitive object={object} />
      </group>
      <Label3D visible={visible} position={[0.3, 0, 0]} interactive>
        <div className="leader">
          <span className="leader__line" />
          <span className="tag" style={{ whiteSpace: 'normal', width: 230 }}>
            <span>
              <b>{s.name}</b>
              <br />
              <small style={{ color: 'var(--ivory-soft)' }}>
                {s.text} <Cites ids={s.cites} />
              </small>
            </span>
          </span>
        </div>
      </Label3D>
    </group>
  );
}

function Satellites() {
  const step = useStory((s) => s.step);
  const id = STEPS[step].id;
  const [mounted, setMounted] = useState(false);
  const idx = step;
  // prefetch shortly before the "other organs" chapter
  useEffect(() => {
    const systems = STEPS.findIndex((s) => s.id === 'systems');
    if (idx >= systems - 3) setMounted(true);
  }, [idx]);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      {SAT.map((s) => (
        <Satellite key={s.key} s={s} visible={id === 'systems'} />
      ))}
    </Suspense>
  );
}

/* ------------------------------------------------------------ world */

export function AnatomyWorld({ visible }: { visible: boolean }) {
  const step = useStory((s) => s.step);
  const id = STEPS[step].id;
  const shadowOpacity = id === 'modern' ? 0 : 0.55;
  const idle = useRef(0);
  const g = useRef<THREE.Group>(null);
  const invalidate = useThree((s) => s.invalidate);
  const reduced = useStory((s) => s.reducedMotion);
  const interacted = useStory((s) => s.interacted);

  // gentle turntable only on the final "explore" screen, until the visitor takes over
  useFrame((_, dt) => {
    if (!g.current) return;
    if (id === 'end' && !reduced && !interacted) {
      idle.current += dt;
      g.current.rotation.y = Math.sin(idle.current * 0.25) * 0.35;
      invalidate();
    } else if (Math.abs(g.current.rotation.y) > 0.0005) {
      g.current.rotation.y *= 0.9;
      invalidate();
    } else {
      g.current.rotation.y = 0;
    }
  });

  return (
    <group>
      <group ref={g}>
        <DigestiveModel />
      </group>
      <FactMarkers visible={visible} />
      <Satellites />
      <HingeController />
      {visible && (
        <ContactShadows
          position={[0, -0.98, 0]}
          scale={3.2}
          blur={2.6}
          far={1.4}
          resolution={512}
          opacity={shadowOpacity}
          color="#050404"
          frames={1}
        />
      )}
    </group>
  );
}
