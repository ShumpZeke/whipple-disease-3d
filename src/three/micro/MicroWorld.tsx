import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { useStory } from '../../app/store';
import { Cites, TermButton } from '../../ui/RichText';
import { Label3D } from '../Label3D';
import { ensureNoiseTexture, NOISE_GLSL, noiseUniform } from '../shaders/noise';
import { mulberry32 } from '../tissue/tissueGeometry';

/**
 * Microscopic illustration (not to scale): macrophages in the lamina propria of a villus,
 * packed with rod-shaped Tropheryma whipplei, plus a few free bacteria.
 */
const uTime = { value: 0 };

function membraneMaterial(inner: string, rim: string, alphaMin: number, alphaMax: number, wobble: number) {
  ensureNoiseTexture();
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
    uniforms: {
      uNoise3D: noiseUniform,
      uTime,
      uInner: { value: new THREE.Color(inner) },
      uRim: { value: new THREE.Color(rim) },
      uA: { value: new THREE.Vector2(alphaMin, alphaMax) },
      uWobble: { value: wobble },
    },
    vertexShader: /* glsl */ `
      uniform float uTime; uniform float uWobble;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      ${NOISE_GLSL}
      void main() {
        vec3 p = position;
        float n = snoise(p * 1.4 + vec3(uTime * 0.04));
        float n2 = snoise(p * 3.1 - vec3(uTime * 0.03));
        p += normal * (n * 0.16 + n2 * 0.05) * uWobble;
        #ifdef USE_INSTANCING
          vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
          vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
        #else
          vec4 mv = modelViewMatrix * vec4(p, 1.0);
          vN = normalize(normalMatrix * normal);
        #endif
        vV = -mv.xyz; vP = p;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uInner; uniform vec3 uRim; uniform vec2 uA;
      varying vec3 vN; varying vec3 vV; varying vec3 vP;
      ${NOISE_GLSL}
      void main() {
        float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 1.8);
        float grain = snoise(vP * 9.0) * 0.5 + 0.5;
        vec3 col = mix(uInner, uRim, f) * (0.92 + 0.12 * grain);
        gl_FragColor = vec4(col, mix(uA.x, uA.y, f));
      }`,
  });
}

function bacteriaMaterial() {
  const m = new THREE.MeshPhysicalMaterial({
    color: '#c9467f',
    roughness: 0.35,
    clearcoat: 0.6,
    clearcoatRoughness: 0.3,
    sheen: 0.6,
    sheenColor: new THREE.Color('#ffc0dc'),
    emissive: new THREE.Color('#3a0a1f'),
  });
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;\nattribute vec4 aDrift;')
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        // slow drift for free bacteria (aDrift.w = 1), still inside cells (w = 0)
        float t = uTime * 0.12 + aDrift.x * 6.2831;
        transformed += vec3(sin(t) * 0.25, cos(t * 0.8) * 0.18, sin(t * 0.6) * 0.2) * aDrift.w;`,
      );
  };
  return m;
}

export function MicroWorld({ visible }: { visible: boolean }) {
  const reduced = useStory((s) => s.reducedMotion);
  const built = useMemo(() => {
    const rnd = mulberry32(99);
    const cells = [
      { c: new THREE.Vector3(-1.55, 0.35, -0.6), r: 1.35 },
      { c: new THREE.Vector3(1.35, -0.25, -0.9), r: 1.2 },
      { c: new THREE.Vector3(0.1, 1.55, -2.6), r: 1.25 },
    ];
    const rod = new THREE.CapsuleGeometry(0.05, 0.3, 4, 8);
    const inside = 780;
    const free = 60;
    const bact = new THREE.InstancedMesh(rod, bacteriaMaterial(), inside + free + 1);
    const drift = new Float32Array((inside + free + 1) * 4);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    let k = 0;
    // bacteria packed in clusters (vacuoles) inside each macrophage
    for (let i = 0; i < inside; i++) {
      const cell = cells[i % cells.length];
      const cluster = Math.floor(rnd() * 7);
      const cr = mulberry32(cluster * 131 + (i % cells.length) * 17);
      const cc = new THREE.Vector3(cr() - 0.5, cr() - 0.5, cr() - 0.5).normalize().multiplyScalar(cell.r * (0.25 + cr() * 0.4));
      const p = cell.c
        .clone()
        .add(cc)
        .add(new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.42));
      e.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
      q.setFromEuler(e);
      const s = 0.8 + rnd() * 0.4;
      m.compose(p, q, new THREE.Vector3(s, s, s));
      bact.setMatrixAt(k, m);
      drift.set([rnd(), 0, 0, 0], k * 4);
      k++;
    }
    for (let i = 0; i < free; i++) {
      // a few free rods, kept behind the cells and away from the caption corner
      const p = new THREE.Vector3((rnd() - 0.5) * 9, (rnd() - 0.5) * 5.5, -1.2 - rnd() * 3.5);
      if (cells.some((c) => c.c.distanceTo(p) < c.r * 1.08)) continue;
      if (p.x < -1.5 && p.y < -0.8) continue;
      e.set(rnd() * Math.PI, rnd() * Math.PI, rnd() * Math.PI);
      q.setFromEuler(e);
      m.compose(p, q, new THREE.Vector3(1, 1, 1));
      bact.setMatrixAt(k, m);
      drift.set([rnd(), 0, 0, 1], k * 4);
      k++;
    }
    // hero rod near the camera
    const hero = new THREE.Vector3(0.55, -0.55, 2.3);
    q.setFromEuler(new THREE.Euler(0.4, 0.2, 1.1));
    m.compose(hero, q, new THREE.Vector3(2.6, 2.6, 2.6));
    bact.setMatrixAt(k, m);
    k++;
    bact.count = k;
    rod.setAttribute('aDrift', new THREE.InstancedBufferAttribute(drift, 4));
    bact.instanceMatrix.needsUpdate = true;
    bact.computeBoundingSphere();

    // macrophage membranes, nuclei and foamy vacuoles
    const cellGeo = new THREE.IcosahedronGeometry(1, 24);
    const membrane = membraneMaterial('#6b4d7a', '#f1d3e6', 0.1, 0.62, 1);
    const nucleusMat = membraneMaterial('#3c2350', '#9a74b8', 0.55, 0.9, 0.6);
    const vacGeo = new THREE.IcosahedronGeometry(1, 3);
    const vacMat = membraneMaterial('#d8c2d6', '#fff2fa', 0.05, 0.35, 0.3);
    const perCell = 40;
    const vac = new THREE.InstancedMesh(vacGeo, vacMat, perCell * cells.length);
    let vi = 0;
    for (const c of cells) {
      for (let i = 0; i < perCell; i++) {
        const d = new THREE.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).normalize().multiplyScalar(c.r * rnd() * 0.75);
        m.compose(c.c.clone().add(d), new THREE.Quaternion(), new THREE.Vector3().setScalar(0.12 + rnd() * 0.16));
        vac.setMatrixAt(vi++, m);
      }
    }
    vac.instanceMatrix.needsUpdate = true;
    return { bact, cells, cellGeo, membrane, nucleusMat, vac, hero };
  }, []);

  useFrame((_, dt) => {
    if (visible && !reduced) uTime.value += dt;
  });

  return (
    <group>
      <primitive object={built.bact} />
      {built.cells.map((c, i) => (
        <group key={i} position={c.c}>
          <mesh geometry={built.cellGeo} material={built.membrane} scale={c.r} renderOrder={2} />
          <mesh geometry={built.cellGeo} material={built.nucleusMat} scale={c.r * 0.34} position={[c.r * 0.28, -c.r * 0.2, c.r * 0.1]} renderOrder={1} />
        </group>
      ))}
      <primitive object={built.vac} renderOrder={1} />
      <Label3D visible={visible} position={[built.hero.x + 0.55, built.hero.y + 0.1, built.hero.z]} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 600ms both' }}>
          <span className="leader__line" style={{ width: 50 }} />
          <span className="tag">
            <i>
              <TermButton termKey="tropheryma">Tropheryma whipplei</TermButton>
            </i>
            <small>rod-shaped bacterium</small> <Cites ids={[6]} />
          </span>
        </div>
      </Label3D>
      <Label3D
        visible={visible}
        position={[built.cells[0].c.x - 0.9, built.cells[0].c.y + 1.15, built.cells[0].c.z]}
        interactive
      >
        <div className="leader leader--left" style={{ animation: 'rise 700ms 850ms both' }}>
          <span className="leader__line" style={{ width: 40 }} />
          <span className="tag">
            <TermButton termKey="macrophage">Macrophage</TermButton>
            <small>filled with bacteria</small> <Cites ids={[2]} />
          </span>
        </div>
      </Label3D>
    </group>
  );
}
