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
    prompt: 'On the model, tap the organ where Wilms tumor grows.',
    answer: ['LeftKidney', 'RightKidney'],
    correct: 'Yes, a kidney. Most of the time only one kidney has a tumor.',
    retry: 'That’s the {organ}. Look for the two bean-shaped organs near the top.',
    cites: [1, 3],
  },
  {
    id: 'who',
    kind: 'choice',
    prompt: 'Who usually gets Wilms tumor?',
    options: [
      { text: 'Young children, most often between 2 and 5', correct: true },
      { text: 'Teenagers', why: 'It is much more common in younger children.' },
      { text: 'Older adults', why: 'Adults very rarely get it. It is a childhood cancer.' },
    ],
    correct: 'Right. Most children are between 2 and 5 when it is found.',
    cites: [1, 4],
  },
  {
    id: 'name',
    kind: 'choice',
    prompt: 'What does nephroblastoma mean?',
    options: [
      { text: 'A tumor of young kidney cells', correct: true },
      { text: 'A kidney stone', why: 'A kidney stone is a hard lump of minerals, not a tumor.' },
      { text: 'An infection of the bladder', why: 'Nephr means kidney, and oma means tumor.' },
    ],
    correct: 'Right. Nephr means kidney, blast means bud and oma means tumor.',
    cites: [15, 1],
  },
  {
    id: 'outlook',
    kind: 'choice',
    prompt: 'Today, about how many children with Wilms tumor are cured?',
    options: [
      { text: 'About 1 in 10', why: 'That was closer to the numbers before modern treatment.' },
      { text: 'About half' , why: 'That was around the 1950s. It is much higher now.' },
      { text: 'About 9 in 10', correct: true },
    ],
    correct: 'Right. About 9 in 10 children are alive five years later.',
    cites: [2, 9],
  },
];
