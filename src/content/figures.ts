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
