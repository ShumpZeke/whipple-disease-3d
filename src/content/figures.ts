import type { StopId } from './story';

/*
 * Small infographic figures used throughout the exhibit.
 * Every number is tied to a source in citations.ts.
 */

export interface Stat {
  value: string;
  label: string;
  cites: number[];
}

export const HEADLINE: Stat[] = [
  { value: '600', label: 'children diagnosed each year in the U.S.', cites: [4] },
  { value: '5%', label: 'of childhood cancers', cites: [4] },
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

export const FIGURES: Partial<Record<StopId, Figure[]>> = {
  name: [
    {
      kind: 'meta',
      rows: [{ label: 'Name', value: 'Wilms tumor, also called nephroblastoma' }],
      cites: [1, 9],
    },
  ],
  body: [
    { kind: 'ages', title: 'Age at diagnosis', cites: [4, 8] },
    {
      kind: 'meta',
      rows: [
        { label: 'Body system', value: 'Urinary system' },
        { label: 'Specialty', value: 'Pediatric oncology' },
      ],
      cites: [1],
    },
  ],
  kidneys: [
    {
      kind: 'compare',
      title: 'What the kidneys do each day',
      rows: [
        { label: 'Blood filtered', value: 150, shown: 'about 150 quarts' },
        { label: 'Urine made', value: 1.5, shown: 'about 1 to 2 quarts' },
      ],
      cites: [12],
    },
  ],
  nephron: [{ kind: 'big', value: '≈1,000,000', label: 'nephrons in each kidney', cites: [12] }],
  lump: [
    {
      kind: 'stats',
      title: 'Both kidneys',
      items: [{ value: '5–10%', label: 'of children have tumors in both kidneys', cites: [3] }],
    },
  ],
  treatment: [
    {
      kind: 'meta',
      rows: [
        { label: 'Main treatment', value: 'Surgery + chemotherapy' },
        { label: 'Sometimes', value: 'Radiation therapy' },
      ],
      cites: [1, 7],
    },
  ],
  outlook: [{ kind: 'dots', title: 'Five-year survival', value: 93, label: 'out of 100 are alive 5 years later', cites: [2] }],
  end: [{ kind: 'stats', title: 'Wilms tumor in numbers', items: HEADLINE }],
};
