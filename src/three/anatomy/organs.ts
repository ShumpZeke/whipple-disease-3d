export type OrganId = 'LeftKidney' | 'RightKidney' | 'Ureters' | 'Bladder' | 'Adrenals' | 'Arteries' | 'Veins';

export interface OrganLook {
  id: OrganId;
  name: string;
  /** Linear-ish sRGB base colour (natural anatomy, never saturated). */
  color: string;
  vein: string;
  veinStrength: number;
  roughness: number;
  clearcoat: number;
  sheen: number;
  sheenColor: string;
  bumpScale: number;
  bumpStrength: number;
  mottle: number;
}

const kidney = {
  color: '#8e3b2f',
  vein: '#5a1d1b',
  veinStrength: 0.22,
  roughness: 0.34,
  clearcoat: 0.75,
  sheen: 0.3,
  sheenColor: '#e0a08e',
  bumpScale: 24,
  bumpStrength: 0.0004,
  mottle: 0.12,
};

export const ORGANS: Record<OrganId, OrganLook> = {
  LeftKidney: { id: 'LeftKidney', name: 'left kidney', ...kidney },
  RightKidney: { id: 'RightKidney', name: 'right kidney', ...kidney },
  Ureters: {
    id: 'Ureters',
    name: 'ureters',
    color: '#d9b59c',
    vein: '#9a5a4a',
    veinStrength: 0.2,
    roughness: 0.45,
    clearcoat: 0.45,
    sheen: 0.4,
    sheenColor: '#f7dccb',
    bumpScale: 30,
    bumpStrength: 0.0003,
    mottle: 0.06,
  },
  Bladder: {
    id: 'Bladder',
    name: 'bladder',
    color: '#d8a18f',
    vein: '#8f3f42',
    veinStrength: 0.35,
    roughness: 0.42,
    clearcoat: 0.5,
    sheen: 0.45,
    sheenColor: '#ffd2c2',
    bumpScale: 26,
    bumpStrength: 0.0006,
    mottle: 0.08,
  },
  Adrenals: {
    id: 'Adrenals',
    name: 'adrenal glands',
    color: '#d9a55e',
    vein: '#9a6a3e',
    veinStrength: 0.12,
    roughness: 0.55,
    clearcoat: 0.3,
    sheen: 0.4,
    sheenColor: '#ffe3bd',
    bumpScale: 60,
    bumpStrength: 0.001,
    mottle: 0.14,
  },
  Arteries: {
    id: 'Arteries',
    name: 'aorta and renal arteries',
    color: '#b3352f',
    vein: '#7a1d1b',
    veinStrength: 0.1,
    roughness: 0.32,
    clearcoat: 0.7,
    sheen: 0.25,
    sheenColor: '#f0a090',
    bumpScale: 20,
    bumpStrength: 0.0002,
    mottle: 0.05,
  },
  Veins: {
    id: 'Veins',
    name: 'inferior vena cava',
    color: '#3f5a8c',
    vein: '#23345a',
    veinStrength: 0.1,
    roughness: 0.34,
    clearcoat: 0.65,
    sheen: 0.25,
    sheenColor: '#a8bde0',
    bumpScale: 20,
    bumpStrength: 0.0002,
    mottle: 0.05,
  },
};

export const ORGAN_IDS = Object.keys(ORGANS) as OrganId[];

export function isOrganId(v: string): v is OrganId {
  return v in ORGANS;
}

export const isKidney = (id: OrganId) => id === 'LeftKidney' || id === 'RightKidney';
