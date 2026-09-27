import type { OrganId } from '../three/anatomy/organs';

export type Question =
  | {
      id: string;
      kind: 'organ';
      prompt: string;
      answer: OrganId;
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
    prompt: 'On the model, select the organ Whipple’s disease damages most directly.',
    answer: 'SmallIntestine',
    correct: 'Yes — the small intestine, where villi absorb nutrients.',
    retry: 'That’s the {organ}. Look for the long, coiled tube in the middle.',
    cites: [1],
  },
  {
    id: 'cause',
    kind: 'choice',
    prompt: 'What causes Whipple’s disease?',
    options: [
      { text: 'A virus', why: 'Not a virus — it is a bacterium.' },
      { text: 'The bacterium Tropheryma whipplei', correct: true },
      { text: 'Eating too much fat', why: 'Fat builds up because it isn’t absorbed; diet is not the cause.' },
      { text: 'A vitamin deficiency', why: 'Deficiencies can result from it, but they are not the cause.' },
    ],
    correct: 'Correct — Tropheryma whipplei, a rod-shaped bacterium.',
    cites: [1, 6],
  },
  {
    id: 'malabsorption',
    kind: 'choice',
    prompt: 'What does “malabsorption” mean?',
    options: [
      { text: 'Trouble absorbing nutrients from food', correct: true },
      { text: 'An allergy to certain foods', why: 'An allergy is an immune reaction; malabsorption is about absorbing nutrients.' },
      { text: 'Eating too little food', why: 'The problem is absorbing food that is eaten.' },
    ],
    correct: 'Right — mal- means bad or abnormal, so: poor absorption of nutrients.',
    cites: [12, 13],
  },
  {
    id: 'who',
    kind: 'choice',
    prompt: 'Who first described this disease, in 1907?',
    options: [
      { text: 'Allen O. Whipple, a surgeon', why: 'He is the namesake of the Whipple procedure, a pancreas operation.' },
      { text: 'George Hoyt Whipple, a pathologist', correct: true },
    ],
    correct: 'Correct — George Hoyt Whipple. The class list’s “Allen Whipple” was a mix-up.',
    cites: [5, 6, 8],
  },
];
