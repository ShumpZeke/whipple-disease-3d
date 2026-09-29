/**
 * One integer hash shared by JavaScript and the shaders, so that things painted into a texture
 * in JS (the tiny filters dotted over the cut kidney) land exactly where the shader draws them
 * when the camera zooms in close. Both sides wrap at 32 bits the same way.
 */
export function hash32(x: number) {
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

/** A value in [0, 1] for grid cell (cx, cy) and a salt. */
export function cellRandom(cx: number, cy: number, salt: number) {
  return hash32((Math.imul(cx, 73856093) ^ Math.imul(cy, 19349663) ^ salt) >>> 0) / 4294967295;
}

export const HASH_GLSL = /* glsl */ `
  uint hash32(uint x) {
    x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u;
    return x;
  }
  float cellRandom(ivec2 c, uint salt) {
    return float(hash32((uint(c.x) * 73856093u) ^ (uint(c.y) * 19349663u) ^ salt)) / 4294967295.0;
  }
`;

/**
 * The tiny filters (glomeruli) in the kidney's outer layer: one per grid cell of size `G`, jittered
 * inside its cell, some cells left empty. Units: the kidney mesh's own units (its height is 2).
 * About 0.45 mm apart and 0.1 mm across on the real-size kidney.
 */
export const DOTS = { G: 0.0085, emptyBelow: 0.15, jitter: [0.25, 0.5] as const, radius: [0.17, 0.05] as const };

export function dotInCell(cx: number, cy: number): { x: number; y: number; r: number } | null {
  if (cellRandom(cx, cy, 3) < DOTS.emptyBelow) return null;
  const { G, jitter, radius } = DOTS;
  return {
    x: (cx + jitter[0] + jitter[1] * cellRandom(cx, cy, 1)) * G,
    y: (cy + jitter[0] + jitter[1] * cellRandom(cx, cy, 2)) * G,
    r: G * (radius[0] + radius[1] * cellRandom(cx, cy, 4)),
  };
}

export const DOTS_GLSL = /* glsl */ `
  // returns (distance to the dot centre in this cell / its radius), or 99 when the cell is empty
  float dotField(vec2 p) {
    const float G = ${DOTS.G.toFixed(6)};
    ivec2 c = ivec2(floor(p / G));
    if (cellRandom(c, 3u) < ${DOTS.emptyBelow.toFixed(4)}) return 99.0;
    vec2 centre = (vec2(c) + ${DOTS.jitter[0].toFixed(4)} + ${DOTS.jitter[1].toFixed(4)} * vec2(cellRandom(c, 1u), cellRandom(c, 2u))) * G;
    float r = G * (${DOTS.radius[0].toFixed(4)} + ${DOTS.radius[1].toFixed(4)} * cellRandom(c, 4u));
    return length(p - centre) / r;
  }
`;
