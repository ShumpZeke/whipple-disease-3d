import { ContactShadows } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { HINGE, journey, onJourneyFrame, smoothstep } from '../../app/journey';
import { useStopId, useStory } from '../../app/store';
import { STOP_INDEX, type StopId } from '../../content/story';
import { useJourney } from '../../ui/useJourney';
import { hingeState, kidneyBack, RETURN } from '../hinge';
import { Label3D } from '../Label3D';
import { PAGE } from '../nested';
import { NephronLevel } from '../nephron/NephronLevel';
import { TUMOR_R } from '../presets';
import { mulberry32 } from '../random';
import { KidneyHalves } from './KidneyHalves';
import { createOrganMaterial, sharedOrganUniforms } from './organMaterial';
import { UrinaryModel } from './UrinaryModel';
import { MODEL_SCALE, useAnatomy } from './useAnatomy';

/* ------------------------------------------------------------ the drawing becomes 3D */

/**
 * Drives the organ shaders through the hinge from the book page to the 3D organs (see hinge.ts):
 * engraved and pressed flat onto the page at first, then developed into colour and depth.
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
    // the drawing lies a hair in front of the paper
    sharedOrganUniforms.uPageZ.value = PAGE.z + 0.012;
  }, [gl, data]);

  useEffect(() => {
    const u = sharedOrganUniforms;
    const apply = (t: number) => {
      const h = hingeState(t);
      u.uEngrave.value = h.engrave;
      u.uReveal.value = h.reveal;
      u.uFlatten.value = h.flatten;
      invalidate();
    };
    apply(journey.t);
    return onJourneyFrame(apply);
  }, [invalidate]);

  return null;
}

/* ------------------------------------------------------------ the tumor and the operation */

/** Where the removed kidney goes: out of the body towards the viewer and off to the side. */
const LIFT = new THREE.Vector3(0.95, 0.3, 0.8);

/** 0 → 1 while the tumor grows in, on the way to the "lump" stop (it leaves with the kidney). */
const tumorGrowth = (t: number) => smoothstep(STOP_INDEX.lump - 0.22, STOP_INDEX.lump, t) * (t < RETURN ? 1 : 0);
/**
 * 0 → 1 while the left kidney is taken out (treatment → outlook). On the way back out of the book
 * it comes back, healthy, so the drawing on the page is whole again (see hinge.ts).
 */
const removal = (t: number) => smoothstep(STOP_INDEX.treatment + 0.1, STOP_INDEX.outlook - 0.1, t) - kidneyBack(t);

/** A lumpy mass: a sphere pushed out by a few overlapping lobes (seeded, so always the same shape). */
function tumorGeometry() {
  // weld the sphere's corners first, so the lumpy surface is shaded smoothly
  const ico = new THREE.IcosahedronGeometry(1, 20);
  ico.deleteAttribute('normal');
  ico.deleteAttribute('uv');
  const g = mergeVertices(ico, 1e-4);
  const rnd = mulberry32(27);
  const lobes = Array.from({ length: 11 }, () => {
    const c = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize();
    return { c, a: 0.08 + rnd() * 0.12, s: 0.35 + rnd() * 0.3 };
  });
  const pos = g.getAttribute('position');
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).normalize();
    let r = 0.9;
    for (const l of lobes) r += l.a * Math.exp(-v.distanceToSquared(l.c) / (l.s * l.s));
    // a few fine bumps on top
    r += 0.012 * Math.sin(v.x * 17 + v.y * 5) * Math.sin(v.y * 13 - v.z * 7);
    pos.setXYZ(i, v.x * r, v.y * r * 1.08, v.z * r);
  }
  g.computeVertexNormals();
  return g;
}

/**
 * The left kidney's lower half grows a tumor on the way to the "lump" stop. At "treatment" the
 * kidney (with its ureter and the tumor) is lifted out; it comes back, healthy, as the organs go
 * back into the drawing in Max Wilms's book.
 */
function Tumor() {
  const data = useAnatomy();
  const invalidate = useThree((s) => s.invalidate);
  const stopId = useStopId();
  const group = useRef<THREE.Group>(null);
  const mass = useRef<THREE.Mesh>(null);
  const tag = useRef<HTMLDivElement>(null);
  // the kidney turns about its own centre as it is lifted out; the tumor turns with it
  const pivot = useMemo(
    () => ((data.meshes.LeftKidney?.userData.base as THREE.Vector3 | undefined)?.clone() ?? new THREE.Vector3(0.06, 0.075, -0.015)).multiplyScalar(MODEL_SCALE),
    [data],
  );
  const built = useMemo(() => {
    const a = data.anchors.anchor_tumor;
    const n = (a?.normal.clone() ?? new THREE.Vector3(0.3, 0, 1)).normalize();
    const p = (a?.position.clone() ?? new THREE.Vector3(0.073, 0.054, 0.002)).multiplyScalar(MODEL_SCALE);
    // mostly outside the kidney, a little sunk into it
    const center = p.clone().addScaledVector(n, TUMOR_R * 0.45);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), n);
    const mat = createOrganMaterial(
      {
        id: 'LeftKidney',
        name: 'tumor',
        color: '#c7a18f',
        vein: '#8a3a3c',
        veinStrength: 0.5,
        roughness: 0.46,
        clearcoat: 0.55,
        sheen: 0.45,
        sheenColor: '#ffd9c8',
        bumpScale: 5,
        bumpStrength: 0.02,
        mottle: 0.16,
      },
      TUMOR_R,
      false,
    );
    return { geo: tumorGeometry(), mat, center, q, labelAt: center.clone().addScaledVector(n, TUMOR_R * 0.7) };
  }, [data]);

  // tumor scale and the operation both follow the scroll, so they can be played backwards
  useEffect(() => {
    const kidney = data.meshes.LeftKidney;
    const ureter = data.leftUreter;
    const lift = LIFT.clone().divideScalar(MODEL_SCALE);
    const apply = (t: number) => {
      const s = tumorGrowth(t);
      const k = removal(t);
      const e = k * k * (3 - 2 * k);
      if (mass.current) {
        mass.current.visible = s > 0.001 && e < 0.999;
        mass.current.scale.setScalar(Math.max(0.001, s) * TUMOR_R);
      }
      if (tag.current) tag.current.style.opacity = smoothstep(0.85, 1, s).toFixed(3);
      if (group.current) {
        group.current.position.copy(pivot).addScaledVector(LIFT, e);
        group.current.rotation.set(0, 0, -0.5 * e);
      }
      for (const m of [kidney, ureter]) {
        if (!m) continue;
        m.position.copy(m.userData.base as THREE.Vector3).addScaledVector(lift, e);
        m.rotation.set(0, 0, -0.5 * e);
        m.visible = e < 0.999;
      }
      invalidate();
    };
    apply(journey.t);
    return onJourneyFrame(apply);
  }, [data, pivot, invalidate]);

  // warm rim on the tumor while the operation is explained
  useFrame((_, dt) => {
    const u = built.mat.userData.uniforms;
    const want = stopId === 'treatment' ? 0.8 : 0;
    if (Math.abs(u.uHighlight.value - want) < 0.002) {
      u.uHighlight.value = want;
      return;
    }
    u.uHighlight.value += (want - u.uHighlight.value) * (1 - Math.exp(-dt * 7));
    invalidate();
  });

  return (
    <group ref={group} position={pivot}>
      <group position={pivot.clone().negate()}>
        <mesh ref={mass} geometry={built.geo} material={built.mat} position={built.center} quaternion={built.q} visible={false} />
        <Label3D visible at="lump" position={built.labelAt}>
          <div ref={tag} className="leader" style={{ opacity: 0 }}>
            <span className="leader__line" />
            <span className="tag">Wilms tumor</span>
          </div>
        </Label3D>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------ labels and the marker */

/** At the "body" stop, a single marker invites the visitor to zoom in on the kidneys. */
function KidneyMarker({ visible }: { visible: boolean }) {
  const data = useAnatomy();
  const box = useRef<HTMLDivElement | null>(null);
  // only once the engraving has fully "developed" into the 3D model
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
  const a = data.anchors.label_LeftKidney ?? data.anchors.anchor_kidney_center;
  if (!a) return null;
  const p = a.position.clone().multiplyScalar(MODEL_SCALE);
  return (
    <Label3D visible={visible} at="body" position={p} center interactive>
      <div ref={attach} style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0 }}>
        <button
          type="button"
          className="marker marker--pulse"
          aria-label="Zoom in on the kidneys"
          onClick={() => useStory.getState().goToId('kidneys')}
        >
          +
        </button>
        <span className="tag" style={{ pointerEvents: 'none' }}>
          Kidneys
        </span>
      </div>
    </Label3D>
  );
}

/** The names on the organ model: just enough to read it as a diagram of the urinary system. */
const LABELS: { stop: StopId; anchor: string; left?: boolean; body: string }[] = [
  { stop: 'body', anchor: 'label_Ureters', left: true, body: 'Ureter' },
  { stop: 'body', anchor: 'label_Bladder', body: 'Bladder' },
  { stop: 'treatment', anchor: 'label_LeftKidney', body: 'Removed with its tumor' },
];

function OrganLabels({ visible }: { visible: boolean }) {
  const data = useAnatomy();
  return (
    <>
      {LABELS.map((l, i) => {
        const a = data.anchors[l.anchor];
        if (!a) return null;
        return (
          <Label3D key={i} visible={visible} at={l.stop} position={a.position.clone().multiplyScalar(MODEL_SCALE)}>
            <div className={`leader${l.left ? ' leader--left' : ''}`}>
              <span className="leader__line" />
              <span className="tag">{l.body}</span>
            </div>
          </Label3D>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------ world */

export function AnatomyWorld({ visible }: { visible: boolean }) {
  // the soft shadow appears once the drawing has become 3D (drawn once: kept out of re-renders,
  // which would redraw it)
  const shadow = useRef<THREE.Group>(null);
  const shadowPlane = useMemo(
    () => <ContactShadows position={[0, -0.9, 0]} scale={3.2} blur={2.6} far={1.4} resolution={512} opacity={0.5} color="#050404" frames={1} />,
    [],
  );
  useEffect(
    () =>
      onJourneyFrame((t) => {
        if (shadow.current) shadow.current.visible = hingeState(t).shadow > 0.02 && (t < STOP_INDEX.ultrasound - 0.3 || t > STOP_INDEX.scans + 0.45);
      }),
    [],
  );

  return (
    <group>
      <UrinaryModel />
      <KidneyHalves visible={visible} />
      <Tumor />
      <NephronLevel visible={visible} />
      <KidneyMarker visible={visible} />
      <OrganLabels visible={visible} />
      <HingeController />
      <group ref={shadow} visible={false}>
        {shadowPlane}
      </group>
    </group>
  );
}
