import * as THREE from 'three';
import { ensureNoiseTexture, NOISE_GLSL, noiseUniform } from '../shaders/noise';
import type { OrganLook } from './organs';

/**
 * Uniforms shared by every organ (one object, referenced by all materials):
 * the old "engraving" look and the develop sweep used in the history → 3D transition.
 */
export const sharedOrganUniforms = {
  uEngrave: { value: 0 },
  /** 1 = full depth; near 0 = pressed flat onto the book page (the organs start as a drawing). */
  uFlatten: { value: 1 },
  /** The page plane the organs are pressed onto (world z). */
  uPageZ: { value: -0.23 },
  /** 0..1 normalised world height of the develop sweep; above it the organ is "developed". */
  uReveal: { value: 1 },
  uRevealMin: { value: -1 },
  uRevealMax: { value: 1 },
  uInk: { value: new THREE.Color('#3a2a1c') },
  uPixelRatio: { value: 1 },
  uAOStrength: { value: 0.85 },
};

export interface OrganMaterial extends THREE.MeshPhysicalMaterial {
  userData: {
    uniforms: {
      uDim: { value: number };
      uHighlight: { value: number };
      uHighlightColor: { value: THREE.Color };
      uObjMatrix: { value: THREE.Matrix4 };
      uCut: { value: THREE.Vector4 };
    };
  };
}

/**
 * Planes that slice the organs for the scans (the ultrasound's plane, the CT's slice). Shared by
 * every organ material; a plane that is not in use sits far away so it cuts nothing.
 */
export const slicePlanes = {
  sagittal: new THREE.Plane(new THREE.Vector3(-1, 0, 0), 1e6),
  axial: new THREE.Plane(new THREE.Vector3(0, 1, 0), 1e6),
};

/** `scale` is the world scale applied to the model, so bump heights stay in world units. */
export function createOrganMaterial(look: OrganLook, scale = 1, hasAO = true): OrganMaterial {
  ensureNoiseTexture();
  const mat = new THREE.MeshPhysicalMaterial({
    // transparent so the engraved drawing can show the paper through its hatching; organs are
    // drawn front to back (renderOrder), so while solid they still hide what is behind them
    transparent: true,
    clippingPlanes: [slicePlanes.sagittal, slicePlanes.axial],
    color: new THREE.Color(look.color),
    roughness: look.roughness,
    metalness: 0,
    clearcoat: look.clearcoat,
    clearcoatRoughness: 0.32,
    sheen: look.sheen,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color(look.sheenColor),
    specularIntensity: 0.6,
    ior: 1.4,
    envMapIntensity: 0.9,
  }) as OrganMaterial;

  const local = {
    uDim: { value: 0 },
    uHighlight: { value: 0 },
    uHighlightColor: { value: new THREE.Color('#ffe2c4') },
    uVeinColor: { value: new THREE.Color(look.vein) },
    uVeinStrength: { value: look.veinStrength },
    uBumpScale: { value: look.bumpScale },
    uBumpStrength: { value: look.bumpStrength * scale },
    uMottle: { value: look.mottle },
    uHasAO: { value: hasAO ? 1 : 0 },
    /** Mesh-local → model-space transform (undoes KHR_mesh_quantization) so noise is in metres. */
    uObjMatrix: { value: new THREE.Matrix4() },
    /**
     * Cut away a box corner of the organ (world space): x = on, y = keep z below this, z = only above
     * this y, w = only right of this x. Used to open the left kidney's collecting system.
     */
    uCut: { value: new THREE.Vector4(0, 0, 0, 0) },
  };
  mat.userData.uniforms = local;

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, sharedOrganUniforms, local, { uNoise3D: noiseUniform });

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        attribute vec4 color;
        uniform mat4 uObjMatrix;
        uniform float uFlatten;
        uniform float uPageZ;
        varying vec3 vObjPos;
        varying vec3 vWorldPos;
        varying float vAO;`,
      )
      .replace(
        '#include <project_vertex>',
        /* glsl */ `#include <project_vertex>
        vObjPos = (uObjMatrix * vec4(position, 1.0)).xyz;
        vWorldPos = (modelMatrix * vec4(transformed, 1.0)).xyz;
        vAO = color.r;
        if (uFlatten < 0.999) {
          // pressed onto the page: squash depth towards the page plane (lighting keeps the true shape)
          vec4 wp = vec4(vWorldPos, 1.0);
          wp.z = uPageZ + (wp.z - uPageZ) * uFlatten;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }`,
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        /* glsl */ `#include <common>
        varying vec3 vObjPos;
        varying vec3 vWorldPos;
        varying float vAO;
        uniform float uDim;
        uniform float uHighlight;
        uniform vec3 uHighlightColor;
        uniform vec3 uVeinColor;
        uniform float uVeinStrength;
        uniform float uBumpScale;
        uniform float uBumpStrength;
        uniform float uMottle;
        uniform float uHasAO;
        uniform float uEngrave;
        uniform float uReveal;
        uniform float uRevealMin;
        uniform float uRevealMax;
        uniform vec3 uInk;
        uniform float uPixelRatio;
        uniform float uAOStrength;
        uniform vec4 uCut;
        ${NOISE_GLSL}`,
      )
      .replace(
        '#include <clipping_planes_fragment>',
        /* glsl */ `#include <clipping_planes_fragment>
        if (uCut.x > 0.5 && vWorldPos.z > uCut.y && vWorldPos.y > uCut.z && vWorldPos.x > uCut.w) discard;`,
      )
      .replace(
        '#include <color_fragment>',
        /* glsl */ `
        float nA = snoise(vObjPos * uBumpScale * 0.35);
        float nB = fbm3(vObjPos * uBumpScale * 0.9);
        vec3 tissue = diffuseColor.rgb * (1.0 + uMottle * (0.65 * nA + 0.35 * nB));
        // fine surface vessels: thin ridges of a warped noise field
        float vr = 1.0 - abs(snoise(vObjPos * uBumpScale * 0.42 + vec3(nB * 0.6)));
        float vessel = smoothstep(0.88, 0.99, vr) * uVeinStrength;
        tissue = mix(tissue, uVeinColor, vessel * 0.7);
        float ao = mix(1.0, vAO, uAOStrength * uHasAO);
        diffuseColor.rgb = tissue * mix(1.0, ao, 0.45);`,
      )
      .replace(
        '#include <normal_fragment_maps>',
        /* glsl */ `#include <normal_fragment_maps>
        {
          float h = fbm3(vObjPos * uBumpScale) + 0.35 * snoise(vObjPos * uBumpScale * 3.1);
          h *= uBumpStrength;
          vec3 dpdx = dFdx(-vViewPosition);
          vec3 dpdy = dFdy(-vViewPosition);
          vec3 r1 = cross(dpdy, normal);
          vec3 r2 = cross(normal, dpdx);
          float det = dot(dpdx, r1);
          vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2);
          normal = normalize(abs(det) * normal - grad);
        }`,
      )
      .replace(
        '#include <aomap_fragment>',
        /* glsl */ `
        {
          float occ = mix(1.0, vAO, uAOStrength * uHasAO);
          reflectedLight.indirectDiffuse *= occ;
          reflectedLight.indirectSpecular *= occ * occ;
          reflectedLight.directDiffuse *= mix(1.0, occ, 0.55);
          reflectedLight.directSpecular *= mix(1.0, occ, 0.7);
          #if defined( USE_CLEARCOAT )
            clearcoatSpecularIndirect *= occ;
            clearcoatSpecularDirect *= mix(1.0, occ, 0.6);
          #endif
          #if defined( USE_SHEEN )
            sheenSpecularIndirect *= occ;
          #endif
        }`,
      )
      .replace(
        '#include <opaque_fragment>',
        /* glsl */ `
        vec3 viewDirN = normalize(vViewPosition);
        float ndv = clamp(dot(normal, viewDirN), 0.0, 1.0);
        // warm, soft rim for the selected organ (never neon)
        float rim = pow(1.0 - ndv, 2.2);
        outgoingLight += uHighlight * uHighlightColor * (0.32 * rim + 0.035);
        // de-emphasis: desaturate and darken, stays opaque (no sorting artefacts)
        float lum = dot(outgoingLight, vec3(0.2126, 0.7152, 0.0722));
        outgoingLight = mix(outgoingLight, vec3(lum) * vec3(0.52, 0.53, 0.56), uDim * 0.82);

        #include <opaque_fragment>

        if (uEngrave > 0.001) {
          vec3 keyDir = normalize(vec3(-0.45, 0.65, 0.62));
          float tone = clamp(dot(normal, keyDir) * 0.5 + 0.5, 0.0, 1.0);
          tone = tone * mix(0.85, 1.0, vAO * uHasAO + (1.0 - uHasAO));
          vec2 fc = gl_FragCoord.xy / uPixelRatio;
          float spacing = 4.2;
          float d1 = abs(fract(dot(fc, vec2(0.7071, 0.7071)) / spacing) - 0.5);
          float d2 = abs(fract(dot(fc, vec2(0.7071, -0.7071)) / spacing) - 0.5);
          float d3 = abs(fract(fc.y / (spacing * 0.9)) - 0.5);
          float w1 = mix(0.0, 0.3, smoothstep(0.78, 0.45, tone));
          float w2 = mix(0.0, 0.26, smoothstep(0.55, 0.28, tone));
          float w3 = mix(0.0, 0.2, smoothstep(0.2, 0.02, tone));
          float aa = 0.08;
          float ink = 1.0 - smoothstep(w1 - aa, w1 + aa, d1);
          ink = max(ink, 1.0 - smoothstep(w2 - aa, w2 + aa, d2));
          ink = max(ink, 1.0 - smoothstep(w3 - aa, w3 + aa, d3));
          float contour = smoothstep(0.62, 0.9, 1.0 - ndv);
          ink = clamp(max(ink * 0.85, contour), 0.0, 1.0);
          float yN = (vWorldPos.y - uRevealMin) / max(uRevealMax - uRevealMin, 1e-4);
          float k = uEngrave * (1.0 - smoothstep(uReveal - 0.07, uReveal + 0.07, yN));
          vec4 engraved = vec4(uInk * ink, ink);
          gl_FragColor = mix(gl_FragColor, engraved, k);
        }`,
      );
  };
  // one program for all organs (all differences live in uniforms)
  mat.customProgramCacheKey = () => 'organ-v1';
  return mat;
}
