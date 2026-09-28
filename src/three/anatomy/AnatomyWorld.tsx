import { ContactShadows, useGLTF } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { frameState, HINGE, journey, onJourneyFrame, smoothstep } from '../../app/journey';
import { useStopId, useStory } from '../../app/store';
import { STOPS, STOP_INDEX } from '../../content/story';
import { Cites, TermButton } from '../../ui/RichText';
import { useJourney } from '../../ui/useJourney';
import { Label3D } from '../Label3D';
import { DigestiveModel } from './DigestiveModel';
import { createOrganMaterial, sharedOrganUniforms } from './organMaterial';
import { MODEL_SCALE, useAnatomy } from './useAnatomy';

/* ------------------------------------------------------------ 1907 plate → modern model */

/**
 * Scroll-driven hinge between history and today. While scrolling from the "name" stop to the
 * "body" stop the 1907 page gives way to paper, the model fades in as an engraved plate, then a
 * sweep "develops" it into the realistic model (and the paper wipes away with it).
 */
function HingeController() {
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const data = useAnatomy();

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
    const layer = document.querySelector<HTMLElement>('.canvas-layer');
    const apply = (t: number) => {
      const fs = frameState(t);
      let engrave = 0;
      let reveal = -0.2;
      let paperOpacity = 0;
      let canvasOpacity = t >= HINGE + 1 ? 1 : 0;
      let labelOpacity = 0;
      if (fs.hinge) {
        const f = fs.f;
        reveal = 1.3 - 1.45 * smoothstep(0.55, 0.95, f);
        engrave = f < 0.985 ? 1 : 0;
        paperOpacity = smoothstep(0.06, 0.34, f);
        canvasOpacity = smoothstep(0.2, 0.44, f);
        labelOpacity = smoothstep(0.24, 0.42, f) * (1 - smoothstep(0.52, 0.62, f));
      }
      u.uEngrave.value = engrave;
      u.uReveal.value = reveal;
      // model height maps to roughly 8%–92% of the viewport in the plate framing
      paper?.style.setProperty('--sweep', String(0.08 + (1 - reveal) * 0.84));
      if (paper) paper.style.opacity = String(paperOpacity);
      if (label) label.style.opacity = String(labelOpacity);
      if (layer) layer.style.opacity = String(canvasOpacity);
      main?.classList.toggle('is-paper', fs.hinge && fs.f > 0.16 && reveal > 0.45);
      invalidate();
    };
    apply(journey.t);
    return onJourneyFrame((t) => apply(t));
  }, [invalidate]);

  return null;
}

/* ------------------------------------------------------------ anchored marker */

/** At the "body" stop, a single marker invites the visitor to zoom into the small intestine. */
function IntestineMarker({ visible }: { visible: boolean }) {
  const stopId = useStopId();
  const data = useAnatomy();
  const box = useRef<HTMLDivElement | null>(null);
  // only once the engraving has fully "developed" into the modern model
  const apply = (t: number) => {
    const k = smoothstep(HINGE + 0.9, HINGE + 0.98, t) * (1 - smoothstep(HINGE + 1.12, HINGE + 1.3, t));
    if (!box.current) return;
    box.current.style.opacity = k.toFixed(3);
    box.current.style.visibility = k < 0.02 ? 'hidden' : 'visible';
  };
  useJourney(apply);
  // the label lives in its own DOM root, so it can attach after the first frames
  const attach = (el: HTMLDivElement | null) => {
    box.current = el;
    if (el) apply(journey.t);
  };
  const a = data.anchors.label_SmallIntestine ?? data.anchors.anchor_si_center;
  if (!a) return null;
  const p = a.position.clone().multiplyScalar(MODEL_SCALE);
  return (
    <Label3D visible={visible && stopId === 'body'} position={p} center interactive>
      <div ref={attach} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0 }}>
        <button
          type="button"
          className="marker marker--pulse"
          aria-label="Zoom into the small intestine"
          onClick={() => useStory.getState().goToId('intestine')}
        >
          +
        </button>
        <span className="tag" style={{ pointerEvents: 'none' }}>
          Small intestine
        </span>
      </div>
    </Label3D>
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
        Can infect the heart’s lining and valves. This is called <TermButton termKey="endocarditis">endocarditis</TermButton>.
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
    text: 'Joint pain is often the first sign, sometimes years earlier.',
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

  // grows in only while the scroll is near "beyond the gut" (deterministic, so fast scrolling can't strand it)
  useEffect(() => {
    const apply = (t: number) => {
      const g = group.current;
      if (!g) return;
      const k = smoothstep(0.45, 0.12, Math.abs(t - STOP_INDEX.spread));
      const e = 1 - Math.pow(1 - k, 3);
      g.scale.setScalar(Math.max(0.0001, scale * e));
      g.visible = k > 0.001;
      invalidate();
    };
    apply(journey.t);
    return onJourneyFrame(apply);
  }, [scale, invalidate]);

  return (
    <group position={[s.pos[0], s.pos[1], s.pos[2]]}>
      <group ref={group} scale={0.0001} rotation-y={s.rot} visible={false}>
        <primitive object={object} />
      </group>
      <Label3D visible={visible} position={[0.3, 0, 0]} interactive>
        <div className="leader">
          <span className="leader__line" />
          <span className="tag" style={{ whiteSpace: 'normal', width: 'min(230px, 46vw)' }}>
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
  const stop = useStory((s) => s.stop);
  const id = STOPS[stop].id;
  const [mounted, setMounted] = useState(false);
  // prefetch a few stops before "beyond the gut"
  useEffect(() => {
    if (stop >= STOP_INDEX.spread - 4) setMounted(true);
  }, [stop]);
  if (!mounted) return null;
  return (
    <Suspense fallback={null}>
      {SAT.map((s) => (
        <Satellite key={s.key} s={s} visible={id === 'spread'} />
      ))}
    </Suspense>
  );
}

/* ------------------------------------------------------------ world */

export function AnatomyWorld({ visible }: { visible: boolean }) {
  const id = useStopId();
  const shadowOpacity = id === 'body' || id === 'name' ? 0.45 : 0.55;
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
      <IntestineMarker visible={visible} />
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
