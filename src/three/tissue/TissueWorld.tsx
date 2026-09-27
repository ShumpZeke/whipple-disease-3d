import { useMemo } from 'react';
import * as THREE from 'three';
import { Cites } from '../../ui/RichText';
import { createOrganMaterial } from '../anatomy/organMaterial';
import { Label3D } from '../Label3D';
import { ensureNoiseTexture, NOISE_GLSL, noiseUniform } from '../shaders/noise';
import {
  cutFaces,
  innerRadius,
  innerSurface,
  makeFolds,
  outerSurface,
  SEG,
  tubePoint,
  villiInstances,
  villusGeometry,
} from './tissueGeometry';

function layerMaterial() {
  ensureNoiseTexture();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, side: THREE.DoubleSide });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNoise3D = noiseUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float layer;\nvarying float vLayer;\nvarying vec3 vP;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvLayer = layer;\nvP = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying float vLayer;\nvarying vec3 vP;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float L = floor(vLayer + 0.5);
        float r = length(vP.yz);
        float n = snoise(vP * 40.0);
        if (L == 1.0) {
          // longitudinal fibres run along the axis
          float f = sin(r * 900.0 + n * 2.0) * 0.5 + 0.5;
          diffuseColor.rgb *= 0.88 + 0.16 * f;
        } else if (L == 2.0) {
          // circular fibres: fine bands around the tube
          float f = sin(vP.x * 260.0 + n * 3.0) * 0.5 + 0.5;
          diffuseColor.rgb *= 0.86 + 0.18 * f;
        } else if (L == 3.0) {
          // loose connective tissue with small vessels
          float v = smoothstep(0.72, 0.8, snoise(vP * 22.0));
          diffuseColor.rgb = mix(diffuseColor.rgb * (0.95 + 0.08 * n), vec3(0.62, 0.16, 0.18), v * 0.75);
        } else if (L == 4.0) {
          // mucosa: glands / crypts as fine radial streaks
          float s = sin(atan(vP.y, vP.z) * 420.0 + n * 3.0) * 0.5 + 0.5;
          diffuseColor.rgb *= 0.85 + 0.2 * s;
        }`,
      );
  };
  return m;
}

function villusMaterial() {
  const m = new THREE.MeshPhysicalMaterial({
    color: '#d27f73',
    roughness: 0.5,
    sheen: 0.9,
    sheenColor: new THREE.Color('#ffc1b2'),
    sheenRoughness: 0.45,
    clearcoat: 0.35,
    clearcoatRoughness: 0.4,
  });
  return m;
}

const LABELS: { key: string; x: number; t: number; r: number; text: string }[] = [
  { key: 'serosa', x: 2.45, t: SEG.wedgeCenter + SEG.wedgeHalf, r: 0.988, text: 'Serosa' },
  { key: 'long', x: 1.62, t: SEG.wedgeCenter + SEG.wedgeHalf, r: 0.945, text: 'Muscularis' },
  { key: 'sub', x: 0.78, t: SEG.wedgeCenter + SEG.wedgeHalf, r: 0.73, text: 'Submucosa' },
  { key: 'muc', x: -0.06, t: SEG.wedgeCenter + SEG.wedgeHalf, r: -1, text: 'Mucosa (lining)' },
];

export function TissueWorld({ visible }: { visible: boolean }) {
  const built = useMemo(() => {
    const folds = makeFolds();
    const outer = outerSurface();
    const inner = innerSurface(folds);
    const cuts = cutFaces(folds);
    const villi = villiInstances(folds, 3800);
    const vGeo = villusGeometry(8, 4);
    const serosaMat = createOrganMaterial(
      {
        id: 'SmallIntestine',
        name: 'serosa',
        color: '#dea393',
        vein: '#8f2f38',
        veinStrength: 0.6,
        roughness: 0.38,
        clearcoat: 0.75,
        sheen: 0.5,
        sheenColor: '#ffc9ba',
        bumpScale: 9,
        bumpStrength: 0.012,
        mottle: 0.08,
      },
      1,
      false,
    );
    serosaMat.side = THREE.DoubleSide;
    const mucosaMat = createOrganMaterial(
      {
        id: 'SmallIntestine',
        name: 'mucosa',
        color: '#c9685f',
        vein: '#8a2b31',
        veinStrength: 0.1,
        roughness: 0.6,
        clearcoat: 0.25,
        sheen: 0.9,
        sheenColor: '#ffb3a3',
        bumpScale: 60,
        bumpStrength: 0.004,
        mottle: 0.06,
      },
      1,
      false,
    );
    mucosaMat.side = THREE.DoubleSide;
    const inst = new THREE.InstancedMesh(vGeo, villusMaterial(), villi.length);
    villi.forEach((m, i) => inst.setMatrixAt(i, m));
    inst.instanceMatrix.needsUpdate = true;
    inst.computeBoundingSphere();
    // label anchor points
    const anchors = LABELS.map((l) => {
      const r = l.r < 0 ? innerRadius(l.x, l.t, folds) + SEG.mucosa * 0.5 : l.r;
      return tubePoint(l.x, l.t, r).toArray() as [number, number, number];
    });
    // a fold crest on the far wall and a patch of villi for labels
    const farT = SEG.wedgeCenter + Math.PI;
    const crest = folds.reduce((best, f) => (Math.abs(f.x + 0.8) < Math.abs(best.x + 0.8) ? f : best), folds[0]);
    const foldPt = tubePoint(crest.x, farT - 0.35, innerRadius(crest.x, farT - 0.35, folds)).toArray() as [number, number, number];
    const villiPt = tubePoint(-1.75, farT + 0.25, innerRadius(-1.75, farT + 0.25, folds) - 0.06).toArray() as [number, number, number];
    return { outer, inner, cuts, inst, serosaMat, mucosaMat, layerMat: layerMaterial(), anchors, foldPt, villiPt };
  }, []);

  return (
    <group rotation={[0, -0.12, 0]}>
      <mesh geometry={built.outer} material={built.serosaMat} />
      <mesh geometry={built.inner} material={built.mucosaMat} />
      <mesh geometry={built.cuts} material={built.layerMat} />
      <primitive object={built.inst} />
      {LABELS.map((l, i) => (
        <Label3D key={l.key} visible={visible} position={built.anchors[i]}>
          <div className="leader" style={{ animation: `rise 700ms ${400 + i * 160}ms both` }}>
            <span className="leader__line" style={{ width: 28 }} />
            <span className="tag">{l.text}</span>
          </div>
        </Label3D>
      ))}
      <Label3D visible={visible} position={built.foldPt}>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 1150ms both' }}>
          <span className="leader__line" style={{ width: 34 }} />
          <span className="tag">Circular fold</span>
        </div>
      </Label3D>
      <Label3D visible={visible} position={built.villiPt} interactive>
        <div className="leader leader--left" style={{ animation: 'rise 700ms 1300ms both' }}>
          <span className="leader__line" style={{ width: 34 }} />
          <span className="tag">
            Villi, the velvety surface <Cites ids={[11]} />
          </span>
        </div>
      </Label3D>
    </group>
  );
}
