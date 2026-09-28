/**
 * Picks how much 3D detail this device can handle, once, when the page loads.
 *
 * "lite" is for school laptops, Chromebooks and smart boards with a built-in computer. Nothing is
 * removed: the same scenes, detail and effects, drawn at the screen's own resolution (no
 * super-sampling) and with moving scenes paced at 30 frames a second instead of every refresh.
 * Add `?lite` or `?hq` to the address to force either one.
 */
export type Quality = 'high' | 'lite';

function gpuName(): string {
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    if (!gl) return '';
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return name;
  } catch {
    return '';
  }
}

const KEY = 'whipple-quality';

/** Remember that this device struggled, so next time it starts in lite straight away. */
export function rememberLite() {
  try {
    localStorage.setItem(KEY, 'lite');
  } catch {
    /* private mode: just this visit */
  }
}

export function detectQuality(): Quality {
  const q = new URLSearchParams(window.location.search);
  if (q.has('lite')) return 'lite';
  if (q.has('hq')) {
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
    return 'high';
  }
  try {
    if (localStorage.getItem(KEY) === 'lite') return 'lite';
  } catch {
    /* ignore */
  }
  const cores = navigator.hardwareConcurrency || 4;
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
  const gpu = gpuName();
  // software rendering, phone/tablet/smart-board chips, and older or basic Intel graphics
  const software = /swiftshader|llvmpipe|softpipe|software|basic render/i.test(gpu);
  const weak = /mali|adreno|powervr|videocore|intel.*\b(hd|uhd) graphics\b/i.test(gpu) && !/iris|arc/i.test(gpu);
  return software || weak || cores <= 4 || memory <= 4 ? 'lite' : 'high';
}

export const QUALITY: Quality = typeof window === 'undefined' ? 'high' : detectQuality();
export const LITE = QUALITY === 'lite';
