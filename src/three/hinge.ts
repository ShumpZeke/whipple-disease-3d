import { HINGE, smoothstep } from '../app/journey';

/**
 * Leaving "His 1899 book", the camera leans past Max Wilms's shoulder to the page in front of his
 * face; just before it reaches him he dissolves from the top down (like the page later on), so only
 * his book is left. The line is a height in the study (metres); he is below 1.45 m.
 */
export function manLine(t: number) {
  const a = HINGE - 1 + 0.16;
  const b = HINGE - 1 + 0.46;
  return t <= a ? 1e3 : t >= b ? -1e3 : 1.55 - 1.65 * smoothstep(a, b, t);
}

/**
 * From the book to the 3D organs (stop "name" → "body"). The organs start as the engraved
 * drawing on the page, pressed flat onto it. As the camera leans in, a sweep "develops" them from
 * the top down into full colour and full depth; the paper and the room dissolve behind the sweep
 * and the lamp goes out, so the organs are left floating in the same dark space as the rest of the
 * exhibit.
 */
export function hingeState(t: number) {
  const f = Math.min(1, Math.max(0, t - HINGE));
  const before = t <= HINGE;
  const after = t >= HINGE + 1;
  // the sweep line, as a fraction of the organs' height (1.3 = above them all, −0.25 = below the page)
  const reveal = before ? 1.3 : after ? -0.25 : 1.3 - 1.55 * smoothstep(0.28, 0.82, f);
  return {
    reveal,
    engrave: after || f >= 0.985 ? 0 : 1,
    flatten: before ? 0.04 : after ? 1 : 0.04 + 0.96 * smoothstep(0.32, 0.88, f),
    /** paper left on the page (1 = all of it); it goes with the sweep */
    page: after ? 0 : 1,
    /**
     * The room's own sweep line (same units as `reveal`): it comes down from high above while the
     * camera leans in, reaches the top of the drawing as the page's sweep starts, then runs on ahead
     * of it, so the desk at the bottom of the view is gone before the organs settle.
     */
    studyReveal: before ? 1e3 : after ? -1e3 : 4.3 - 3 * smoothstep(0, 0.28, f) - 4.3 * smoothstep(0.28, 0.95, f),
    /** the desk, the man and the lamp (they dissolve with the sweep, then are hidden) */
    study: t < HINGE + 1,
    /** the lamp on the desk */
    lamp: 1 - smoothstep(HINGE + 0.12, HINGE + 0.5, t),
    /** the soft shadow under the organs */
    shadow: smoothstep(HINGE + 0.8, HINGE + 1, t),
  };
}
