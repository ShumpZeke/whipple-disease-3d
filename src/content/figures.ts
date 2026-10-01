import type { StopId } from './story';

/*
 * Small infographic figures used throughout the exhibit.
 * Each stop gets at most one visual, and every number is tied to a source in citations.ts.
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
  | { kind: 'donut'; title: string; value: number; label: string; remainder: string; cites: number[] }
  | { kind: 'people'; title: string; active: number; total: number; label: string; cites: number[] }
  | { kind: 'steps'; title: string; items: string[]; cites: number[] }
  | { kind: 'meta'; rows: { label: string; value: string }[]; cites: number[] };

export const FIGURES: Partial<Record<StopId, Figure[]>> = {
  body: [{ kind: 'ages', title: 'Age at diagnosis', cites: [4, 8] }],
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
  genes: [
    {
      kind: 'donut',
      title: 'Most cases are not inherited',
      value: 90,
      label: 'happen from gene changes that are not inherited',
      remainder: 'other cases',
      cites: [8],
    },
  ],
  lump: [
    {
      kind: 'people',
      title: 'Both kidneys',
      active: 1,
      total: 10,
      label: 'up to about 1 in 10 children have tumors in both kidneys',
      cites: [3],
    },
  ],
  treatment: [
    {
      kind: 'steps',
      title: 'Treatment path',
      items: ['Surgery', 'Chemotherapy', 'Sometimes radiation'],
      cites: [1, 7],
    },
  ],
  outlook: [
    {
      kind: 'people',
      title: 'Outlook',
      active: 9,
      total: 10,
      label: 'about 9 in 10 children survive',
      cites: [2, 9],
    },
  ],
  end: [{ kind: 'stats', title: 'Wilms tumor in numbers', items: HEADLINE }],
};
