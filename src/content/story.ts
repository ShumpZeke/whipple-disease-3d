/**
 * The story, in order. The storyboard order is part of the assignment design:
 * 1907 → Whipple → the case → the name → the correction → modern anatomy → small intestine →
 * facts → inside → villi → microscopic → mechanism → other systems → diagnosis → treatment → quiz → end.
 *
 * Caption markup (rendered by ui/RichText.tsx):
 *   {t:key}            glossary term button (label from the glossary)
 *   {t:key|shown text} glossary term with custom label
 *   {c:2,3}            source markers → reference list
 *   *text*             italics (species names)
 */

export type StepId =
  | 'intro'
  | 'whipple'
  | 'case'
  | 'naming'
  | 'correction'
  | 'modern'
  | 'overview'
  | 'focus'
  | 'facts'
  | 'inside'
  | 'villi'
  | 'micro'
  | 'mechanism'
  | 'systems'
  | 'diagnosis'
  | 'treatment'
  | 'quiz'
  | 'end';

export type World = 'none' | 'anatomy' | 'tissue' | 'villi' | 'micro' | 'diagnosis';
export type Backdrop = 'dark' | 'lab' | 'paper' | 'studio' | 'deep';

export interface Caption {
  eyebrow: string;
  title: string;
  body: string[];
  /** Optional one-line hint about how to interact. */
  hint?: string;
}

export interface Step {
  id: StepId;
  chapter: 'Opening' | 'History' | 'Anatomy' | 'Inside' | 'Disease' | 'Diagnosis & care' | 'Check' | 'End';
  label: string;
  world: World;
  backdrop: Backdrop;
  /** Caption for each sub-step (length = number of sub-steps). */
  captions: Caption[];
}

export const STEPS: Step[] = [
  {
    id: 'intro',
    chapter: 'Opening',
    label: '1907',
    world: 'none',
    backdrop: 'dark',
    captions: [
      {
        eyebrow: 'Medical Terminology · Eponym #26',
        title: 'Whipple’s Disease',
        body: ['A young pathologist, a puzzling autopsy, and a bacterium that hid for 85 years.'],
      },
    ],
  },
  {
    id: 'whipple',
    chapter: 'History',
    label: 'George Hoyt Whipple',
    world: 'none',
    backdrop: 'lab',
    captions: [
      {
        eyebrow: 'I · The doctor',
        title: 'George Hoyt Whipple',
        body: [
          'In 1907, Whipple (born 1878) was an instructor in {t:pathology} at Johns Hopkins in Baltimore — a doctor who studies diseased tissue to learn what went wrong. {c:5,7}',
        ],
        hint: 'Select the notes on the photograph.',
      },
    ],
  },
  {
    id: 'case',
    chapter: 'History',
    label: 'The 1907 case',
    world: 'none',
    backdrop: 'lab',
    captions: [
      {
        eyebrow: 'II · The case',
        title: 'A puzzling patient',
        body: [
          'In April 1907, a 36-year-old doctor who had worked as a missionary came to Johns Hopkins. For years he had lost weight and had fatty diarrhea, joint pain, and a cough. {c:5}',
          'He died weeks later. At the autopsy, Whipple found fat deposits in the lining of the intestine and in nearby lymph nodes. {c:5}',
        ],
        hint: 'Select the highlighted phrases in Whipple’s own 1907 report.',
      },
    ],
  },
  {
    id: 'naming',
    chapter: 'History',
    label: 'A name',
    world: 'none',
    backdrop: 'lab',
    captions: [
      {
        eyebrow: 'III · The name',
        title: '“Intestinal lipodystrophy”',
        body: [
          'Whipple wrote that no name would truly fit until the cause was known, so he suggested {t:lipodystrophy|intestinal lipodystrophy} — “abnormal fat in the intestine.” {c:5}',
          'He even saw “rod-shaped” organisms in the tissue, but no one could prove what they were until DNA methods identified the bacterium in 1992. {c:5,4}',
          'Because Whipple described it first, the condition became known as Whipple’s disease. {c:6}',
        ],
      },
    ],
  },
  {
    id: 'correction',
    chapter: 'History',
    label: 'Which Whipple?',
    world: 'none',
    backdrop: 'lab',
    captions: [
      {
        eyebrow: 'IV · Checking the source list',
        title: 'Which Whipple?',
        body: [
          'Our class eponym list names “Allen Whipple.” Reliable sources show the disease is named for George Hoyt Whipple. Allen O. Whipple was a different doctor — the surgeon behind the Whipple procedure. {c:6,8}',
        ],
      },
    ],
  },
  {
    id: 'modern',
    chapter: 'Anatomy',
    label: 'Today',
    world: 'anatomy',
    backdrop: 'studio',
    captions: [
      {
        eyebrow: 'V · Today',
        title: 'From 1907 to modern medicine',
        body: [
          'Today we know Whipple’s disease is a rare infection caused by a bacterium. It mainly damages the small intestine, in the digestive system. {c:1,2}',
        ],
      },
    ],
  },
  {
    id: 'overview',
    chapter: 'Anatomy',
    label: 'Digestive system',
    world: 'anatomy',
    backdrop: 'studio',
    captions: [
      {
        eyebrow: 'Body system',
        title: 'The digestive system',
        body: [
          'Whipple’s disease is classed as a gastrointestinal disorder — one of the malabsorption syndromes — so its body system is the digestive system and its specialty is gastroenterology. {c:2}',
        ],
        hint: 'Drag to rotate · scroll or pinch to zoom · select the small intestine.',
      },
    ],
  },
  {
    id: 'focus',
    chapter: 'Anatomy',
    label: 'Small intestine',
    world: 'anatomy',
    backdrop: 'studio',
    captions: [
      {
        eyebrow: 'Definition',
        title: 'What is Whipple’s disease?',
        body: [
          'A rare bacterial infection that damages the lining of the small intestine. The damaged lining can’t absorb nutrients well — {t:malabsorption}. The infection can also spread to other organs. {c:1,3}',
        ],
      },
    ],
  },
  {
    id: 'facts',
    chapter: 'Anatomy',
    label: 'Four clinical facts',
    world: 'anatomy',
    backdrop: 'studio',
    captions: [
      {
        eyebrow: 'Clinical fact 1 of 4 · Cause',
        title: 'A bacterium',
        body: [
          'The cause is a bacterium, *{t:tropheryma|Tropheryma whipplei}*. The disease is rare and most often affects middle-aged white men. {c:1,3}',
        ],
      },
      {
        eyebrow: 'Clinical fact 2 of 4 · Symptoms',
        title: 'Four main symptoms',
        body: [
          'Joint pain ({t:arthralgia}), diarrhea, belly pain, and weight loss. Joint pain often comes first — sometimes years before the gut symptoms. {c:1,2,3}',
        ],
      },
      {
        eyebrow: 'Clinical fact 3 of 4 · Diagnosis',
        title: 'A look at the lining',
        body: [
          'During an upper {t:endoscopy}, a doctor takes tiny samples ({t:biopsy|biopsies}) of the small intestine. A stain and a {t:pcr|PCR} DNA test can confirm the bacterium. {c:2,3}',
        ],
      },
      {
        eyebrow: 'Clinical fact 4 of 4 · Treatment & outlook',
        title: 'Curable, but it can return',
        body: [
          'Weeks of IV antibiotics, then about a year of antibiotic pills. Untreated, it is fatal; treatment can cure it, but relapses happen, so follow-up matters. {c:1,2,3}',
        ],
      },
    ],
  },
  {
    id: 'inside',
    chapter: 'Inside',
    label: 'Inside the wall',
    world: 'tissue',
    backdrop: 'deep',
    captions: [
      {
        eyebrow: 'Inside the small intestine',
        title: 'Layers and folds',
        body: [
          'From outside in, the wall has four layers: serosa, muscularis, submucosa, and the mucosa (the lining). The lining rises into ring-shaped circular folds. {c:17,11}',
        ],
        hint: 'Drag to look around the cutaway.',
      },
    ],
  },
  {
    id: 'villi',
    chapter: 'Inside',
    label: 'Villi',
    world: 'villi',
    backdrop: 'deep',
    captions: [
      {
        eyebrow: 'Closer: the lining',
        title: 'Villi',
        body: [
          'The lining is covered with {t:villi} — finger-like projections 0.5–1 mm long. Each has tiny blood vessels and a {t:lacteal}, a lymph vessel that absorbs fat. {c:11}',
        ],
      },
    ],
  },
  {
    id: 'micro',
    chapter: 'Disease',
    label: 'Tropheryma whipplei',
    world: 'micro',
    backdrop: 'deep',
    captions: [
      {
        eyebrow: 'Microscopic scale · Illustration, not to scale',
        title: '*Tropheryma whipplei*',
        body: [
          'A rod-shaped bacterium (say “tro-FER-ih-muh WIP-uh-lee-eye”). In Whipple’s disease, immune cells called {t:macrophage|macrophages} inside the villi fill up with it. {c:2,6}',
        ],
      },
    ],
  },
  {
    id: 'mechanism',
    chapter: 'Disease',
    label: 'Malabsorption',
    world: 'villi',
    backdrop: 'deep',
    captions: [
      {
        eyebrow: 'How it causes symptoms',
        title: 'Why nutrients get lost',
        body: [
          'Healthy villi pull nutrients into blood and lymph. In Whipple’s disease, macrophages crowd the villi, which become flattened, so less is absorbed. {c:11,2,9}',
          'The unabsorbed food and fat cause diarrhea and weight loss — {t:malabsorption}. {c:1,12}',
        ],
        hint: 'Compare healthy and infected villi.',
      },
    ],
  },
  {
    id: 'systems',
    chapter: 'Disease',
    label: 'Other organs',
    world: 'anatomy',
    backdrop: 'studio',
    captions: [
      {
        eyebrow: 'Beyond the gut',
        title: 'It can spread',
        body: ['The infection can also reach the joints, heart, brain, eyes, and lungs. {c:1,2}'],
      },
    ],
  },
  {
    id: 'diagnosis',
    chapter: 'Diagnosis & care',
    label: 'Diagnosis',
    world: 'diagnosis',
    backdrop: 'deep',
    captions: [
      {
        eyebrow: 'Diagnosis · 1 of 3 · Biopsy',
        title: 'A tiny sample',
        body: [
          'An {t:endoscopy|endoscope} is guided into the small intestine, and tiny forceps take {t:biopsy|biopsy} samples of the lining. {c:2,14}',
        ],
      },
      {
        eyebrow: 'Diagnosis · 2 of 3 · Microscope',
        title: 'Stained and examined',
        body: [
          'The sample is stained and examined under a microscope. A {t:pas|PAS stain} makes macrophages full of bacteria stand out. {c:2,9}',
        ],
      },
      {
        eyebrow: 'Diagnosis · 3 of 3 · PCR',
        title: 'Finding its DNA',
        body: [
          '{t:pcr|PCR} copies a small piece of DNA again and again, so even a little *T. whipplei* DNA can be detected. {c:10,2}',
        ],
      },
    ],
  },
  {
    id: 'treatment',
    chapter: 'Diagnosis & care',
    label: 'Treatment',
    world: 'villi',
    backdrop: 'deep',
    captions: [
      {
        eyebrow: 'Treatment & follow-up',
        title: 'Long-term antibiotics',
        body: [
          'Usually 2–4 weeks of IV antibiotics (such as ceftriaxone), then about a year or more of antibiotic pills (such as trimethoprim-sulfamethoxazole). {c:1,2,3}',
          'Treatment relieves symptoms and can cure the disease, but relapses can occur years later, so regular follow-up matters. {c:2,3}',
        ],
      },
    ],
  },
  {
    id: 'quiz',
    chapter: 'Check',
    label: 'Self-check',
    world: 'anatomy',
    backdrop: 'studio',
    captions: [
      {
        eyebrow: 'Quick self-check',
        title: 'What do you remember?',
        body: [],
      },
    ],
  },
  {
    id: 'end',
    chapter: 'End',
    label: 'Explore',
    world: 'anatomy',
    backdrop: 'studio',
    captions: [
      {
        eyebrow: 'Thank you',
        title: 'Explore freely',
        body: ['Rotate the model, select organs, revisit any chapter, or open the full reference list.'],
      },
    ],
  },
];

export const STEP_INDEX: Record<StepId, number> = Object.fromEntries(STEPS.map((s, i) => [s.id, i])) as Record<
  StepId,
  number
>;
