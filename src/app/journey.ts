import { LAST_STOP, SOURCES_PAGE, STOPS, type Stop, type World } from '../content/story';

/**
 * The scroll-driven zoom. `journey.t` is a continuous position along the story:
 * t = 3 means "at stop 3", t = 3.5 is halfway to stop 4. The page scrolls natively (wheel,
 * trackpad, touch, scrollbar, keyboard, presenter clicker) and t follows the scroll with damping,
 * so every visual (the camera, the fades, the tumor growing) is a pure function of t and can be
 * scrubbed forwards and backwards.
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

/** The hinge between the history (the book on Max Wilms's desk) and the 3D organs. */
export const HINGE = STOPS.findIndex((s) => s.id === 'name');

export interface FrameState {
  i: number;
  f: number;
  a: Stop;
  b: Stop;
  /** The part of the story the camera is in (for captions, notes and pacing). */
  world: World;
}

export function frameState(t: number): FrameState {
  const tt = Math.min(LAST_STOP, Math.max(0, t));
  const i = Math.min(LAST_STOP - 1, Math.floor(tt));
  const f = tt - i;
  const a = STOPS[i];
  const b = STOPS[i + 1];
  return { i, f, a, b, world: f < 0.5 ? a.world : b.world };
}

/** Stop nearest to t (what the captions describe). */
export const nearestStop = (t: number) => Math.min(LAST_STOP, Math.max(0, Math.round(t)));

/** How visible a stop's caption is at t: 1 at the stop, fading out halfway to its neighbours. */
export const stopPresence = (t: number, index: number) => 1 - smoothstep(0.16, 0.42, Math.abs(t - index));

/* ------------------------------------------------------------------ scroll driver */

const vh = () => window.innerHeight;
let tween: { index: number; from: number; to: number; start: number; dur: number } | null = null;

/**
 * Smoothly scroll the page to a stop (keyboard, presenter clicker, Back/Next buttons, rail).
 * Index SOURCES_PAGE (one past the last stop) is the list of sources below the summary.
 */
export function scrollToStop(index: number, instant = false) {
  const i = Math.min(SOURCES_PAGE, Math.max(0, index));
  const to = i * vh();
  if (instant || journey.reduced) {
    tween = null;
    document.documentElement.classList.remove('is-tweening');
    window.scrollTo(0, to);
    return;
  }
  const from = window.scrollY;
  const dist = Math.abs(to - from) / vh();
  tween = { index: i, from, to, start: performance.now(), dur: Math.min(2600, 900 + 700 * Math.sqrt(dist)) };
  document.documentElement.classList.add('is-tweening');
}

/** The stop the page is at, or heading to (so pressing Next twice quickly moves two stops). */
export function currentTargetStop() {
  if (tween) return tween.index;
  return Math.min(SOURCES_PAGE, Math.round(window.scrollY / vh()));
}

/** `?nosettle` turns settling off, so the screenshot scripts can stop between two stops. */
const settling = typeof location === 'undefined' || !new URLSearchParams(location.search).has('nosettle');

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
  // a wheel turn or a finger dragging the page takes over from a running zoom (a tap does not,
  // so tapping Next twice on a touch screen moves two stops)
  window.addEventListener('wheel', cancelTween, { passive: true });
  window.addEventListener('touchmove', cancelTween, { passive: true });
  // Entering full screen (or rotating a tablet) changes the screen height, which would move every
  // stop's scroll position: stay on the same spot of the journey instead.
  let lastVh = vh();
  let lastRatio = window.scrollY / vh();
  const onResize = () => {
    if (vh() === lastVh) return;
    lastVh = vh();
    if (tween) {
      const i = tween.index;
      tween = null;
      document.documentElement.classList.remove('is-tweening');
      window.scrollTo(0, i * vh());
    } else {
      dir = 0;
      window.scrollTo(0, lastRatio * vh());
    }
  };
  window.addEventListener('resize', onResize);

  // Always come to rest on a stop (that is where the captions are). When a wheel, trackpad or
  // finger scroll ends between two stops, finish the zoom in the direction it was going; a small
  // nudge falls back. The list of sources after the last stop scrolls freely.
  let touching = false;
  let lastY = window.scrollY;
  let dir = 0;
  let settleTimer: ReturnType<typeof setTimeout> | undefined;
  const settle = () => {
    settleTimer = undefined;
    if (tween || touching || !settling) return;
    const r = window.scrollY / vh();
    if (r >= SOURCES_PAGE - 0.01) return;
    const near = Math.round(r);
    if (Math.abs(r - near) < 0.01) return;
    scrollToStop(dir > 0 ? Math.ceil(r - 0.15) : dir < 0 ? Math.floor(r + 0.15) : near);
  };
  const scheduleSettle = () => {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(settle, 220);
  };
  const onScroll = () => {
    const y = window.scrollY;
    if (y !== lastY) dir = Math.sign(y - lastY);
    lastY = y;
    if (!tween && !touching) scheduleSettle();
  };
  const onTouchStart = () => {
    touching = true;
    clearTimeout(settleTimer);
  };
  const onTouchEnd = () => {
    touching = false;
    scheduleSettle();
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('touchstart', onTouchStart, { passive: true });
  window.addEventListener('touchend', onTouchEnd, { passive: true });
  window.addEventListener('touchcancel', onTouchEnd, { passive: true });

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
    lastRatio = window.scrollY / vh();
    journey.target = Math.min(LAST_STOP, Math.max(0, lastRatio));
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
    window.removeEventListener('touchmove', cancelTween);
    window.removeEventListener('resize', onResize);
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('touchstart', onTouchStart);
    window.removeEventListener('touchend', onTouchEnd);
    window.removeEventListener('touchcancel', onTouchEnd);
    clearTimeout(settleTimer);
  };
}

/** Force listeners to redraw once (e.g., after mount). */
export function pokeJourney() {
  for (const fn of listeners) fn(journey.t, 0);
  invalidate?.();
}
