import { Bvh } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { journey } from '../../app/journey';
import { useStopId, useStory } from '../../app/store';
import { QUESTIONS } from '../../content/quiz';
import { STOP_INDEX, type StopId } from '../../content/story';
import { view } from '../Director';
import { useLevels } from '../levels';
import { isKidney, ORGANS, type OrganId } from './organs';
import { MODEL_SCALE, useAnatomy } from './useAnatomy';

/** How much each organ is highlighted (warm rim) or dimmed (greyed) at each stop. */
function emphasis(id: StopId, hovered: OrganId | null, quizOrgan: boolean) {
  const pickable = id === 'body' || id === 'end' || quizOrgan;
  return {
    pickable,
    dim: (o: OrganId): number => {
      if (id === 'inside') return o === 'LeftKidney' ? 0 : 0.55;
      if (id === 'kidneys') return isKidney(o) || o === 'Ureters' || o === 'Adrenals' ? 0 : 0.35;
      if (id === 'lump') return o === 'LeftKidney' ? 0 : 0.45;
      if (id === 'treatment') return o === 'LeftKidney' ? 0 : 0.3;
      if (id === 'outlook') return o === 'RightKidney' ? 0 : 0.25;
      return 0;
    },
    highlight: (o: OrganId): number => {
      if (pickable && hovered === o) return 1;
      if (id === 'kidneys' && isKidney(o)) return 0.4;
      if (id === 'treatment' && o === 'LeftKidney') return 0.8;
      if (id === 'outlook' && o === 'RightKidney') return 0.55;
      return 0;
    },
  };
}

/** The kidneys, ureters, bladder, adrenal glands and the big blood vessels, pickable by organ. */
export function UrinaryModel() {
  const data = useAnatomy();
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const stepId = useStopId();
  const hovered = useStory((s) => s.hoveredOrgan);
  const quizIndex = useStory((s) => s.quizIndex);
  const quizOrgan = stepId === 'quiz' && QUESTIONS[quizIndex]?.kind === 'organ';
  const target = useRef<Record<string, { dim: number; hl: number }>>({});

  const em = emphasis(stepId, hovered, quizOrgan);
  for (const id of Object.keys(data.meshes) as OrganId[]) {
    target.current[id] = { dim: em.dim(id), hl: em.highlight(id) };
  }

  // ease uniforms toward targets; stop invalidating once settled (demand frameloop friendly)
  useFrame((_, dt) => {
    let moving = false;
    const k = 1 - Math.exp(-dt * 7);
    for (const id of Object.keys(data.materials) as OrganId[]) {
      const u = data.materials[id]!.userData.uniforms;
      const t = target.current[id];
      if (!t) continue;
      const nd = u.uDim.value + (t.dim - u.uDim.value) * k;
      const nh = u.uHighlight.value + (t.hl - u.uHighlight.value) * k;
      if (Math.abs(nd - t.dim) > 0.002 || Math.abs(nh - t.hl) > 0.002) moving = true;
      u.uDim.value = Math.abs(nd - t.dim) > 0.002 ? nd : t.dim;
      u.uHighlight.value = Math.abs(nh - t.hl) > 0.002 ? nh : t.hl;
    }
    if (moving) invalidate();
  });

  useEffect(() => {
    invalidate();
  }, [stepId, hovered, quizIndex, invalidate]);

  // deep inside the left kidney (a filter, cells, DNA) the other organs are far out of sight
  const levels = useLevels();
  const others = useMemo(
    () => [...Object.entries(data.meshes).filter(([id]) => id !== 'LeftKidney').map(([, m]) => m!), ...(data.leftUreter ? [data.leftUreter] : [])],
    [data],
  );
  useFrame(() => {
    const t = journey.t;
    const deep = t > STOP_INDEX.inside && t < STOP_INDEX.lump && view.d / levels.size.nephron < 40;
    for (const m of others) if (m.visible === deep) m.visible = !deep;
  });

  // cursor feedback
  useEffect(() => {
    gl.domElement.style.cursor = hovered && em.pickable ? 'pointer' : '';
  }, [hovered, em.pickable, gl]);

  const onMove = (e: ThreeEvent<PointerEvent>) => {
    if (!em.pickable) return;
    e.stopPropagation();
    const organ = e.object.userData.organ as OrganId | undefined;
    if (organ && organ !== useStory.getState().hoveredOrgan) useStory.getState().setHovered(organ);
  };
  const onOut = (e: ThreeEvent<PointerEvent>) => {
    const organ = e.object.userData.organ as OrganId | undefined;
    if (organ && useStory.getState().hoveredOrgan === organ) useStory.getState().setHovered(null);
  };
  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (!em.pickable || e.delta > 6) return; // ignore the end of an orbit drag
    e.stopPropagation();
    const organ = e.object.userData.organ as OrganId | undefined;
    if (!organ) return;
    const st = useStory.getState();
    st.markInteracted();
    if (stepId === 'body' && isKidney(organ)) st.goToId('kidneys');
    else if (quizOrgan) st.answerOrgan(organ, ORGANS[organ].name);
    else st.setHovered(organ);
  };

  return (
    <Bvh firstHitOnly>
      <group scale={MODEL_SCALE}>
        <primitive
          object={data.root}
          onPointerMove={onMove}
          onPointerOut={onOut}
          onClick={onClick}
          dispose={null}
        />
      </group>
    </Bvh>
  );
}

/** World position of an anchor empty (or null if the model doesn't have it). */
export function useAnchorWorld(name: string): THREE.Vector3 | null {
  const data = useAnatomy();
  const a = data.anchors[name];
  return a ? a.position.clone().multiplyScalar(MODEL_SCALE) : null;
}
