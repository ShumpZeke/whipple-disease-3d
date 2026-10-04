import type { StopId } from './story';

/*
 * Keep the infographic layer selective. The 3D scene should do most of the teaching; charts appear
 * only when a number or proportion is clearer visually than in another sentence.
 */

export interface Stat {
  value: string;
  label: string;
  cites: number[];
}

export type Figure =
  | { kind: 'stats'; title: string; items: Stat[] }
  | { kind: 'ages'; title: string; cites: number[] }
  | { kind: 'compare'; title: string; rows: { label: string; value: number; shown: string }[]; cites: number[] }
  | { kind: 'big'; value: string; label: string; cites: number[] }
  | { kind: 'split'; title: string; value: number; a: string; b: string; cites: number[] }
  | { kind: 'bars'; title: string; rows: { label: string; value: number }[]; cites: number[] }
  | { kind: 'dots'; title: string; value: number; label: string; cites: number[] }
  | { kind: 'meta'; rows: { label: string; value: string }[]; cites: number[] };

export const FIGURES: Partial<Record<StopId, Figure[]>> = {
  body: [
    {
      kind: 'stats',
      title: 'Who gets it',
      items: [
        { value: '2 to 5', label: 'years old, most often', cites: [1, 4] },
        { value: '600', label: 'children a year in the U.S.', cites: [4] },
        { value: '5%', label: 'of childhood cancers', cites: [4] },
      ],
    },
  ],
  genes: [
    {
      kind: 'stats',
      title: 'Most do not run in families',
      items: [
        { value: '9 in 10', label: 'gene change only in tumor cells', cites: [8] },
        { value: '1 in 10', label: 'gene change in every cell', cites: [8] },
        { value: 'WT1', label: 'a gene often changed', cites: [8] },
      ],
    },
  ],
  lump: [
    {
      kind: 'stats',
      title: 'Signs',
      items: [
        { value: 'Lump', label: 'in the belly, no pain', cites: [5] },
        { value: 'Blood', label: 'in the urine', cites: [1] },
        { value: 'Fever', label: 'or high blood pressure', cites: [5, 1] },
      ],
    },
  ],
  ultrasound: [
    {
      kind: 'stats',
      title: 'Tests, in order',
      items: [
        { value: '1', label: 'Ultrasound', cites: [6] },
        { value: '2', label: 'CT scan or MRI', cites: [6] },
        { value: '3', label: 'Tumor checked under a microscope', cites: [6] },
      ],
    },
  ],
  treatment: [
    {
      kind: 'stats',
      title: 'Nephr = kidney, ectomy = removal',
      items: [
        { value: 'Surgery', label: 'a nephrectomy', cites: [1, 15] },
        { value: 'Chemo', label: 'before or after surgery', cites: [1] },
        { value: 'Radiation', label: 'for some children', cites: [1] },
      ],
    },
  ],
  end: [{ kind: 'dots', title: 'Five-year survival', value: 93, label: 'out of 100 children are alive 5 years later', cites: [2] }],
};
