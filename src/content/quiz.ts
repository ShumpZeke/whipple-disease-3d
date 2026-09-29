import type { OrganId } from '../three/anatomy/organs';

export type Question =
  | {
      id: string;
      kind: 'organ';
      prompt: string;
      /** Any of these organs counts as right. */
      answer: OrganId[];
      correct: string;
      /** Feedback when another organ is picked. {organ} is replaced with its name. */
      retry: string;
      cites: number[];
    }
  | {
      id: string;
      kind: 'choice';
      prompt: string;
      options: { text: string; correct?: boolean; why?: string }[];
      correct: string;
      cites: number[];
    };

export const QUESTIONS: Question[] = [
  {
    id: 'organ',
    kind: 'organ',
    prompt: 'Tap the organ where Wilms tumor grows.',
    answer: ['LeftKidney', 'RightKidney'],
    correct: 'Yes, the kidney.',
    retry: 'That’s the {organ}. Try the two bean-shaped organs.',
    cites: [1, 3],
  },
  {
    id: 'who',
    kind: 'choice',
    prompt: 'Who usually gets Wilms tumor?',
    options: [
      { text: 'Kids aged 2 to 5', correct: true },
      { text: 'Teenagers', why: 'It is much more common in younger kids.' },
      { text: 'Older adults', why: 'Adults very rarely get it.' },
    ],
    correct: 'Right, young kids.',
    cites: [1, 4],
  },
  {
    id: 'name',
    kind: 'choice',
    prompt: 'What does nephroblastoma mean?',
    options: [
      { text: 'A tumor of young kidney cells', correct: true },
      { text: 'A kidney stone', why: 'A kidney stone is not a tumor.' },
      { text: 'A bladder infection', why: 'Nephr means kidney, and oma means tumor.' },
    ],
    correct: 'Right. Nephr means kidney, blast means bud, oma means tumor.',
    cites: [15, 1],
  },
  {
    id: 'outlook',
    kind: 'choice',
    prompt: 'How many kids with Wilms tumor are cured today?',
    options: [
      { text: 'About 1 in 10', why: 'That was long ago, before modern treatment.' },
      { text: 'About half', why: 'It is much higher now.' },
      { text: 'About 9 in 10', correct: true },
    ],
    correct: 'Right, about 9 in 10.',
    cites: [2, 9],
  },
];
