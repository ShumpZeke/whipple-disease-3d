import type { StopId } from './story';

/*
 * The infographic's numbers. Every figure is copied from the source it cites (see citations.ts),
 * and the charts draw them as they are: nothing is estimated or smoothed.
 */

export interface Stat {
  value: string;
  label: string;
  cites: number[];
}

/** The three headline numbers on the home screen and the summary. */
export const HEADLINE: Stat[] = [
  { value: '600', label: 'children a year in the U.S.', cites: [4] },
  { value: '5%', label: 'of all childhood cancers', cites: [4] },
  { value: '93%', label: 'alive 5 years later', cites: [2] },
];

export type Figure =
  | { kind: 'stats'; title: string; items: Stat[] }
  | { kind: 'ages'; title: string; cites: number[] }
  | { kind: 'compare'; title: string; rows: { label: string; value: number; shown: string }[]; cites: number[] }
  | { kind: 'big'; value: string; label: string; cites: number[] }
  | { kind: 'split'; title: string; value: number; a: string; b: string; cites: number[] }
  | { kind: 'bars'; title: string; rows: { label: string; value: number }[]; cites: number[] }
  | { kind: 'dots'; title: string; value: number; label: string; cites: number[] }
  | { kind: 'meta'; rows: { label: string; value: string }[]; cites: number[] };

/** The figure shown under each stop's words (at most one per stop). */
export const FIGURES: Partial<Record<StopId, Figure[]>> = {
  name: [
    {
      kind: 'meta',
      rows: [{ label: 'Accuracy check', value: 'Spelled Wilms tumor, no apostrophe. Others described it first; his book made his name stick.' }],
      cites: [1, 3, 9],
    },
  ],
  body: [
    { kind: 'ages', title: 'Age when it is found', cites: [8, 4] },
    { kind: 'meta', rows: [{ label: 'Body system', value: 'Urinary' }, { label: 'Specialty', value: 'Pediatric oncology' }], cites: [1] },
  ],
  kidneys: [
    {
      kind: 'compare',
      title: 'Every day',
      rows: [
        { label: 'Blood filtered', value: 150, shown: '150 quarts' },
        { label: 'Urine made', value: 1.5, shown: '1 to 2 quarts' },
      ],
      cites: [12],
    },
  ],
  nephron: [{ kind: 'big', value: '1,000,000', label: 'filters in each kidney', cites: [12] }],
  genes: [{ kind: 'split', title: 'Is it inherited?', value: 90, a: 'Not inherited', b: 'Inherited', cites: [8] }],
  lump: [{ kind: 'stats', title: 'Where it grows', items: [{ value: '5 to 10%', label: 'have tumors in both kidneys', cites: [3] }] }],
  signs: [
    {
      kind: 'bars',
      title: 'Signs when it is found',
      rows: [
        { label: 'Belly pain', value: 40 },
        { label: 'High blood pressure', value: 25 },
        { label: 'Blood in urine, seen under a microscope', value: 24 },
        { label: 'Blood in urine you can see', value: 18 },
        { label: 'Fever or weight loss', value: 10 },
      ],
      cites: [2],
    },
  ],
  treatment: [
    {
      kind: 'meta',
      rows: [{ label: 'Care team', value: 'Pediatric oncologist, surgeon or urologist, radiation oncologist' }],
      cites: [1],
    },
  ],
  outlook: [{ kind: 'dots', title: 'Out of 100 children', value: 93, label: 'are alive 5 years later', cites: [2] }],
  end: [{ kind: 'stats', title: 'In numbers', items: HEADLINE }],
};
