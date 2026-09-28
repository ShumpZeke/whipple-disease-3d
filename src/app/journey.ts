import { LAST_STOP, STOPS, type Stop, type World } from '../content/story';

/**
 * The scroll-driven zoom. `journey.t` is a continuous position along the story:
 * t = 3 means "at stop 3", t = 3.5 is halfway to stop 4. The page scrolls natively (wheel,
 * trackpad, touch, scrollbar, keyboard, presenter clicker) and t follows the scroll with damping,
 * so every visual — camera, fades, the villi morph — is a pure function of t and can be scrubbed
 * forwards and backwards.
 */
export const journey = {
  t: 0,
  target: 0,
  /** Seconds since the last change of t (used to idle the renderer). */
  still: 0,
  reduced: false,
};

type Listener = (t: number, dt: number) => void;
const listeners = new Set<Listener>();
export function onJourneyFrame(fn: Listener) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

let invalidate: (() => void) | null = null;
/** The WebGL stage registers its invalidate() so scrolling renders on demand. */
export function registerInvalidate(fn: (() => void) | null) {
  invalidate = fn;
}

export const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** The hinge between the 1907 history and the modern 3D model. */
export const HINGE = STOPS.findIndex((s) => s.id === 'name');

export interface FrameState {
  i: number;
  f: number;
  a: Stop;
  b: Stop;
  /** Scenes differ: the camera dives through a surface (veil at f = 0.5). */
  cut: boolean;
  hinge: boolean;
  world: World;
  veil: number;
  veilColor: string;
  /** 'in' dives to a smaller scale, 'out' pulls back to a larger one (when scrolling forward). */
  dir: 'in' | 'out';
}

const OUTWARD = new Set(['cause>symptoms', 'symptoms>spread', 'pcr>treatment', 'treatment>quiz']);

const VEIL: Record<string, string> = {
  'intestine>wall': '#c7766b',
  'wall>villi': '#b25a52',
  'villi>cause': '#e9c3bb',
  'cause>symptoms': '#140d16',
  'symptoms>spread': '#15171a',
  'spread>biopsy': '#b25a52',
  'biopsy>stain': '#f4e2ea',
  'stain>pcr': '#2a1024',
  'pcr>treatment': '#140d16',
  'treatment>quiz': '#15171a',
};

export function frameState(t: number): FrameState {
  const tt = Math.min(LAST_STOP, Math.max(0, t));
  const i = Math.min(LAST_STOP - 1, Math.floor(tt));
  const f = tt - i;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  const hinge = i === HINGE;
  const cut = a.scene !== b.scene && !hinge && a.scene !== 'history';
  let world: World = a.world;
  let veil = 0;
  if (hinge) {
    world = f > 0.18 ? 'anatomy' : 'none';
  } else if (cut) {
    world = f < 0.5 ? a.world : b.world;
    veil = smoothstep(0.22, 0.5, f) * (1 - smoothstep(0.5, 0.78, f));
  }
  const key = `${a.id}>${b.id}`;
  return { i, f, a, b, cut, hinge, world, veil, veilColor: VEIL[key] ?? '#120f12', dir: OUTWARD.has(key) ? 'out' : 'in' };
}

/** Stop nearest to t (what the captions describe). */
export const nearestStop = (t: number) => Math.min(LAST_STOP, Math.max(0, Math.round(t)));

/** How visible a stop's caption is at t: 1 at the stop, fading out halfway to its neighbours. */
export const stopPresence = (t: number, index: number) => 1 - smoothstep(0.16, 0.42, Math.abs(t - index));

/* ------------------------------------------------------------------ scroll driver */

const vh = () => window.innerHeight;
let tween: { from: number; to: number; start: number; dur: number } | null = null;

/** Smoothly scroll the page to a stop (keyboard, presenter clicker, rail, buttons). */
export function scrollToStop(index: number, instant = false) {
  const i = Math.min(LAST_STOP, Math.max(0, index));
  const to = i * vh();
  if (instant || journey.reduced) {
    tween = null;
    window.scrollTo(0, to);
    return;
  }
  const from = window.scrollY;
  const dist = Math.abs(to - from) / vh();
  tween = { from, to, start: performance.now(), dur: Math.min(2600, 900 + 700 * Math.sqrt(dist)) };
  document.documentElement.classList.add('is-tweening');
}

export function currentTargetStop() {
  return Math.round(window.scrollY / vh());
}

let running = false;
export function startJourney(onStop: (i: number) => void, onWorld: (w: World) => void) {
  if (running) return () => undefined;
  running = true;
  let last = performance.now();
  let lastStop = -1;
  let lastWorld: World | null = null;
  const cancelTween = () => {
    if (tween) {
      tween = null;
      document.documentElement.classList.remove('is-tweening');
    }
  };
  window.addEventListener('wheel', cancelTween, { passive: true });
  window.addEventListener('touchstart', cancelTween, { passive: true });

  const loop = (now: number) => {
    if (!running) return;
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (tween) {
      const k = Math.min(1, (now - tween.start) / tween.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      window.scrollTo(0, tween.from + (tween.to - tween.from) * e);
      if (k >= 1) {
        tween = null;
        document.documentElement.classList.remove('is-tweening');
      }
    }
    journey.target = Math.min(LAST_STOP, Math.max(0, window.scrollY / vh()));
    const prev = journey.t;
    if (journey.reduced) journey.t = journey.target;
    else journey.t += (journey.target - journey.t) * (1 - Math.exp(-dt * 7));
    if (Math.abs(journey.target - journey.t) < 0.0004) journey.t = journey.target;
    const moving = journey.t !== prev;
    journey.still = moving ? 0 : journey.still + dt;

    const s = nearestStop(journey.t);
    if (s !== lastStop) {
      lastStop = s;
      onStop(s);
    }
    const fs = frameState(journey.t);
    if (fs.world !== lastWorld) {
      lastWorld = fs.world;
      onWorld(fs.world);
    }
    if (moving || journey.still < 0.3) {
      for (const fn of listeners) fn(journey.t, dt);
      invalidate?.();
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  return () => {
    running = false;
    window.removeEventListener('wheel', cancelTween);
    window.removeEventListener('touchstart', cancelTween);
  };
}

/** Force listeners to redraw once (e.g., after mount). */
export function pokeJourney() {
  for (const fn of listeners) fn(journey.t, 0);
  invalidate?.();
}
