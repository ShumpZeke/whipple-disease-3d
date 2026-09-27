import { Bvh } from '@react-three/drei';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useStory } from '../../app/store';
import { QUESTIONS } from '../../content/quiz';
import { STEPS } from '../../content/story';
import { ORGANS, type OrganId } from './organs';
import { MODEL_SCALE, useAnatomy } from './useAnatomy';

/** Which organs are emphasised / pickable for the current step. */
function emphasis(stepId: string, hovered: OrganId | null, quizOrgan: boolean): {
  dim: (o: OrganId) => number;
  highlight: (o: OrganId) => number;
  pickable: boolean;
} {
  const focusSI = ['focus', 'facts', 'systems'].includes(stepId);
  return {
    dim: (o) => (focusSI && o !== 'SmallIntestine' ? 1 : 0),
    highlight: (o) => {
      if (hovered === o && (stepId === 'overview' || stepId === 'end' || quizOrgan)) return 1;
      if (focusSI && o === 'SmallIntestine') return 0.55;
      return 0;
    },
    pickable: stepId === 'overview' || stepId === 'end' || quizOrgan,
  };
}

export function DigestiveModel() {
  const data = useAnatomy();
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const step = useStory((s) => s.step);
  const hovered = useStory((s) => s.hoveredOrgan);
  const quizIndex = useStory((s) => s.quizIndex);
  const stepId = STEPS[step].id;
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
  }, [step, hovered, quizIndex, invalidate]);

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
    if (stepId === 'overview' && organ === 'SmallIntestine') st.next();
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

export function useAnchorWorld(name: string): THREE.Vector3 | null {
  const data = useAnatomy();
  const a = data.anchors[name];
  return a ? a.position.clone().multiplyScalar(MODEL_SCALE) : null;
}
