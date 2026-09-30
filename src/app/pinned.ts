/*
 * Words pinned in the scene. A stop's words sit in the corner of the screen when the camera rests
 * at that stop, but they belong to a place in the 3D world (beside what they describe, at its
 * depth), so while the camera travels they move with the world: they come in with the scene as we
 * arrive and slide away with it as we leave, instead of fading in and out on a flat layer.
 *
 * The 3D stage reports the camera's path pose every frame it draws (plain numbers, so the words do
 * not need three.js), and the pose each stop rests at.
 */

type V = { x: number; y: number; z: number };

export interface PathPose {
  pos: V;
  target: V;
  up: V;
  fov: number;
}

type Listener = (cam: PathPose) => void;
const listeners = new Set<Listener>();

/** Each stop's resting pose (for the current screen shape), once the stage has worked them out. */
export const restPoses: { list: PathPose[] | null } = { list: null };

export function onCameraPath(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Called by the stage whenever it draws (the camera's pose along the path, without any drag). */
export function emitCameraPath(cam: PathPose) {
  for (const fn of listeners) fn(cam);
}

const sub = (a: V, b: V) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const dot = (a: V, b: V) => a.x * b.x + a.y * b.y + a.z * b.z;
const cross = (a: V, b: V) => ({ x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x });
const norm = (a: V) => {
  const l = Math.hypot(a.x, a.y, a.z) || 1;
  return { x: a.x / l, y: a.y / l, z: a.z / l };
};

function basis(p: PathPose) {
  const f = norm(sub(p.target, p.pos));
  const r = norm(cross(f, p.up));
  const u = cross(r, f);
  const k = Math.tan(((p.fov / 2) * Math.PI) / 180);
  return { f, r, u, k };
}

/** Where a world point lands on screen (pixels), and how far in front of the camera it is. */
export function project(p: PathPose, w: V, width: number, height: number) {
  const { f, r, u, k } = basis(p);
  const v = sub(w, p.pos);
  const z = dot(v, f);
  if (z <= 1e-9) return null;
  const aspect = width / height;
  const nx = dot(v, r) / (z * k * aspect);
  const ny = dot(v, u) / (z * k);
  return { x: (nx + 1) * 0.5 * width, y: (1 - ny) * 0.5 * height, z };
}

/** The world point `depth` in front of the camera that lands on screen pixel (x, y). */
export function unproject(p: PathPose, x: number, y: number, depth: number, width: number, height: number): V {
  const { f, r, u, k } = basis(p);
  const aspect = width / height;
  const nx = (x / width) * 2 - 1;
  const ny = 1 - (y / height) * 2;
  const a = nx * k * aspect * depth;
  const b = ny * k * depth;
  return { x: p.pos.x + f.x * depth + r.x * a + u.x * b, y: p.pos.y + f.y * depth + r.y * a + u.y * b, z: p.pos.z + f.z * depth + r.z * a + u.z * b };
}

const dist = (a: V, b: V) => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/**
 * Pin an element to the world at stop `index`: at that stop it sits where the page lays it out;
 * away from it, it moves (and grows or shrinks) with the scene. Returns an unsubscribe function.
 */
export function pinToScene(el: HTMLElement, index: number) {
  let rest: { key: string; cx: number; cy: number; anchor: V; depth: number } | null = null;
  el.style.transformOrigin = '50% 50%';
  return onCameraPath((cam) => {
    const stops = restPoses.list;
    if (!stops || !stops[index] || el.style.visibility === 'hidden') return;
    const W = window.innerWidth;
    const H = window.innerHeight;
    const key = `${index}:${W}x${H}:${el.offsetWidth}x${el.offsetHeight}`;
    if (!rest || rest.key !== key) {
      // where the page lays it out (measured without the move)
      const was = el.style.transform;
      el.style.transform = '';
      const box = el.getBoundingClientRect();
      el.style.transform = was;
      const at = stops[index];
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const depth = dist(at.pos, at.target);
      rest = { key, cx, cy, depth, anchor: unproject(at, cx, cy, depth, W, H) };
    }
    const s = project(cam, rest.anchor, W, H);
    if (!s) {
      el.style.transform = 'scale(0)';
      return;
    }
    const scale = Math.min(3, Math.max(0.3, rest.depth / s.z));
    el.style.transform = `translate(${(s.x - rest.cx).toFixed(1)}px, ${(s.y - rest.cy).toFixed(1)}px) scale(${scale.toFixed(4)})`;
  });
}
