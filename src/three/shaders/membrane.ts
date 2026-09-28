import * as THREE from 'three';
import { ensureNoiseTexture, NOISE_GLSL, noiseUniform } from './noise';

/**
 * A see-through cell membrane: clear in the middle and brighter at the edges (like a soap
 * bubble), gently wobbling with `uTime`. Works for single meshes and instanced ones.
 */
export function membraneMaterial(
  inner: string,
  rim: string,
  alphaMin: number,
  alphaMax: number,
  wobble: number,
  uTime: { value: number },
) {
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
        #ifdef USE_INSTANCING
          vec3 seed = instanceMatrix[3].xyz;
        #else
          vec3 seed = vec3(0.0);
        #endif
        float n = snoise(p * 1.4 + seed + vec3(uTime * 0.04));
        float n2 = snoise(p * 3.1 - seed - vec3(uTime * 0.03));
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
