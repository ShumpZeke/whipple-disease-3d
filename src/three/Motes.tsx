import { useFrame, useThree } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { journey } from '../app/journey';
import { LITE } from '../app/quality';
import { view } from './Director';
import { mulberry32 } from './random';

/*
 * Dust in the air, at every scale. The camera flies through it, so every move between two stops
 * feels like travelling through one space (things pass by, near ones faster than far ones), from
 * the lamp-lit study all the way down to the DNA. The dust fills a box a few times the viewing
 * distance around the camera; as the zoom goes down (or up) by ten, a finer (or coarser) box of
 * dust fades in and the other fades out, so it looks the same at every scale. It only shows while
 * the camera is moving: every stop is left clean.
 */

const COUNT = LITE ? 3000 : 6000;
/** Each box of dust is about this many times the viewing distance across. */
const BOX = 3;
/** How big a speck is, as a part of its box (about 5 pixels across at the viewing distance). */
const SPECK = 8e-4;

const vertexShader = /* glsl */ `
  uniform vec3 uCamFrac;
  uniform float uL;
  uniform float uScale;
  attribute float aSize;
  attribute float aAlpha;
  varying float vAlpha;
  void main() {
    // the copy of this speck nearest the camera (the box repeats forever), relative to the camera;
    // the camera's place in its box is worked out on the CPU, so this stays precise at any scale
    vec3 rel = -uL * (fract(uCamFrac - position + 0.5) - 0.5);
    float r = length(rel);
    // none right at the lens, and none near the edge of the box (where a speck jumps to the far side)
    vAlpha = aAlpha * smoothstep(0.1 * uL, 0.2 * uL, r) * (1.0 - smoothstep(0.34 * uL, 0.47 * uL, r));
    vec4 mv = vec4(mat3(viewMatrix) * rel, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.0, ${SPECK} * uL * aSize * uScale / max(-mv.z, 1e-30));
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a = exp(-dot(c, c) * 16.0) * vAlpha * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(uColor, a);
  }
`;

const frac = (x: number) => x - Math.floor(x);

export function Motes() {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const speed = useRef({ last: journey.t, v: 0 });

  const built = useMemo(() => {
    const rnd = mulberry32(1899);
    const pos = new Float32Array(COUNT * 3);
    const sz = new Float32Array(COUNT);
    const al = new Float32Array(COUNT);
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = rnd();
      pos[i * 3 + 1] = rnd();
      pos[i * 3 + 2] = rnd();
      sz[i] = 0.5 + rnd() * 0.9;
      al[i] = 0.3 + rnd() * 0.7;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sz, 1));
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(al, 1));
    const layer = () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uCamFrac: { value: new THREE.Vector3() },
          uL: { value: 1 },
          uScale: { value: 1000 },
          uColor: { value: new THREE.Color('#f1e4cc') },
          uOpacity: { value: 0 },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
      });
    return { geo, layers: [layer(), layer()] };
  }, []);

  useFrame((_, dt) => {
    // how fast the journey is moving (stops per second), smoothed
    const s = speed.current;
    const v = dt > 0 ? Math.abs(journey.t - s.last) / dt : 0;
    s.last = journey.t;
    s.v += (v - s.v) * Math.min(1, dt * 8);
    const moving = THREE.MathUtils.smoothstep(s.v, 0.04, 0.5);

    const k = Math.log10(BOX * view.d);
    const k0 = Math.floor(k);
    const f = k - k0;
    const scale = (size.height * gl.getPixelRatio()) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
    const c = camera.position;
    built.layers.forEach((m, j) => {
      const L = 10 ** (k0 + j);
      const u = m.uniforms;
      u.uL.value = L;
      u.uScale.value = scale;
      u.uCamFrac.value.set(frac(c.x / L), frac(c.y / L), frac(c.z / L));
      u.uOpacity.value = 0.5 * moving * (j === 0 ? 1 - f : f);
    });
  });

  return (
    <>
      {built.layers.map((m, j) => (
        <points key={j} geometry={built.geo} material={m} frustumCulled={false} renderOrder={30} />
      ))}
    </>
  );
}
