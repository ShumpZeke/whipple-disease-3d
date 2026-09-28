import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { frameState, journey, smoothstep } from '../../app/journey';
import { useStopId, useStory } from '../../app/store';
import { STOP_INDEX } from '../../content/story';
import { Cites, TermButton } from '../../ui/RichText';
import { useFrontToBack } from '../drawOrder';
import { Label3D } from '../Label3D';
import { ensureNoiseTexture, NOISE_GLSL, noiseUniform } from '../shaders/noise';
import { mulberry32 } from './tissueGeometry';

/**
 * Close-up of the mucosa: a field of villi on a gently curved base.
 * uDisease 0 → healthy slender villi; 1 → Whipple's disease: shorter, broader villi crowded with
 * pale foamy macrophages, and far fewer nutrient particles absorbed. Not to scale.
 */

const shared = {
  uTime: { value: 0 },
  uDisease: { value: 0 },
};

const SPACING = 0.34;
const HERO = new THREE.Vector3(0.0, 0, 1.25);
const HERO_SCALE = new THREE.Vector3(0.15, 1.05, 0.15);

export function villusProfile(radial: number, rings: number) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= rings; i++) {
    const v = i / rings;
    const r = 1 - 0.14 * v + 0.05 * Math.sin(v * Math.PI);
    pts.push(new THREE.Vector2(r, v * 0.87));
  }
  for (let i = 1; i <= 7; i++) {
    const a = (i / 7) * (Math.PI / 2);
    pts.push(new THREE.Vector2(0.91 * Math.cos(a) + 0.0001, 0.87 + 0.13 * Math.sin(a)));
  }
  // weld the lathe seam so normals are continuous (no dark seam line)
  const lathe = new THREE.LatheGeometry(pts, radial);
  lathe.deleteAttribute('uv');
  lathe.deleteAttribute('normal');
  const g = mergeVertices(lathe, 1e-3);
  g.computeVertexNormals();
  return g;
}

export function villusMaterial(section: boolean, uniforms: typeof shared = shared) {
  const m = new THREE.MeshPhysicalMaterial({
    color: '#e08a7c',
    roughness: 0.5,
    sheen: 1,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color('#ffd0c2'),
    clearcoat: 0.45,
    clearcoatRoughness: 0.3,
    side: section ? THREE.DoubleSide : THREE.FrontSide,
  });
  ensureNoiseTexture();
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms, { uNoise3D: noiseUniform });
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime; uniform float uDisease;
        attribute float aRand;
        varying vec3 vLocal; varying float vD; varying float vRand;
        ${NOISE_GLSL}`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          float aRandV = aRand;
          float swayAmt = 0.25;
        #else
          float aRandV = 0.5;
          float swayAmt = 0.0;
        #endif
        float d = clamp(uDisease * (0.75 + 0.5 * aRandV), 0.0, 1.0);
        vD = d; vRand = aRandV; vLocal = position;
        float hgt = position.y;
        // blunting: shorter and wider
        transformed.y *= mix(1.0, 0.56, d);
        transformed.xz *= mix(1.0, 1.42, d) * (1.0 + 0.04 * sin(hgt * 7.0 + aRandV * 6.0));
        // macrophages bulge the sides (radially only, never at the tip)
        float bump = max(0.0, snoise(position * vec3(2.5, 9.0, 2.5) + aRandV * 13.0));
        float sideMask = smoothstep(0.06, 0.3, hgt) * (1.0 - smoothstep(0.62, 0.86, hgt));
        transformed.xz *= 1.0 + bump * 0.24 * d * sideMask;
        // slow sway
        float sway = sin(uTime * 0.7 + aRandV * 6.2831) * swayAmt * hgt * hgt;
        transformed.x += sway; transformed.z += sway * 0.6;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vLocal; varying float vD; varying float vRand;
        ${NOISE_GLSL}`,
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // absorptive cells (enterocytes): a fine cobblestone, isotropic on the stretched villus
        vec3 cp = vLocal * vec3(8.0, 72.0, 8.0);
        float cells = snoise(cp);
        diffuseColor.rgb *= 0.95 + 0.06 * cells;
        // capillary network faintly visible through the thin lining
        float cap = 1.0 - abs(snoise(vLocal * vec3(3.0, 16.0, 3.0) + vRand * 7.0));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.62, 0.14, 0.16), smoothstep(0.9, 0.99, cap) * 0.35 * (1.0 - vD));
        // paler tips
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.96, 0.7, 0.62), smoothstep(0.75, 1.0, vLocal.y) * 0.25);
        // disease: paler, yellow-white lipid and foamy macrophage patches
        float patches = smoothstep(0.05, 0.55, snoise(vLocal * vec3(2.5, 9.0, 2.5) + vRand * 13.0));
        vec3 pale = vec3(0.94, 0.8, 0.7);
        diffuseColor.rgb = mix(diffuseColor.rgb, pale, vD * (0.28 + 0.3 * patches));
        #ifdef DOUBLE_SIDED
          if (!gl_FrontFacing) {
            // cut surface of the sectioned villus: the lamina propria core
            diffuseColor.rgb = mix(vec3(0.95, 0.7, 0.64), vec3(0.96, 0.85, 0.76), vD * 0.6);
          }
        #endif`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        `#include <normal_fragment_maps>
        {
          float h = snoise(vLocal * vec3(8.0, 72.0, 8.0)) * 0.0012;
          vec3 dpdx = dFdx(-vViewPosition);
          vec3 dpdy = dFdy(-vViewPosition);
          vec3 r1 = cross(dpdy, normal);
          vec3 r2 = cross(normal, dpdx);
          float det = dot(dpdx, r1);
          vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
          normal = normalize(abs(det) * normal - grad);
        }`,
      );
  };
  return m;
}

function baseMaterial() {
  const m = new THREE.MeshPhysicalMaterial({
    color: '#7d3b37',
    roughness: 0.6,
    sheen: 0.7,
    sheenColor: new THREE.Color('#ffb4a4'),
    clearcoat: 0.3,
  });
  ensureNoiseTexture();
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uNoise3D = noiseUniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vW;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvW = position;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vW;\n${NOISE_GLSL}`)
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        // openings of the crypts between villi
        float c = smoothstep(0.45, 0.8, snoise(vW * 14.0));
        diffuseColor.rgb *= 1.0 - 0.55 * c;`,
      );
  };
  return m;
}

/** Nutrient particles: rain toward the villi; healthy villi absorb most, diseased villi few. */
function particleMaterial() {
  const m = new THREE.MeshBasicMaterial({ color: '#f2bd6b', transparent: true, depthWrite: false, opacity: 0.95 });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, shared);
    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        uniform float uTime; uniform float uDisease;
        attribute vec4 aSeed; attribute vec3 aTarget;
        varying float vAlpha;`,
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float ph = fract(uTime * (0.12 + 0.05 * aSeed.w) + aSeed.z);
        vec3 start = vec3(aSeed.x, aTarget.y + 0.4 + aSeed.z * 0.4, aSeed.y);
        float absorbed = step(aSeed.w, mix(0.9, 0.2, uDisease));
        vec3 endPass = vec3(aSeed.x + 0.5 * (aSeed.z - 0.5), -0.25, aSeed.y + 1.1);
        vec3 end = mix(endPass, aTarget, absorbed);
        float e = ph * ph * (3.0 - 2.0 * ph);
        vec3 p = mix(start, end, e);
        p.x += sin(uTime * 1.3 + aSeed.z * 20.0) * 0.04 * (1.0 - e);
        float fadeIn = smoothstep(0.0, 0.12, ph);
        float fadeOut = 1.0 - smoothstep(0.84, 1.0, ph);
        float shrink = mix(1.0, 1.0 - smoothstep(0.8, 1.0, ph), absorbed);
        vAlpha = fadeIn * fadeOut;
        transformed = position * shrink + p;`,
      )
      .replace(
        '#include <project_vertex>',
        `vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);\ngl_Position = projectionMatrix * mvPosition;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vAlpha;')
      .replace('#include <opaque_fragment>', 'gl_FragColor = vec4(outgoingLight, diffuseColor.a * vAlpha);');
  };
  return m;
}

/** Pale antibiotic motes drifting between the villi during treatment. */
const moteUniforms = { uTime: shared.uTime, uOpacity: { value: 0 } };
function moteMaterial() {
  const m = new THREE.MeshBasicMaterial({ color: '#cfe6ff', transparent: true, depthWrite: false });
  m.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, moteUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
        uniform float uTime; attribute vec4 aSeed; varying float vA;`)
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        float ph = fract(uTime * 0.05 + aSeed.w);
        vec3 p = vec3(aSeed.x + sin(uTime * 0.6 + aSeed.w * 20.0) * 0.15, 0.15 + ph * 1.1, aSeed.y + cos(uTime * 0.5 + aSeed.z * 9.0) * 0.12);
        vA = sin(ph * 3.14159);
        transformed = position + p;`,
      )
      .replace('#include <project_vertex>', `vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);\ngl_Position = projectionMatrix * mvPosition;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uOpacity; varying float vA;')
      .replace('#include <opaque_fragment>', 'gl_FragColor = vec4(outgoingLight, uOpacity * vA);');
  };
  return m;
}

export function VilliWorld({ visible }: { visible: boolean }) {
  const id = useStopId();
  const mechanism = useStory((s) => s.mechanism);
  const reduced = useStory((s) => s.reducedMotion);
  const inner = useRef<THREE.Group>(null);

  const built = useMemo(() => {
    const rnd = mulberry32(21);
    const vGeo = villusProfile(14, 12);
    const mats: THREE.Matrix4[] = [];
    const rands: number[] = [];
    const tips: THREE.Vector3[] = [];
    const q = new THREE.Quaternion();
    for (let i = -10; i <= 10; i++) {
      for (let j = -9; j <= 3; j++) {
        const x = i * SPACING + (j % 2 ? SPACING * 0.5 : 0) + (rnd() - 0.5) * 0.07;
        const z = j * SPACING * 0.87 + (rnd() - 0.5) * 0.07;
        if (z > HERO.z - 0.05) continue; // the hero stands at the front edge
        if (Math.hypot(x - HERO.x, z - HERO.z) < 0.3) continue;
        const y = baseY(x, z);
        const h = 0.78 + rnd() * 0.38;
        const w = 0.1 + rnd() * 0.035;
        q.setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.22, rnd() * Math.PI * 2, (rnd() - 0.5) * 0.22));
        mats.push(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), q.clone(), new THREE.Vector3(w, h, w * (0.62 + rnd() * 0.3))));
        rands.push(rnd());
        tips.push(new THREE.Vector3(x, y + h * 0.96, z));
      }
    }
    const inst = new THREE.InstancedMesh(vGeo, villusMaterial(false), mats.length);
    mats.forEach((m, i) => inst.setMatrixAt(i, m));
    vGeo.setAttribute('aRand', new THREE.InstancedBufferAttribute(new Float32Array(rands), 1));
    inst.instanceMatrix.needsUpdate = true;
    inst.frustumCulled = false;

    // base surface
    const base = new THREE.PlaneGeometry(8, 6, 80, 60);
    base.rotateX(-Math.PI / 2);
    base.translate(0, 0, -1.3);
    const pos = base.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setY(i, baseY(pos.getX(i), pos.getZ(i)));
    base.computeVertexNormals();

    // nutrient particles
    const N = 240;
    const pGeo = new THREE.InstancedBufferGeometry();
    const sphere = new THREE.IcosahedronGeometry(0.014, 1);
    pGeo.index = sphere.index;
    pGeo.setAttribute('position', sphere.getAttribute('position'));
    pGeo.setAttribute('normal', sphere.getAttribute('normal'));
    const seeds = new Float32Array(N * 4);
    const targets = new Float32Array(N * 3);
    const near = tips.filter((t) => Math.abs(t.x) < 1.5 && t.z > -1.3 && t.z < 0.75);
    for (let i = 0; i < N; i++) {
      const t = near[Math.floor(rnd() * near.length)];
      seeds.set([t.x + (rnd() - 0.5) * 0.4, Math.min(0.8, t.z + (rnd() - 0.5) * 0.4), rnd(), rnd()], i * 4);
      targets.set([t.x, t.y, t.z], i * 3);
    }
    pGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seeds, 4));
    pGeo.setAttribute('aTarget', new THREE.InstancedBufferAttribute(targets, 3));
    pGeo.instanceCount = N;
    const particles = new THREE.Mesh(pGeo, particleMaterial());
    particles.frustumCulled = false;

    const M = 160;
    const mGeo = new THREE.InstancedBufferGeometry();
    const mote = new THREE.IcosahedronGeometry(0.011, 0);
    mGeo.index = mote.index;
    mGeo.setAttribute('position', mote.getAttribute('position'));
    mGeo.setAttribute('normal', mote.getAttribute('normal'));
    const mSeeds = new Float32Array(M * 4);
    for (let i = 0; i < M; i++) mSeeds.set([(rnd() - 0.5) * 3.2, -1.4 + rnd() * 2.2, rnd(), rnd()], i * 4);
    mGeo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(mSeeds, 4));
    mGeo.instanceCount = M;
    const motes = new THREE.Mesh(mGeo, moteMaterial());
    motes.frustumCulled = false;

    // hero villus, sectioned lengthwise (front half clipped) to show the lacteal and capillaries
    const clip = [new THREE.Plane(new THREE.Vector3(0, 0, -1), HERO.z)];
    const heroMat = villusMaterial(true);
    heroMat.clippingPlanes = clip;
    const heroGeo = villusProfile(36, 24);
    const H = HERO_SCALE.y;
    const lacteal = new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, -0.03, 0),
        new THREE.Vector3(0.004, H * 0.5, 0),
        new THREE.Vector3(0, H * 0.86, 0),
      ]),
      24,
      0.03,
      12,
    );
    // capillary network on the back wall of the sectioned villus (front half is clipped away)
    const capParts: THREE.BufferGeometry[] = [];
    const R = 0.086;
    const backPt = (theta: number, y: number, r = R) => new THREE.Vector3(Math.cos(theta) * r, y, -Math.sin(theta) * r * 0.85);
    for (let k = 0; k < 6; k++) {
      const th0 = Math.PI * (0.08 + 0.168 * k);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 14; i++) {
        const y = 0.02 + (i / 14) * H * 0.86;
        const taper = 1 - 0.18 * (i / 14);
        pts.push(backPt(th0 + 0.12 * Math.sin(i * 1.7 + k), y, R * taper));
      }
      capParts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 60, 0.0085, 6));
    }
    for (let j = 1; j < 9; j++) {
      const y = (j / 9) * H * 0.84;
      const taper = 1 - 0.18 * (y / (H * 0.86));
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 12; i++) pts.push(backPt(Math.PI * (0.06 + (0.88 * i) / 12), y + 0.012 * Math.sin(i * 2.1 + j), R * taper));
      capParts.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.006, 5));
    }
    const capillary = mergeGeometries(capParts.map((g) => g.toNonIndexed()))!;
    const lactealMat = new THREE.MeshPhysicalMaterial({
      color: '#f6ecd6',
      roughness: 0.3,
      clearcoat: 0.7,
      clippingPlanes: clip,
      side: THREE.DoubleSide,
      emissive: new THREE.Color('#3a3222'),
    });
    const capMat = new THREE.MeshPhysicalMaterial({ color: '#b3242f', roughness: 0.32, clearcoat: 0.6, clippingPlanes: clip });
    // foamy macrophages inside the hero core (appear with disease)
    const macGeo = new THREE.IcosahedronGeometry(1, 2);
    const macMat = new THREE.MeshPhysicalMaterial({
      color: '#edd0dc',
      roughness: 0.6,
      sheen: 1,
      sheenColor: new THREE.Color('#fff0f6'),
      clippingPlanes: clip,
      transparent: true,
    });
    const macs = new THREE.InstancedMesh(macGeo, macMat, 18);
    for (let i = 0; i < 18; i++) {
      const a = rnd() * Math.PI * 2;
      const r = 0.035 + rnd() * 0.04;
      macs.setMatrixAt(
        i,
        new THREE.Matrix4().compose(
          new THREE.Vector3(Math.cos(a) * r, 0.1 + rnd() * H * 0.72, Math.sin(a) * r * 0.8 + 0.01),
          new THREE.Quaternion(),
          new THREE.Vector3().setScalar(0.022 + rnd() * 0.014),
        ),
      );
    }
    macs.instanceMatrix.needsUpdate = true;
    return { inst, base, baseMat: baseMaterial(), particles, motes, heroMat, heroGeo, lacteal, capillary, lactealMat, capMat, macs, macMat };
  }, []);
  useFrontToBack(built.inst, 'villi');

  /**
   * Disease level follows the scroll: villi flatten while pulling back from the bacterium to the
   * "symptoms" stop, and recover while zooming in to the "treatment" stop. At the symptoms stop the
   * presenter can still flip between healthy and infected.
   */
  useFrame((_, dt) => {
    if (!visible) return;
    if (!reduced) shared.uTime.value += dt;
    const fs = frameState(journey.t);
    let target = 0;
    let motes = 0;
    if (fs.i === STOP_INDEX.cause && fs.f >= 0.5) target = smoothstep(0.55, 0.97, fs.f);
    else if (fs.i === STOP_INDEX.symptoms) target = mechanism === 'disease' ? 1 : 0;
    else if (fs.i === STOP_INDEX.pcr && fs.f >= 0.5) {
      target = 1 - smoothstep(0.58, 0.99, fs.f);
      motes = 0.85;
    } else if (fs.i === STOP_INDEX.treatment && fs.f < 0.4) {
      motes = 0.85 * (1 - smoothstep(0.1, 0.4, fs.f));
    }
    const scrolling = Math.abs(journey.target - journey.t) > 0.002;
    const k = reduced || scrolling ? 1 : 1 - Math.exp(-dt * 3);
    shared.uDisease.value += (target - shared.uDisease.value) * k;
    const d = shared.uDisease.value;
    moteUniforms.uOpacity.value += (motes - moteUniforms.uOpacity.value) * (1 - Math.exp(-dt * 4));
    built.macMat.opacity = Math.min(1, d * 1.4);
    built.macs.visible = d > 0.02;
    if (inner.current) inner.current.scale.set(1 + 0.42 * d, 1 - 0.44 * d, 1 + 0.42 * d);
  });

  const showParticles = id === 'symptoms';
  const heroY = baseY(HERO.x, HERO.z);

  return (
    <group>
      <mesh geometry={built.base} material={built.baseMat} />
      <primitive object={built.inst} />
      {/* sectioned hero villus */}
      <group position={[HERO.x, heroY, HERO.z]}>
        <mesh geometry={built.heroGeo} material={built.heroMat} scale={HERO_SCALE} />
        <group ref={inner}>
          <mesh geometry={built.lacteal} material={built.lactealMat} />
          <mesh geometry={built.capillary} material={built.capMat} />
          <primitive object={built.macs} />
        </group>
      </group>
      <primitive object={built.particles} visible={showParticles} />
      <primitive object={built.motes} visible={id === 'treatment' || id === 'pcr'} />
      <Label3D visible={visible && id === 'villi'} position={[HERO.x + 0.01, heroY + 0.72, HERO.z]} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 500ms both' }}>
          <span className="leader__line" style={{ width: 80 }} />
          <span className="tag">
            <TermButton termKey="lacteal">Lacteal</TermButton>
            <small>absorbs fat</small>
          </span>
        </div>
      </Label3D>
      <Label3D visible={visible && id === 'villi'} position={[HERO.x + 0.085, heroY + 0.3, HERO.z]} interactive>
        <div className="leader" style={{ animation: 'rise 700ms 700ms both' }}>
          <span className="leader__line" style={{ width: 80 }} />
          <span className="tag">
            Capillaries <small>blood vessels</small> <Cites ids={[11]} />
          </span>
        </div>
      </Label3D>
      <Label3D visible={visible && id === 'treatment'} position={[0.15, 1.45, 0.3]}>
        <span className="tag" style={{ animation: 'rise 700ms 800ms both' }}>
          <span style={{ width: 9, height: 9, borderRadius: 9, background: '#cfe6ff', display: 'inline-block' }} />
          With antibiotics the villi grow back
        </span>
      </Label3D>
      <Label3D visible={visible && id === 'symptoms'} position={[0.95, 1.38, 0.3]}>
        <span className="tag">
          <span style={{ width: 9, height: 9, borderRadius: 9, background: '#f5c87c', display: 'inline-block' }} />
          Nutrients from digested food
        </span>
      </Label3D>
    </group>
  );
}

function baseY(x: number, z: number) {
  return -0.012 * (x * x + (z + 1.3) * (z + 1.3)) + 0.025 * Math.sin(x * 1.7) * Math.cos(z * 1.3);
}
