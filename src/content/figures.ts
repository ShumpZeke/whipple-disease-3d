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

/** The figure shown under a stop's words: only the closing one, 93 of 100 children. */
export const FIGURES: Partial<Record<StopId, Figure[]>> = {
  end: [{ kind: 'dots', title: 'Out of 100 children', value: 93, label: 'are alive 5 years later', cites: [2] }],
};
