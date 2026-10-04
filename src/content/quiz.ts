/*
 * The quick check at the end: five multiple-choice questions, one try each, then the results.
 * Every answer comes from what the exhibit showed (and the sources it cites).
 */

export interface Question {
  id: string;
  /** A short name for the results screen. */
  topic: string;
  prompt: string;
  options: { text: string; correct?: boolean }[];
  cites: number[];
}

export const QUESTIONS: Question[] = [
  {
    id: 'where',
    topic: 'Where it starts',
    prompt: 'Where does Wilms tumor start?',
    options: [{ text: 'In a kidney', correct: true }, { text: 'In the bladder' }, { text: 'In the liver' }, { text: 'In the lungs' }],
    cites: [1, 3],
  },
  {
    id: 'who',
    topic: 'Who gets it',
    prompt: 'Who usually gets Wilms tumor?',
    options: [{ text: 'Older adults' }, { text: 'Teenagers' }, { text: 'Kids aged 2 to 5', correct: true }, { text: 'Only newborns' }],
    cites: [1, 4],
  },
  {
    id: 'name',
    topic: 'The medical name',
    prompt: 'What does nephroblastoma mean?',
    options: [{ text: 'A kidney stone' }, { text: 'A tumor of young kidney cells', correct: true }, { text: 'A bladder infection' }, { text: 'A broken rib' }],
    cites: [15, 1],
  },
  {
    id: 'test',
    topic: 'The first test',
    prompt: 'Which test usually comes first?',
    options: [{ text: 'An eye exam' }, { text: 'A hearing test' }, { text: 'An ultrasound', correct: true }, { text: 'A knee X-ray' }],
    cites: [6],
  },
  {
    id: 'outlook',
    topic: 'The outlook',
    prompt: 'How many children are alive five years later?',
    options: [{ text: 'About 13%' }, { text: 'About 43%' }, { text: 'About 63%' }, { text: 'About 93%', correct: true }],
    cites: [2],
  },
];

export const answerOf = (q: Question) => q.options.find((o) => o.correct)!.text;
