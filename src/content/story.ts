/**
 * The whole exhibit is ONE continuous zoom. Scrolling moves a camera through these stops in order:
 * home → Whipple → the case → the name → the disease (definition) → small intestine → its wall →
 * villi → the bacterium (cause) → malabsorption (symptoms) → the whole body → diagnosis → treatment →
 * a quick check → summary (then the list of sources).
 *
 * Written to be presented, not read: a short label for the part of the story, a headline of a few
 * words, one short line, and at most one key term. `say` is the presenter's line for that stop
 * (on the printable presenter guide, not on the big screen); `demo` is what to tap there.
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

/** The part of the story a stop belongs to; each has its own colour and icon. */
export type Category = 'intro' | 'history' | 'disease' | 'cause' | 'symptoms' | 'diagnosis' | 'treatment' | 'check' | 'summary';

export interface Stop {
  id: StopId;
  scene: Scene;
  world: World;
  cat: Category;
  /** Section name on the zoom rail (on the first stop of each part). */
  rail?: string;
  eyebrow: string;
  title: string;
  text: string;
  /** Glossary key shown as this stop's "key term" (word parts + meaning). */
  term?: string;
  /** Heading for the key-term box when it isn't simply "Key term". */
  termLabel?: string;
  /** Optional second, smaller line (used for the class-list correction). */
  note?: string;
  /** What the presenter taps here to show an interactive feature (presenter guide only). */
  demo?: string;
  /** Presenter script: what to say out loud at this stop. */
  say: string;
}

export const STOPS: Stop[] = [
  {
    id: 'title',
    scene: 'history',
    world: 'none',
    cat: 'intro',
    rail: 'Home',
    eyebrow: 'Medical Terminology · Eponym #26',
    title: 'Whipple’s Disease',
    text: 'A rare bacterial infection that damages the small intestine, so the body can’t absorb food. {c:1,2}',
    demo: 'Point to “What’s inside” to show the five parts, then tap Start',
    say: 'My eponym is Whipple’s disease — a medical term named after a person. It’s one zooming page in five parts: the history, the disease, four facts, a quick check, and my sources.',
  },
  {
    id: 'doctor',
    scene: 'history',
    world: 'none',
    cat: 'history',
    rail: 'History',
    eyebrow: 'History',
    title: 'Dr. George Hoyt Whipple',
    text: 'The disease is named after him. He was a pathologist: a doctor who studies diseased tissue. {c:5,7}',
    term: 'pathology',
    demo: 'Tap the word “Pathology” to show its pop-up definition',
    say: 'It’s named after Dr. George Hoyt Whipple. He was a pathologist — “path” means disease and “-ology” means study of — and in 1934 he won a Nobel Prize.',
  },
  {
    id: 'case',
    scene: 'history',
    world: 'none',
    cat: 'history',
    eyebrow: 'History',
    title: 'The first case, 1907',
    text: 'A 36-year-old doctor had weight loss, diarrhea and joint pain. At his autopsy, the intestine was packed with fat. {c:5}',
    demo: 'Tap a highlighted phrase in the 1907 article to see what it means today',
    say: 'In 1907 Whipple studied a 36-year-old doctor who was losing weight and had diarrhea and joint pain. At the autopsy, his intestine was full of fat.',
  },
  {
    id: 'name',
    scene: 'history',
    world: 'none',
    cat: 'history',
    eyebrow: 'History',
    title: 'Why his name?',
    text: 'He described it first, in 1907, so it carries his name. That makes it an eponym. {c:5,6}',
    term: 'lipodystrophy',
    termLabel: 'His 1907 name for it',
    note: 'Correction: our class list says “Allen Whipple.” It is George Hoyt Whipple. Allen O. Whipple was a different doctor, a surgeon. {c:6,8}',
    say: 'He described it first, so it carries his name. He called it intestinal lipodystrophy — abnormal fat. Our class list says Allen Whipple, but that’s a different doctor, a surgeon.',
  },
  {
    id: 'body',
    scene: 'anatomy',
    world: 'anatomy',
    cat: 'disease',
    rail: 'The disease',
    eyebrow: 'The disease',
    title: 'What is Whipple’s disease?',
    text: 'A rare bacterial infection that damages the small intestine, so food isn’t absorbed. {c:1,2,3}',
    demo: 'Drag the model to turn it, then tap ＋ on the small intestine',
    say: 'In my own words: it’s a rare bacterial infection that damages the small intestine, so the body can’t absorb food. It belongs to the digestive system.',
  },
  {
    id: 'intestine',
    scene: 'anatomy',
    world: 'anatomy',
    cat: 'disease',
    eyebrow: 'The disease',
    title: 'The small intestine',
    text: 'This is where food is absorbed. The infection damages its lining. {c:1,3}',
    term: 'malabsorption',
    say: 'The small intestine is where food gets absorbed. The infection damages its lining — that’s malabsorption. “Mal” means bad.',
  },
  {
    id: 'wall',
    scene: 'tissue',
    world: 'tissue',
    cat: 'disease',
    eyebrow: 'The disease',
    title: 'Inside the wall',
    text: 'Four layers. The inner lining, the mucosa, is folded to give it more surface. {c:17,11}',
    say: 'Zooming into the wall: it has four layers, and the inner lining, the mucosa, is folded to make more surface.',
  },
  {
    id: 'villi',
    scene: 'villi',
    world: 'villi',
    cat: 'disease',
    eyebrow: 'The disease',
    title: 'Villi',
    text: 'Tiny fingers, 0.5–1 mm tall, that soak up food. Each has blood vessels and a {t:lacteal} inside. {c:11}',
    term: 'villi',
    say: 'The lining is covered in villi — tiny fingers that soak up food. This is exactly where the disease does its damage.',
  },
  {
    id: 'cause',
    scene: 'micro',
    world: 'micro',
    cat: 'cause',
    rail: '4 facts',
    eyebrow: 'Fact 1 · Cause',
    title: '*Tropheryma whipplei*',
    text: 'A rod-shaped bacterium. Immune cells called macrophages fill up with it. {c:1,2,6}',
    term: 'macrophage',
    say: 'Fact one, the cause: a rod-shaped bacterium called Tropheryma whipplei. Immune cells called macrophages — “big eaters” — fill up with it.',
  },
  {
    id: 'symptoms',
    scene: 'villi',
    world: 'villi',
    cat: 'symptoms',
    eyebrow: 'Fact 2 · Symptoms',
    title: 'Food isn’t absorbed',
    text: 'Damaged villi flatten, so food passes straight through: diarrhea, weight loss, belly pain. {c:1,2,9}',
    demo: 'Tap “Healthy villi”, then “Whipple’s disease”, to compare',
    say: 'Fact two, symptoms: the villi flatten, so food passes straight through. That causes diarrhea, weight loss and belly pain.',
  },
  {
    id: 'spread',
    scene: 'anatomy',
    world: 'anatomy',
    cat: 'symptoms',
    eyebrow: 'Fact 2 · Symptoms',
    title: 'Beyond the gut',
    text: 'Joint pain often comes first, sometimes years earlier. It can also reach the heart and brain. {c:1,2,3}',
    term: 'arthralgia',
    say: 'Joint pain — arthralgia — is often the very first symptom, sometimes years before the stomach problems. It can also reach the heart and brain.',
  },
  {
    id: 'biopsy',
    scene: 'biopsy',
    world: 'diagnosis',
    cat: 'diagnosis',
    eyebrow: 'Fact 3 · Diagnosis',
    title: 'Step 1: take a sample',
    text: 'An {t:endoscopy|endoscope}, a thin tube with a camera, takes a tiny piece of the small intestine. {c:2,14}',
    term: 'biopsy',
    demo: 'Tap a small source number like [2] to show where the fact comes from',
    say: 'Fact three, diagnosis. Step one: an endoscope — a thin tube with a camera — takes a biopsy, a tiny sample of the small intestine.',
  },
  {
    id: 'stain',
    scene: 'stain',
    world: 'diagnosis',
    cat: 'diagnosis',
    eyebrow: 'Fact 3 · Diagnosis',
    title: 'Step 2: stain it',
    text: 'A PAS stain turns the germ-filled macrophages bright magenta. {c:2,9}',
    term: 'pas',
    say: 'Step two: a PAS stain makes the germ-filled cells bright magenta under the microscope.',
  },
  {
    id: 'pcr',
    scene: 'pcr',
    world: 'diagnosis',
    cat: 'diagnosis',
    eyebrow: 'Fact 3 · Diagnosis',
    title: 'Step 3: find its DNA',
    text: 'PCR copies the germ’s DNA again and again, so even a trace shows up. {c:10,2}',
    term: 'pcr',
    say: 'Step three: PCR copies the germ’s DNA — one, two, four, eight, sixteen — so even a tiny trace can be found.',
  },
  {
    id: 'treatment',
    scene: 'villi',
    world: 'villi',
    cat: 'treatment',
    eyebrow: 'Fact 4 · Treatment',
    title: 'Long-term antibiotics',
    text: 'About 2–4 weeks of IV antibiotics, then about a year of pills. Untreated, it can be fatal. {c:1,2,3}',
    say: 'Fact four, treatment: about two to four weeks of IV antibiotics, then about a year of pills. Without treatment it can be fatal, and it can come back.',
  },
  {
    id: 'quiz',
    scene: 'anatomy',
    world: 'anatomy',
    cat: 'check',
    rail: 'Quick check',
    eyebrow: 'Quick check',
    title: 'What do you remember?',
    text: '',
    demo: 'Ask the class; let a classmate tap the answer on the board',
    say: 'Quick check! I’ll read each question and someone can come up and tap the answer.',
  },
  {
    id: 'end',
    scene: 'anatomy',
    world: 'anatomy',
    cat: 'summary',
    rail: 'Summary',
    eyebrow: 'Summary',
    title: 'The 4 facts',
    text: 'Named after George Hoyt Whipple, who described it first in 1907. {c:5,6}',
    demo: 'Tap “Sources” to show the reference list',
    say: 'So: a bacterium causes it, it stops food being absorbed, a biopsy, a stain and PCR find it, and a year of antibiotics treats it. My sources are listed at the end.',
  },
];

export const STOP_INDEX = Object.fromEntries(STOPS.map((s, i) => [s.id, i])) as Record<StopId, number>;
export const LAST_STOP = STOPS.length - 1;
/** Scrolling one screen past the last stop reaches the list of sources. */
export const SOURCES_PAGE = LAST_STOP + 1;

/** The home screen's “What's inside” menu: the five parts of the exhibit. */
export const SECTIONS: { title: string; sub: string; stop: number; cat: Category }[] = [
  { title: 'History', sub: 'Who Whipple was and the first case (1907)', stop: STOP_INDEX.doctor, cat: 'history' },
  { title: 'The disease', sub: 'Definition, body system, the small intestine', stop: STOP_INDEX.body, cat: 'disease' },
  { title: 'Four facts', sub: 'Cause · symptoms · diagnosis · treatment', stop: STOP_INDEX.cause, cat: 'cause' },
  { title: 'Quick check', sub: 'Four questions for the class', stop: STOP_INDEX.quiz, cat: 'check' },
  { title: 'Sources', sub: 'References, medical terms and credits', stop: SOURCES_PAGE, cat: 'summary' },
];

/** The four facts, for the summary and the presenter guide. */
export const FACTS: { label: string; cat: Category; text: string; cites: number[] }[] = [
  { label: 'Cause', cat: 'cause', text: 'the bacterium *Tropheryma whipplei*', cites: [1, 2] },
  { label: 'Symptoms', cat: 'symptoms', text: 'diarrhea, weight loss, belly pain, joint pain', cites: [1, 3] },
  { label: 'Diagnosis', cat: 'diagnosis', text: 'biopsy, PAS stain and PCR', cites: [2, 3] },
  { label: 'Treatment', cat: 'treatment', text: 'about a year of antibiotics', cites: [1, 2] },
];

/** Likely questions from the class, answered only from the sources (presenter guide). */
export const QA: { q: string; a: string; cites: number[] }[] = [
  { q: 'Who gets it?', a: 'It is rare. It most often affects middle-aged white men.', cites: [3, 1] },
  { q: 'Can it be cured?', a: 'Yes, with long-term antibiotics — but it can come back, so doctors keep checking.', cites: [1, 3] },
  { q: 'What happens without treatment?', a: 'It keeps getting worse and can be fatal.', cites: [1, 3] },
  { q: 'How do people catch it?', a: 'My sources don’t say how people catch it — only that the bacterium Tropheryma whipplei causes it.', cites: [1] },
  { q: 'When was the germ found?', a: 'Whipple saw rod-shaped germs in 1907, but the bacterium was only identified in 1992.', cites: [5, 4] },
  { q: 'What does “Tropheryma” mean?', a: 'Greek for “nourishment barrier” — because it blocks absorbing food.', cites: [6] },
  { q: 'Is it the same as the Whipple procedure?', a: 'No. That pancreas operation is named after a different doctor, the surgeon Allen O. Whipple.', cites: [8, 15] },
];

export type Backdrop = 'dark' | 'lab' | 'paper' | 'studio' | 'deep';
