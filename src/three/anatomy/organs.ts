export type OrganId =
  | 'Esophagus'
  | 'Stomach'
  | 'Liver'
  | 'Gallbladder'
  | 'Pancreas'
  | 'SmallIntestine'
  | 'LargeIntestine';

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

export const ORGANS: Record<OrganId, OrganLook> = {
  SmallIntestine: {
    id: 'SmallIntestine',
    name: 'small intestine',
    color: '#d99282',
    vein: '#8f2f38',
    veinStrength: 0.55,
    roughness: 0.46,
    clearcoat: 0.55,
    sheen: 0.55,
    sheenColor: '#ffc2b3',
    bumpScale: 38,
    bumpStrength: 0.0009,
    mottle: 0.09,
  },
  LargeIntestine: {
    id: 'LargeIntestine',
    name: 'large intestine',
    color: '#c99582',
    vein: '#8a3a3e',
    veinStrength: 0.35,
    roughness: 0.5,
    clearcoat: 0.45,
    sheen: 0.45,
    sheenColor: '#f7d0bf',
    bumpScale: 30,
    bumpStrength: 0.0008,
    mottle: 0.08,
  },
  Stomach: {
    id: 'Stomach',
    name: 'stomach',
    color: '#d39a88',
    vein: '#8c3440',
    veinStrength: 0.4,
    roughness: 0.44,
    clearcoat: 0.5,
    sheen: 0.45,
    sheenColor: '#ffcdbd',
    bumpScale: 26,
    bumpStrength: 0.0007,
    mottle: 0.08,
  },
  Liver: {
    id: 'Liver',
    name: 'liver',
    color: '#7d3129',
    vein: '#4a1717',
    veinStrength: 0.12,
    roughness: 0.32,
    clearcoat: 0.8,
    sheen: 0.25,
    sheenColor: '#d88d7a',
    bumpScale: 22,
    bumpStrength: 0.00035,
    mottle: 0.12,
  },
  Gallbladder: {
    id: 'Gallbladder',
    name: 'gallbladder',
    color: '#6f8141',
    vein: '#3e4d22',
    veinStrength: 0.15,
    roughness: 0.3,
    clearcoat: 0.8,
    sheen: 0.2,
    sheenColor: '#c9d69b',
    bumpScale: 20,
    bumpStrength: 0.0004,
    mottle: 0.08,
  },
  Pancreas: {
    id: 'Pancreas',
    name: 'pancreas',
    color: '#dcb27e',
    vein: '#9a6a3e',
    veinStrength: 0.1,
    roughness: 0.55,
    clearcoat: 0.3,
    sheen: 0.4,
    sheenColor: '#ffe3bd',
    bumpScale: 70,
    bumpStrength: 0.0014,
    mottle: 0.14,
  },
  Esophagus: {
    id: 'Esophagus',
    name: 'esophagus',
    color: '#c98a80',
    vein: '#86343b',
    veinStrength: 0.25,
    roughness: 0.48,
    clearcoat: 0.45,
    sheen: 0.4,
    sheenColor: '#f9c6b9',
    bumpScale: 30,
    bumpStrength: 0.0006,
    mottle: 0.07,
  },
};

export const ORGAN_IDS = Object.keys(ORGANS) as OrganId[];

export function isOrganId(v: string): v is OrganId {
  return v in ORGANS;
}
