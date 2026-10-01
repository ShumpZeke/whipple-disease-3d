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
  body: [{ kind: 'ages', title: 'Usually found young', cites: [4, 8] }],
  genes: [{ kind: 'split', title: 'Most cases are not inherited', value: 90, a: 'Not inherited', b: 'Inherited', cites: [8] }],
  end: [{ kind: 'dots', title: 'Five-year survival', value: 93, label: 'out of 100 are alive 5 years later', cites: [2] }],
};
