import * as THREE from 'three';

/**
 * Tileable 3D gradient noise baked into a small Data3DTexture at startup.
 * Shaders sample it instead of evaluating simplex noise inline: identical look, but the
 * programs are far smaller, which cuts shader compile time on Direct3D (ANGLE) from seconds
 * to a fraction of that.
 *
 * GLSL helpers (after the uniform is declared):
 *   float snoise(vec3 p)  // ≈ simplex-like, range ≈ [-1, 1], one cell per unit
 *   float fbm3(vec3 p)    // 3 octaves
 */
const SIZE = 48; // voxels per tile
const CELLS = 6; // noise cells per tile (period)

function bake(): THREE.Data3DTexture {
  // random unit gradients on a periodic CELLS³ lattice
  let seed = 1907;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const grads = new Float32Array(CELLS * CELLS * CELLS * 3);
  for (let i = 0; i < CELLS * CELLS * CELLS; i++) {
    const z = rnd() * 2 - 1;
    const a = rnd() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    grads.set([r * Math.cos(a), r * Math.sin(a), z], i * 3);
  }
  const g = (x: number, y: number, z: number) => {
    const i = (((z % CELLS) + CELLS) % CELLS) * CELLS * CELLS + (((y % CELLS) + CELLS) % CELLS) * CELLS + (((x % CELLS) + CELLS) % CELLS);
    return i * 3;
  };
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const data = new Uint8Array(SIZE * SIZE * SIZE);
  const k = CELLS / SIZE;
  let o = 0;
  for (let vz = 0; vz < SIZE; vz++) {
    for (let vy = 0; vy < SIZE; vy++) {
      for (let vx = 0; vx < SIZE; vx++) {
        const px = vx * k;
        const py = vy * k;
        const pz = vz * k;
        const x0 = Math.floor(px);
        const y0 = Math.floor(py);
        const z0 = Math.floor(pz);
        const fx = px - x0;
        const fy = py - y0;
        const fz = pz - z0;
        let n = 0;
        for (let c = 0; c < 8; c++) {
          const dx = c & 1;
          const dy = (c >> 1) & 1;
          const dz = (c >> 2) & 1;
          const gi = g(x0 + dx, y0 + dy, z0 + dz);
          const dot = grads[gi] * (fx - dx) + grads[gi + 1] * (fy - dy) + grads[gi + 2] * (fz - dz);
          const w = (dx ? fade(fx) : 1 - fade(fx)) * (dy ? fade(fy) : 1 - fade(fy)) * (dz ? fade(fz) : 1 - fade(fz));
          n += w * dot;
        }
        // gradient noise lies in about [-0.87, 0.87]; store in 0..255
        data[o++] = Math.max(0, Math.min(255, Math.round((n * 1.15 * 0.5 + 0.5) * 255)));
      }
    }
  }
  const tex = new THREE.Data3DTexture(data, SIZE, SIZE, SIZE);
  tex.format = THREE.RedFormat;
  tex.type = THREE.UnsignedByteType;
  tex.minFilter = THREE.LinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.wrapS = tex.wrapT = tex.wrapR = THREE.RepeatWrapping;
  tex.unpackAlignment = 1;
  tex.needsUpdate = true;
  return tex;
}

export const noiseUniform = { value: null as THREE.Data3DTexture | null };

export function ensureNoiseTexture() {
  if (!noiseUniform.value) noiseUniform.value = bake();
  return noiseUniform.value;
}

/** Declares `uNoise3D` and the helpers. Bind `noiseUniform` as `uNoise3D` in onBeforeCompile. */
export const NOISE_GLSL = /* glsl */ `
uniform highp sampler3D uNoise3D;
float snoise(vec3 p) {
  return texture(uNoise3D, p * ${(1 / CELLS).toFixed(6)}).r * 2.0 - 1.0;
}
float fbm3(vec3 p) {
  return 0.5 * snoise(p) + 0.25 * snoise(p * 2.03 + vec3(17.1, 3.7, 9.2)) + 0.125 * snoise(p * 4.1 + vec3(5.3, 11.9, 2.1));
}
`;
