import { HINGE, smoothstep } from '../app/journey';
import { STOP_INDEX } from '../content/story';

/**
 * Where the journey comes back out of the book. From the outlook the camera pulls back: the
 * organs press back into the drawing on the page, the paper and the room build up again around
 * it, the lamp comes back on and Max Wilms is at his desk again for the summary and the quiz.
 * Nothing is thrown away on the way in, so the way out is the same world, played backwards.
 */
export const RETURN = STOP_INDEX.outlook;

/** 0 → 1 between two points of the way back out (fractions of the move from RETURN to the end). */
const back = (t: number, a: number, b: number) => smoothstep(RETURN + a, RETURN + b, t);

/**
 * Leaving "His 1899 book", the camera leans past Max Wilms's shoulder to the page in front of his
 * face; just before it reaches him he dissolves from the top down (like the page later on), so only
 * his book is left. On the way back out he builds up again from the floor, once the camera is clear
 * of him. The line is a height in the study (metres); he is below 1.45 m.
 */
export function manLine(t: number) {
  const a = HINGE - 1 + 0.16;
  const b = HINGE - 1 + 0.46;
  if (t <= a) return 1e3;
  if (t < b) return 1.55 - 1.65 * smoothstep(a, b, t);
  if (t < RETURN + 0.6) return -1e3;
  if (t < RETURN + 0.88) return -0.1 + 1.7 * back(t, 0.6, 0.88);
  return 1e3;
}

/** 0 → 1 while the kidney that was taken out comes back into the drawing (see AnatomyWorld). */
export const kidneyBack = (t: number) => back(t, 0.02, 0.26);

/** The state before the hinge: the organs are the engraving on the page and the room is lit. */
const ON_THE_PAGE = {
  reveal: 1.3,
  engrave: 1,
  flatten: 0.04,
  page: 1,
  studyReveal: 1e3,
  study: true,
  lamp: 1,
  shadow: 0,
};

/**
 * From the book to the 3D organs (stop "name" → "body"). The organs start as the engraved
 * drawing on the page, pressed flat onto it. As the camera leans in, a sweep "develops" them from
 * the top down into full colour and full depth; the paper and the room dissolve behind the sweep
 * and the lamp goes out, so the organs are left floating in the same dark space as the rest of the
 * exhibit. From the outlook to the summary the same happens backwards (see RETURN).
 */
export function hingeState(t: number) {
  if (t >= RETURN) return returnState(t);
  const f = Math.min(1, Math.max(0, t - HINGE));
  const before = t <= HINGE;
  const after = t >= HINGE + 1;
  if (before) return ON_THE_PAGE;
  // the sweep line, as a fraction of the organs' height (1.3 = above them all, −0.25 = below the page)
  const reveal = after ? -0.25 : 1.3 - 1.55 * smoothstep(0.28, 0.82, f);
  return {
    reveal,
    engrave: after || f >= 0.985 ? 0 : 1,
    flatten: after ? 1 : 0.04 + 0.96 * smoothstep(0.32, 0.88, f),
    /** paper left on the page (1 = all of it); it goes with the sweep */
    page: after ? 0 : 1,
    /**
     * The room's own sweep line (same units as `reveal`): it comes down from high above while the
     * camera leans in, reaches the top of the drawing as the page's sweep starts, then runs on ahead
     * of it, so the desk at the bottom of the view is gone before the organs settle.
     */
    studyReveal: after ? -1e3 : 4.3 - 3 * smoothstep(0, 0.28, f) - 4.3 * smoothstep(0.28, 0.95, f),
    /** the desk, the man and the lamp (they dissolve with the sweep, then are hidden) */
    study: !after,
    /** the lamp on the desk */
    lamp: 1 - smoothstep(HINGE + 0.12, HINGE + 0.5, t),
    /** the soft shadow under the organs */
    shadow: smoothstep(HINGE + 0.8, HINGE + 1, t),
  };
}

/**
 * The way back out (outlook → summary): the kidney comes back, the floor shadow goes, the organs
 * press back into the page from the bottom up while the paper returns with them, then the room
 * builds up again from the floor and the lamp comes back on.
 */
function returnState(t: number) {
  if (t >= RETURN + 1) return ON_THE_PAGE;
  const onPage = t > RETURN + 0.22;
  return {
    reveal: onPage ? -0.25 + 1.55 * back(t, 0.26, 0.5) : -0.25,
    engrave: onPage ? 1 : 0,
    flatten: 1 - 0.96 * back(t, 0.24, 0.48),
    page: onPage ? 1 : 0,
    // from below the whole room to above it (the room spans about −11 to +4.5 of these units)
    studyReveal: t > RETURN + 0.28 ? -12 + 18 * back(t, 0.28, 0.7) : -1e3,
    study: t > RETURN + 0.28,
    lamp: back(t, 0.4, 0.72),
    shadow: 1 - back(t, 0.16, 0.26),
  };
}
