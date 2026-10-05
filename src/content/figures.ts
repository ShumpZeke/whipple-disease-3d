import type { StopId } from './story';

/*
 * The key facts of each stop. Every stop the talk pauses at shows the same thing under its
 * headline: three facts, each one a big figure (a number or one word) over a short label. They are
 * what a viewer should take in at a glance; the sentences beside them explain. The summary shows
 * one number instead, drawn as 100 dots. Every fact is copied from the source it cites.
 */

export interface Fact {
  value: string;
  label: string;
  cites: number[];
}

export type Figure = { kind: 'facts'; items: [Fact, Fact, Fact] } | { kind: 'dots'; value: number; label: string; cites: number[] };

export const FIGURES: Partial<Record<StopId, Figure>> = {
  doctor: {
    kind: 'facts',
    items: [
      { value: '1867', label: 'born in Germany', cites: [10] },
      { value: '1899', label: 'his study of the tumor', cites: [9] },
      { value: '1918', label: 'died in World War I', cites: [9] },
    ],
  },
  name: {
    kind: 'facts',
    items: [
      { value: 'nephro', label: 'kidney', cites: [15] },
      { value: 'blast', label: 'young cell', cites: [15] },
      { value: 'oma', label: 'tumor', cites: [15] },
    ],
  },
  body: {
    kind: 'facts',
    items: [
      { value: '2 to 5', label: 'years old, most often', cites: [1, 4] },
      { value: '600', label: 'children a year in the U.S.', cites: [4] },
      { value: '5%', label: 'of childhood cancers', cites: [4] },
    ],
  },
  treatment: {
    kind: 'facts',
    items: [
      { value: 'Surgery', label: 'removes the kidney', cites: [1] },
      { value: 'Chemo', label: 'before or after surgery', cites: [1] },
      { value: 'Radiation', label: 'for some children', cites: [1] },
    ],
  },
  end: { kind: 'dots', value: 93, label: 'of 100 children are alive five years later', cites: [2] },
};

/** Every source a stop's facts rest on (its sentences carry these numbers on screen). */
export const figureCites = (f: Figure) => (f.kind === 'facts' ? f.items.flatMap((i) => i.cites) : f.cites);
