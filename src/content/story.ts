/**
 * The whole exhibit is ONE continuous zoom. Scrolling moves a camera through these stops in order:
 * 1907 → Whipple → the case → the name → today's digestive system → small intestine → its wall →
 * villi → the bacterium (cause) → malabsorption (symptoms) → the whole body → diagnosis → treatment →
 * a quick check → sources.
 *
 * One idea per stop, kept short so a presenter can teach it in a sentence or two.
 *
 * Caption markup (ui/RichText.tsx):  {t:key|label} term · {c:1,2} source markers · *italics*
 */

export type StopId =
  | 'title'
  | 'doctor'
  | 'case'
  | 'name'
  | 'body'
  | 'intestine'
  | 'wall'
  | 'villi'
  | 'cause'
  | 'symptoms'
  | 'spread'
  | 'biopsy'
  | 'stain'
  | 'pcr'
  | 'treatment'
  | 'quiz'
  | 'end';

export type World = 'none' | 'anatomy' | 'tissue' | 'villi' | 'micro' | 'diagnosis';

/** A scene is what the camera is looking at; moving between scenes is a zoom "through" a surface. */
export type Scene = 'history' | 'anatomy' | 'tissue' | 'villi' | 'micro' | 'biopsy' | 'stain' | 'pcr';

export interface Stop {
  id: StopId;
  scene: Scene;
  world: World;
  /** Short label on the zoom rail (only some stops show one). */
  rail?: string;
  eyebrow: string;
  title: string;
  text: string;
  /** Optional second, smaller line (used for the source-list correction). */
  note?: string;
  hint?: string;
}

export const STOPS: Stop[] = [
  {
    id: 'title',
    scene: 'history',
    world: 'none',
    rail: '1907',
    eyebrow: 'Medical Terminology · Eponym #26',
    title: 'Whipple’s Disease',
    text: 'Scroll to zoom from a 1907 autopsy all the way down to the germ that causes it.',
  },
  {
    id: 'doctor',
    scene: 'history',
    world: 'none',
    eyebrow: '1907 · Johns Hopkins, Baltimore',
    title: 'George Hoyt Whipple',
    text: 'A young {t:pathology|pathologist} — a doctor who studies diseased tissue to find out what went wrong. {c:5,7}',
  },
  {
    id: 'case',
    scene: 'history',
    world: 'none',
    eyebrow: 'The case',
    title: 'A puzzling patient',
    text: 'A 36-year-old doctor had weight loss, fatty diarrhea and joint pain. At the autopsy, Whipple found villi packed with fat. {c:5}',
  },
  {
    id: 'name',
    scene: 'history',
    world: 'none',
    eyebrow: 'The name',
    title: 'Why “Whipple’s” disease?',
    text: 'He called it {t:lipodystrophy|intestinal lipodystrophy} and even saw “rod-shaped” germs. He described it first, so it carries his name. {c:5,6}',
    note: 'Correction: our class list says “Allen Whipple.” It is George Hoyt Whipple — Allen O. Whipple was a surgeon known for a pancreas operation. {c:6,8}',
  },
  {
    id: 'body',
    scene: 'anatomy',
    world: 'anatomy',
    rail: 'Body',
    eyebrow: 'Today · body system',
    title: 'The digestive system',
    text: 'Whipple’s disease is a rare bacterial infection of the digestive system. {c:1,2}',
    hint: 'Drag to turn the model · keep scrolling to zoom in',
  },
  {
    id: 'intestine',
    scene: 'anatomy',
    world: 'anatomy',
    rail: 'Organ',
    eyebrow: 'Definition',
    title: 'The small intestine',
    text: 'The infection damages the lining of the small intestine, so nutrients from food are not absorbed — {t:malabsorption}. {c:1,3}',
  },
  {
    id: 'wall',
    scene: 'tissue',
    world: 'tissue',
    rail: 'Wall',
    eyebrow: 'Zoom: the intestine wall',
    title: 'Layers and folds',
    text: 'Four layers. The inner lining, the mucosa, rises into circular folds. {c:17,11}',
  },
  {
    id: 'villi',
    scene: 'villi',
    world: 'villi',
    rail: 'Villi',
    eyebrow: 'Zoom: the lining',
    title: 'Villi',
    text: 'Tiny fingers, 0.5–1 mm tall, that absorb food. Each has blood vessels and a {t:lacteal} for fats. {c:11}',
  },
  {
    id: 'cause',
    scene: 'micro',
    world: 'micro',
    rail: 'Germ',
    eyebrow: 'Fact 1 · Cause',
    title: '*Tropheryma whipplei*',
    text: 'A rod-shaped bacterium. Immune cells called {t:macrophage|macrophages} fill up with it. {c:2,6}',
  },
  {
    id: 'symptoms',
    scene: 'villi',
    world: 'villi',
    eyebrow: 'Fact 2 · Symptoms',
    title: 'Nutrients get lost',
    text: 'Crowded villi flatten and cannot absorb food, causing diarrhea, belly pain and weight loss. {c:1,2,9}',
  },
  {
    id: 'spread',
    scene: 'anatomy',
    world: 'anatomy',
    rail: 'Whole body',
    eyebrow: 'Fact 2 · Symptoms',
    title: 'Beyond the gut',
    text: 'Joint pain ({t:arthralgia}) often comes first — sometimes years earlier. It can also reach the heart and brain. {c:1,2,3}',
  },
  {
    id: 'biopsy',
    scene: 'biopsy',
    world: 'diagnosis',
    rail: 'Diagnosis',
    eyebrow: 'Fact 3 · Diagnosis',
    title: 'A tiny sample',
    text: 'Through an {t:endoscopy|endoscope}, a doctor takes a {t:biopsy} of the small intestine. {c:2,14}',
  },
  {
    id: 'stain',
    scene: 'stain',
    world: 'diagnosis',
    eyebrow: 'Fact 3 · Diagnosis',
    title: 'Under the microscope',
    text: 'A {t:pas|PAS stain} makes the bacteria-filled macrophages stand out. {c:2,9}',
  },
  {
    id: 'pcr',
    scene: 'pcr',
    world: 'diagnosis',
    eyebrow: 'Fact 3 · Diagnosis',
    title: 'Finding its DNA',
    text: '{t:pcr|PCR} copies the bacterium’s DNA again and again, so even a trace can be detected. {c:10,2}',
  },
  {
    id: 'treatment',
    scene: 'villi',
    world: 'villi',
    rail: 'Treatment',
    eyebrow: 'Fact 4 · Treatment',
    title: 'Long-term antibiotics',
    text: 'About 2–4 weeks of IV antibiotics, then about a year of pills. It can come back, so follow-up matters. {c:1,2,3}',
  },
  {
    id: 'quiz',
    scene: 'anatomy',
    world: 'anatomy',
    rail: 'Check',
    eyebrow: 'Quick check',
    title: 'What do you remember?',
    text: '',
  },
  {
    id: 'end',
    scene: 'anatomy',
    world: 'anatomy',
    rail: 'Sources',
    eyebrow: 'Summary',
    title: 'Whipple’s disease',
    text: 'Named for George Hoyt Whipple (1907) · caused by *Tropheryma whipplei* · damages the small intestine · treated with long-term antibiotics.',
  },
];

export const STOP_INDEX = Object.fromEntries(STOPS.map((s, i) => [s.id, i])) as Record<StopId, number>;
export const LAST_STOP = STOPS.length - 1;

export type Backdrop = 'dark' | 'lab' | 'paper' | 'studio' | 'deep';
