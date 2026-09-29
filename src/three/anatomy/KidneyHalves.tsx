import { createPortal, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, type ReactNode } from 'react';
import * as THREE from 'three';
import { journey, smoothstep } from '../../app/journey';
import { STOP_INDEX } from '../../content/story';
import { Cites, TermButton } from '../../ui/RichText';
import { view } from '../Director';
import { DOTS_GLSL, HASH_GLSL } from '../hash';
import { paintSection } from '../kidney/section';
import { Label3D } from '../Label3D';
import { useLevels } from '../levels';
import { NEPHRON_SCALE } from '../nested';
import { ensureNoiseTexture, NOISE_GLSL, noiseUniform } from '../shaders/noise';
import { slicePlanes, type OrganMaterial } from './organMaterial';
import { useAnatomy } from './useAnatomy';

/** How far open the kidney is: it opens as we arrive "Inside a kidney" and closes on the way out. */
export function kidneyOpen(t: number) {
  return t < STOP_INDEX.cause ? smoothstep(STOP_INDEX.kidneys + 0.25, STOP_INDEX.inside - 0.12, t) : 1 - smoothstep(STOP_INDEX.genes + 0.72, STOP_INDEX.genes + 0.93, t);
}

/** The painted cut face, with close-up detail and an opening for the dive into the outer layer. */
function capMaterial(map: THREE.Texture, mask: THREE.Texture, side: THREE.Side) {
  ensureNoiseTexture();
  const uniforms = {
    uMask: { value: mask },
    uDetail: { value: 0 },
    uHole: { value: new THREE.Vector3(0, 0, 0) },
  };
  const m = new THREE.MeshPhysicalMaterial({
    map,
    roughness: 0.5,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
    sheen: 0.25,
    sheenColor: new THREE.Color('#ffd6c8'),
    side,
    clippingPlanes: [slicePlanes.sagittal, slicePlanes.axial],
  });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, { uNoise3D: noiseUniform });
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec2 vCut;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvCut = position.xy;');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec2 vCut;
        uniform sampler2D uMask;
        uniform float uDetail;
        uniform vec3 uHole;
        ${NOISE_GLSL}
        ${HASH_GLSL}
        ${DOTS_GLSL}`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        `#include <clipping_planes_fragment>
        // the opening we dive through: a soft, uneven hole around the filter
        if (uHole.z > 0.0) {
          vec2 rel = (vCut - uHole.xy) / uHole.z;
          float wob = snoise(vec3(rel * 1.6, 0.0)) * 0.22;
          if (length(rel) < 1.0 + wob) discard;
        }`,
      )
      .replace(
        '#include <map_fragment>',
        `#include <map_fragment>
        if (uDetail > 0.001) {
          float cortex = texture2D(uMask, vMapUv).r;
          // close up, the outer layer is a tissue of little tubes with round filters in it
          float n = snoise(vec3(vCut * 520.0, 1.7)) * 0.5 + 0.5;
          float n2 = snoise(vec3(vCut * 1400.0, 3.1)) * 0.5 + 0.5;
          vec3 tissue = mix(vec3(0.62, 0.25, 0.2), vec3(0.83, 0.47, 0.38), smoothstep(0.35, 0.75, n)) * (0.9 + 0.2 * n2);
          float f = dotField(vCut);
          vec3 dotCol = mix(vec3(0.44, 0.07, 0.09), vec3(0.62, 0.16, 0.15), smoothstep(0.0, 0.9, f));
          tissue = mix(dotCol, tissue, smoothstep(0.85, 1.05, f));
          diffuseColor.rgb = mix(diffuseColor.rgb, tissue, uDetail * cortex);
        }`,
      );
  };
  return { material: m, uniforms };
}

const LABELS: { at: (s: { cortex: THREE.Vector2; pyramid: THREE.Vector2; pelvis: THREE.Vector2; ureter: THREE.Vector3 }) => THREE.Vector3; left?: boolean; body: ReactNode }[] = [
  {
    at: (s) => new THREE.Vector3(s.cortex.x, s.cortex.y, 0.01),
    body: (
      <>
        Cortex <small>outer layer</small> <Cites ids={[14]} />
      </>
    ),
  },
  {
    at: (s) => new THREE.Vector3(s.pyramid.x, s.pyramid.y, 0.01),
    body: (
      <>
        Medulla <small>inner part</small> <Cites ids={[14]} />
      </>
    ),
  },
  {
    at: (s) => new THREE.Vector3(s.pelvis.x, s.pelvis.y, 0.01),
    left: true,
    body: (
      <>
        Renal pelvis <small>urine collects</small> <Cites ids={[14]} />
      </>
    ),
  },
  {
    at: (s) => s.ureter,
    left: true,
    body: (
      <>
        <TermButton termKey="ureter">Ureter</TermButton> <small>to the bladder</small> <Cites ids={[12]} />
      </>
    ),
  },
];

/**
 * The left kidney as two halves that open like a book. The back half is the kidney itself,
 * trimmed at its middle by a clipping plane and closed with the painted cut face; the front half
 * is a copy trimmed the other way, hinged on the kidney's outer edge. Both live inside the kidney's
 * own frame, so they follow it wherever it goes (even out of the body at "Treatment").
 */
export function KidneyHalves({ visible }: { visible: boolean }) {
  const data = useAnatomy();
  const levels = useLevels();
  const invalidate = useThree((s) => s.invalidate);
  const kidney = data.meshes.LeftKidney!;
  const sec = levels.section;

  const built = useMemo(() => {
    const { map, mask } = paintSection(sec, 1024);
    const back = capMaterial(map, mask, THREE.FrontSide);
    const frontCap = capMaterial(map, mask, THREE.BackSide);
    const capGeo = sec.capGeometry();
    const backCap = new THREE.Mesh(capGeo, back.material);
    const frontCapMesh = new THREE.Mesh(capGeo, frontCap.material);
    // the front half: the same mesh, trimmed to z > 0, turning about the kidney's outer edge
    const hingeX = sec.contour.reduce((mx, p) => Math.max(mx, p.x), -Infinity);
    const pivot = new THREE.Group();
    pivot.position.set(hingeX, 0, 0);
    const frontMat = (kidney.material as OrganMaterial).clone() as OrganMaterial;
    frontMat.userData.uniforms = (kidney.material as OrganMaterial).userData.uniforms;
    frontMat.onBeforeCompile = (kidney.material as OrganMaterial).onBeforeCompile;
    frontMat.customProgramCacheKey = (kidney.material as OrganMaterial).customProgramCacheKey;
    const front = new THREE.Mesh(kidney.geometry, frontMat);
    front.position.set(-hingeX, 0, 0);
    front.userData.organ = 'LeftKidney';
    front.renderOrder = kidney.renderOrder;
    front.add(frontCapMesh);
    pivot.add(front);
    // the left ureter's upper end (the collecting system inside the kidney) opens with the kidney
    const leftUreter = data.leftUreter;
    let ureterCut: THREE.Vector4 | null = null;
    if (leftUreter) {
      const base = leftUreter.material as OrganMaterial;
      const um = base.clone() as OrganMaterial;
      um.userData.uniforms = { ...base.userData.uniforms, uCut: { value: new THREE.Vector4() } };
      um.onBeforeCompile = (shader, r) => {
        base.onBeforeCompile.call(um, shader, r);
        shader.uniforms.uCut = um.userData.uniforms.uCut;
      };
      um.customProgramCacheKey = base.customProgramCacheKey;
      // (cloning copies the planes; the scans move the shared ones)
      um.clippingPlanes = [slicePlanes.sagittal, slicePlanes.axial];
      leftUreter.material = um;
      ureterCut = um.userData.uniforms.uCut.value;
    }
    const cutBack = new THREE.Plane();
    const cutFront = new THREE.Plane();
    const backMat = kidney.material as OrganMaterial;
    backMat.clippingPlanes = [slicePlanes.sagittal, slicePlanes.axial, cutBack];
    frontMat.clippingPlanes = [slicePlanes.sagittal, slicePlanes.axial, cutFront];
    // label points on the cut face (kidney units)
    const py = sec.pyramids[Math.floor(sec.pyramids.length / 2)];
    const pyramid = new THREE.Vector2(Math.cos(py.phi), Math.sin(py.phi)).multiplyScalar((py.tip + py.reach) / 2).add(sec.sinus);
    const cortex = sec.cortexPoint(THREE.MathUtils.degToRad(35));
    const pelvis = sec.sinus.clone();
    const ureter = new THREE.Vector3(sec.hilum.x - 0.22, sec.hilum.y - 0.5, 0.12);
    const at = { cortex, pyramid, pelvis, ureter };
    return { backCap, frontCapMesh, pivot, cutBack, cutFront, back, frontCap, at, ureterCut };
  }, [kidney, sec]);

  useEffect(() => {
    kidney.add(built.backCap, built.pivot);
    return () => {
      kidney.remove(built.backCap, built.pivot);
    };
  }, [kidney, built]);

  const n = useMemo(() => new THREE.Vector3(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const t = journey.t;
    const open = kidneyOpen(t);
    const e = open * open * (3 - 2 * open);
    built.pivot.rotation.y = e * THREE.MathUtils.degToRad(155);
    // closed, the two trimmed halves make a whole kidney; the painted faces are only for when it is open
    built.backCap.visible = built.frontCapMesh.visible = open > 0.001;
    // keep the trimming planes on the kidney's middle, wherever the kidney is
    kidney.updateWorldMatrix(true, false);
    n.set(0, 0, 1).transformDirection(kidney.matrixWorld);
    p.setFromMatrixPosition(kidney.matrixWorld);
    built.cutBack.setFromNormalAndCoplanarPoint(n.clone().negate(), p);
    built.pivot.children[0].updateWorldMatrix(true, false);
    const fm = built.pivot.children[0].matrixWorld;
    n.set(0, 0, 1).transformDirection(fm);
    p.setFromMatrixPosition(fm);
    built.cutFront.setFromNormalAndCoplanarPoint(n, p);
    if (built.ureterCut) {
      // (the kidney is at rest while it is open)
      const k = levels.kidney;
      const mid = new THREE.Vector3(0, 0, 0).applyMatrix4(k);
      const low = new THREE.Vector3(0, -1.05, 0).applyMatrix4(k);
      const hilum = new THREE.Vector3(sec.hilum.x - 0.35, 0, 0).applyMatrix4(k);
      built.ureterCut.set(open > 0.001 ? 1 : 0, mid.z, low.y, hilum.x);
    }
    // the dive into the outer layer: detail sharpens, then the surface opens around the filter
    const u = view.d / levels.size.nephron;
    // (deep in, the opened front half is far out of sight)
    built.pivot.visible = !(t > STOP_INDEX.inside && t < STOP_INDEX.lump && u < 40);
    const detail = t > STOP_INDEX.inside - 0.5 && t < STOP_INDEX.lump ? smoothstep(320, 70, u) : 0;
    const hole = t > STOP_INDEX.inside && t < STOP_INDEX.lump ? smoothstep(60, 16, u) : 0;
    for (const m of [built.back, built.frontCap]) m.uniforms.uDetail.value = detail;
    built.back.uniforms.uHole.value.set(levels.dot.x, levels.dot.y, hole * 9 * NEPHRON_SCALE);
    if (open > 0 && open < 1) invalidate();
  });

  return createPortal(
    <>
      {LABELS.map((l, i) => (
        <Label3D key={i} visible={visible} at="inside" position={l.at(built.at)} interactive>
          <div className={`leader${l.left ? ' leader--left' : ''}`} style={{ animation: `rise 700ms ${400 + i * 150}ms both` }}>
            <span className="leader__line" style={{ width: 34 }} />
            <span className="tag">{l.body}</span>
          </div>
        </Label3D>
      ))}
    </>,
    kidney,
  );
}
