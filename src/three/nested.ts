import * as THREE from 'three';

/*
 * The scenes nest inside one another, like Powers of Ten: the study holds a book whose drawing
 * becomes the 3D urinary organs; the cut left kidney holds a tiny filter (nephron) in its outer
 * layer; next to that filter's tube sits a clump of young cells; one of those cells holds the DNA.
 * Each scene has its own units; these numbers say how big one scene is inside its parent.
 */

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const curve = (pts: THREE.Vector3[]) => new THREE.CatmullRomCurve3(pts, false, 'centripetal');

/* ------------------------------------------------------------------ the study (history) */

/**
 * The 3D organs start life as the drawing on the right-hand page of Max Wilms's book, which sits
 * on a slanted stand on his desk. Study units are metres. One unit of the organ scene is 0.1 m
 * on the page (the drawing is 17 cm tall); the page leans back 32° from upright.
 */
export const PAGE = {
  /** Centre of the drawing on the right-hand page, in the study. */
  center: v3(0.09, 0.93, -0.14),
  tilt: THREE.MathUtils.degToRad(32),
  scale: 0.1,
  /** The page plane sits just behind the organs (organ-scene units). */
  z: -0.23,
  /** Right page and left page extents in organ-scene units (x from the gutter). */
  gutter: -0.87,
  width: 1.74,
  bottom: -1.2,
  top: 1.25,
};

/** Centre of Max Wilms's head in the study (matches HEAD_C in scripts/build_study.py). */
export const WILMS_HEAD = v3(0, 1.315, 0.415);

/** study ← organ scene (the drawing's frame on the page). */
export function pageFrame() {
  const t = PAGE.tilt;
  const x = v3(1, 0, 0);
  const y = v3(0, Math.cos(t), -Math.sin(t));
  const z = v3(0, Math.sin(t), Math.cos(t));
  return new THREE.Matrix4().makeBasis(x, y, z).scale(v3(PAGE.scale, PAGE.scale, PAGE.scale)).setPosition(PAGE.center);
}

/* ------------------------------------------------------------------ one nephron */

/** Kidney units (its height is 2) per nephron unit: the filter is ~0.2 mm across. */
export const NEPHRON_SCALE = 2e-3;
/**
 * Direction from the sinus of the painted outer layer where the filter we zoom into sits: in the
 * lower pole, clear of the adrenal gland on top, the ureter on the inner side and the hinge of
 * the other half on the outer edge.
 */
export const NEPHRON_PHI = THREE.MathUtils.degToRad(-65);

export const G = v3(0, 0.3, 0);
export const R_CAPSULE = 0.95;
export const POLE_V = v3(-0.5, 0.85, 0.15).normalize(); // where the vessels enter
export const POLE_U = v3(0.62, -0.75, 0.2).normalize(); // where the tubule leaves
export const POLE = G.clone().addScaledVector(POLE_V, R_CAPSULE * 0.9);

/** The tubule leaving the capsule. */
export const TUBULE = curve([
  G.clone().addScaledVector(POLE_U, R_CAPSULE * 0.97),
  v3(0.95, -0.55, 0.3),
  v3(1.35, -0.4, 0.05),
  v3(1.62, -0.7, -0.25),
  v3(1.28, -0.95, 0),
  v3(1.05, -1.3, 0.25),
  v3(1.45, -1.62, 0.1),
  v3(1.78, -1.98, -0.15),
  v3(1.72, -2.9, -0.2),
]);
export const TUBULE_R = 0.16;
/** A small blood vessel wound around the tubule, taking back what the body still needs. */
export const CAPILLARY = curve([
  v3(0.7, -0.2, -0.35),
  v3(1.2, -0.15, -0.3),
  v3(1.72, -0.45, -0.5),
  v3(1.5, -0.95, -0.35),
  v3(1.02, -1.15, -0.2),
  v3(1.2, -1.6, -0.3),
  v3(1.95, -1.75, -0.45),
  v3(2.05, -2.9, -0.45),
]);
export const AFFERENT = curve([POLE.clone().add(v3(-1.3, 1.5, 0.1)), POLE.clone().add(v3(-0.55, 0.6, 0.05)), POLE.clone().add(v3(-0.08, 0.02, 0)), G.clone().add(v3(-0.1, 0.15, 0.05))]);
export const EFFERENT = curve([G.clone().add(v3(0.05, 0.2, -0.05)), POLE.clone().add(v3(0.1, 0.02, -0.02)), POLE.clone().add(v3(0.45, 0.65, -0.1)), POLE.clone().add(v3(0.9, 1.6, -0.2))]);

/** The stretch of tubule whose wall is built from cells (seen up close at "How it starts"). */
export const WALL = { from: 0.6, to: 0.76, rings: 12, around: 14 };

/* ------------------------------------------------------------------ young cells */

/** Nephron units per cell-scene unit. A young cell (radius 0.17) is about 1/5 of the tube's width. */
export const CLUMP_SCALE = 0.2;
const WALL_MID = TUBULE.getPointAt((WALL.from + WALL.to) / 2);
/** Centre of the clump of young cells, just beside the tube (nephron units). */
export const CLUMP_AT = WALL_MID.clone().add(v3(0.4, 0.2, 0.08));
/** Halfway between the tube and the clump: what the camera looks at for "How it starts". */
export const CAUSE_MID = WALL_MID.clone().lerp(CLUMP_AT, 0.5);

export const CELL_R = 0.17;
export const GENERATIONS = 6; // 1 → 64 cells
/** 64 places in a ball, filled from the middle outwards (so the clump grows as it divides). */
export const SLOTS = (() => {
  const shells: [number, number][] = [
    [0, 1],
    [0.32, 7],
    [0.58, 20],
    [0.82, 36],
  ];
  const out: THREE.Vector3[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (const [r, n] of shells) {
    for (let i = 0; i < n; i++) {
      const y = n === 1 ? 0 : 1 - (2 * (i + 0.5)) / n;
      const rr = Math.sqrt(1 - y * y);
      out.push(new THREE.Vector3(Math.cos(i * golden) * rr, y, Math.sin(i * golden) * rr).multiplyScalar(r));
    }
  }
  return out;
})();
/** Cell i is born from cell i − 2^⌊log2 i⌋, so every round each cell makes one more. */
export const PARENT = SLOTS.map((_, i) => (i === 0 ? 0 : i - 2 ** Math.floor(Math.log2(i))));
/** The cell nearest the viewer, whose nucleus the camera enters to find the DNA. */
export const FRONT = SLOTS.reduce((best, p, i) => (p.z > SLOTS[best].z ? i : best), 0);
export const NUCLEUS = 0.58; // nucleus radius as a fraction of the cell's

/* ------------------------------------------------------------------ DNA */

/** Cell-scene units per DNA unit: the helix (5.2 long) fits inside the nucleus. */
export const DNA_SCALE = 0.033;
export const DNA_TILT = new THREE.Euler(0.1, -0.2, -0.43);
