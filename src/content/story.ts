/**
 * The whole exhibit is ONE continuous zoom. Scrolling moves a camera through these stops in order:
 * home → Max Wilms → his 1899 book → the name → the disease → the kidneys → inside a kidney →
 * a nephron → young cells → genes → the lump → other signs → ultrasound → CT → treatment →
 * outlook → summary → a quick check (then the list of sources). It starts and ends at Max Wilms's
 * desk: the camera goes into the drawing in his book, and at the end comes back out of it.
 *
 * On screen each stop is just a short heading and a few plain sentences, the way you would explain
 * it to a friend. `say` is the presenter's line for that stop and `demo` what to tap there; both
 * live in the printable presenter guide, not on the big screen.
 *
 * Caption markup (ui/RichText.tsx): {t:key|label} term, {c:1,2} source numbers, *italics*
 */

export type StopId =
  | 'title'
  | 'doctor'
  | 'book'
  | 'name'
  | 'body'
  | 'kidneys'
  | 'inside'
  | 'nephron'
  | 'cause'
  | 'genes'
  | 'lump'
  | 'signs'
  | 'ultrasound'
  | 'scans'
  | 'treatment'
  | 'outlook'
  | 'quiz'
  | 'end';

export type World = 'none' | 'anatomy' | 'kidney' | 'nephron' | 'cells' | 'diagnosis';

/** A scene is what the camera is looking at; moving between scenes is a zoom "through" a surface. */
export type Scene = 'history' | 'anatomy' | 'kidney' | 'nephron' | 'cells' | 'dna' | 'ultrasound' | 'ct';

export interface Stop {
  id: StopId;
  scene: Scene;
  world: World;
  /** The part of the story (presenter guide only). */
  eyebrow: string;
  title: string;
  text: string;
  /** The medical term this stop teaches (presenter guide: pronunciation and word parts). */
  term?: string;
  /** Heading for that term in the guide when it isn't simply "Key term". */
  termLabel?: string;
  /** A second, smaller line on screen. */
  note?: string;
  /** What the presenter taps here to show an interactive feature. */
  demo?: string;
  /** What to say out loud at this stop. */
  say: string;
  /**
   * The camera flies through this stop without stopping: no words on screen, and the clicker,
   * keyboard and swipes skip it (the talk pauses only at the other stops).
   */
  pass?: true;
}

export const STOPS: Stop[] = [
  {
    id: 'title',
    scene: 'history',
    world: 'none',
    eyebrow: 'Home',
    title: 'Wilms Tumor',
    text: 'A kidney cancer in young children. Its medical name is nephroblastoma. {c:1,3}',
    demo: 'Point to the list of parts along the bottom, then scroll down',
    say: 'Our eponym is Wilms tumor, a kidney cancer in young children. It is also called nephroblastoma.',
  },
  {
    id: 'doctor',
    scene: 'history',
    world: 'none',
    eyebrow: 'History',
    title: 'Dr. Max Wilms',
    text: 'A German surgeon who lived from 1867 to 1918. The tumor is named after him. {c:9,10}',
    demo: 'Tap a small source number to show where a fact comes from',
    say: 'It is named after Max Wilms, a German surgeon who lived from 1867 to 1918.',
  },
  {
    id: 'book',
    pass: true,
    scene: 'history',
    world: 'none',
    eyebrow: 'History',
    title: 'His 1899 book',
    text: 'In 1899 he wrote The Mixed Tumors of the Kidney. {c:9,11}',
    say: 'In 1899, when he was only 32, he published a book called The Mixed Tumors of the Kidney. It was about tumors like this one, and it showed he really understood how the kidney forms before a baby is born.',
  },
  {
    id: 'name',
    scene: 'history',
    world: 'none',
    eyebrow: 'History',
    title: 'Why it has his name',
    text: 'His book made the tumor known, so it carries his name. The medical name is {t:nephroblastoma}. {c:9,1}',
    term: 'nephroblastoma',
    termLabel: 'Its medical name',
    note: 'Nephr means kidney, blast means bud, oma means tumor. {c:15}',
    demo: 'Scroll slowly from here: the drawing in his book turns into the 3D model',
    say: 'In 1899 he wrote a book about this tumor, so it carries his name. Nephroblastoma means a tumor of young kidney cells.',
  },
  {
    id: 'body',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'The disease',
    title: 'What is Wilms tumor?',
    text: 'A cancer that starts in a kidney, part of the urinary system. It is the most common kidney cancer in kids. {c:1,3}',
    demo: 'Drag the model to turn it, then tap the + on the kidney',
    say: 'It starts in a kidney, part of the urinary system. It is the most common kidney cancer in kids.',
  },
  {
    id: 'kidneys',
    pass: true,
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'The disease',
    title: 'The kidneys',
    text: 'Two bean-shaped organs that clean the blood and make urine. {c:12}',
    term: 'kidney',
    say: 'These are the kidneys. They are about the size of a fist and sit below the ribs on either side of the spine. As the chart shows, every day they filter about 150 quarts of blood, and only 1 to 2 quarts of it becomes urine.',
  },
  {
    id: 'inside',
    pass: true,
    scene: 'kidney',
    world: 'kidney',
    eyebrow: 'The disease',
    title: 'Inside a kidney',
    text: 'The outside is the cortex. The inside is the medulla. Urine drains down the {t:ureter} to the bladder. {c:14,12}',
    term: 'ureter',
    say: 'If we cut a kidney open, the outside layer is the cortex and the inside is the medulla. Urine gathers in the middle and flows down the ureter to the bladder.',
  },
  {
    id: 'nephron',
    pass: true,
    scene: 'nephron',
    world: 'nephron',
    eyebrow: 'The disease',
    title: 'Tiny filters',
    text: 'Each kidney has about a million tiny filters called {t:nephron|nephrons}. The {t:glomerulus} does the filtering. {c:12}',
    term: 'nephron',
    demo: 'Tap the underlined word glomerulus',
    say: 'Each kidney has about a million tiny filters called nephrons. The glomerulus is the little ball of blood vessels that does the filtering, and the tube after it takes back the water and nutrients the body still needs.',
  },
  {
    id: 'cause',
    pass: true,
    scene: 'cells',
    world: 'cells',
    eyebrow: 'The cause',
    title: 'How it starts',
    text: 'Before birth, some young kidney cells never grow up. They keep dividing and form a tumor. {c:3}',
    say: 'So how does it start? Before a baby is born, the kidneys grow from young cells. Usually they mature by age 3 or 4. But if a few stay young and start dividing out of control, they can turn into a Wilms tumor.',
  },
  {
    id: 'genes',
    scene: 'dna',
    world: 'cells',
    eyebrow: 'The cause',
    title: 'How it starts',
    text: 'Before birth, some young kidney cells never grow up. A change in a {t:gene} like WT1 keeps them dividing. {c:3,8}',
    term: 'gene',
    say: 'It starts before birth. Some young kidney cells never grow up, and a gene change like WT1 keeps them dividing.',
  },
  {
    id: 'lump',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Signs',
    title: 'A lump in the belly',
    text: 'The first sign is often a lump in the belly that does not hurt. Some kids have blood in the urine, called {t:hematuria}. {c:5,2,1}',
    term: 'hematuria',
    note: 'Hemat means blood, uria means urine. {c:15}',
    say: 'The first sign is often a painless lump in the belly. Some kids have blood in the urine, called hematuria.',
  },
  {
    id: 'signs',
    pass: true,
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Signs',
    title: 'Other signs',
    text: 'Some kids have blood in the urine, called {t:hematuria}, or a fever. {c:1,2}',
    term: 'hematuria',
    note: 'Hemat means blood, uria means urine. {c:15}',
    demo: 'Tap the underlined word hematuria to show how to say it',
    say: 'The chart shows other signs doctors see when it is found: belly pain in about 40 out of 100 kids, high blood pressure in 25, and blood in the urine, called hematuria, in about 1 in 5.',
  },
  {
    id: 'ultrasound',
    scene: 'ultrasound',
    world: 'diagnosis',
    eyebrow: 'Diagnosis',
    title: 'Finding it',
    text: 'An {t:ultrasound} uses sound waves to show the lump. A CT scan or MRI shows more detail. {c:6,16}',
    term: 'ultrasound',
    say: 'Doctors find it with an ultrasound first, then a CT scan or MRI for more detail.',
  },
  {
    id: 'scans',
    pass: true,
    scene: 'ct',
    world: 'diagnosis',
    eyebrow: 'Diagnosis',
    title: 'A closer look',
    text: 'A {t:ct|CT scan} or MRI shows how big it is and if it has spread. {c:6}',
    term: 'ct',
    say: 'Then a CT scan or MRI takes detailed pictures in slices. That shows how big the tumor is and whether it has spread, for example to the lungs. The final answer comes from looking at the tumor under a microscope, usually after surgery.',
  },
  {
    id: 'treatment',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Treatment',
    title: 'Treatment',
    text: 'Surgery takes out the kidney with the tumor. This is a {t:nephrectomy}. Most kids then get {t:chemotherapy}. {c:1,7}',
    term: 'nephrectomy',
    note: 'Nephr means kidney, ectomy means removal. {c:15}',
    say: 'Surgery takes out the kidney with the tumor, a nephrectomy, and most kids then get chemotherapy.',
  },
  {
    id: 'outlook',
    pass: true,
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Treatment',
    title: 'The outlook',
    text: 'You can live a healthy life with one kidney. About 9 in 10 kids with Wilms tumor survive. {c:13,2,9}',
    say: 'Here is the good news. You can live a healthy life with one kidney, and each dot here is a child: 93 out of 100 are alive five years later. Treating it with medicine even helped open the door to chemotherapy for cancer.',
  },
  {
    id: 'end',
    scene: 'history',
    world: 'none',
    eyebrow: 'Summary',
    title: 'In short',
    text: 'A kidney cancer in young kids, named after Max Wilms. Scans find it, surgery and chemotherapy treat it, and most kids are cured. {c:1,2,9}',
    demo: 'Point out that the camera came back out of his book to Max Wilms, where the talk began',
    say: 'So: a kidney cancer in young kids, named after Max Wilms, and most kids are cured. Now a quick quiz.',
  },
  {
    id: 'quiz',
    scene: 'history',
    world: 'none',
    eyebrow: 'Quick check',
    title: 'Quick check',
    text: '',
    demo: 'Read each question and let a classmate tap the answer',
    say: 'Five quick questions to finish. Call out the answer, then we tap it.',
  },
];

export const STOP_INDEX = Object.fromEntries(STOPS.map((s, i) => [s.id, i])) as Record<StopId, number>;
export const LAST_STOP = STOPS.length - 1;
/** Scrolling one screen past the last stop reaches the list of sources. */
export const SOURCES_PAGE = LAST_STOP + 1;

/** The stops the talk pauses at (the others are flown through). */
export const PAUSES = STOPS.flatMap((s, i) => (s.pass ? [] : [i]));
/** The next stop to pause at after stop `i` (the list of sources after the last). */
export const nextPause = (i: number) => PAUSES.find((p) => p > i) ?? SOURCES_PAGE;
/** The stop to pause at before stop `i`. */
export const prevPause = (i: number) => [...PAUSES].reverse().find((p) => p < i) ?? 0;

/** The home screen's list of parts (each one jumps there). */
export const SECTIONS: { title: string; stop: number }[] = [
  { title: 'History', stop: STOP_INDEX.doctor },
  { title: 'The disease', stop: STOP_INDEX.body },
  { title: 'The cause', stop: STOP_INDEX.genes },
  { title: 'Signs', stop: STOP_INDEX.lump },
  { title: 'Diagnosis', stop: STOP_INDEX.ultrasound },
  { title: 'Treatment', stop: STOP_INDEX.treatment },
  { title: 'Quick check', stop: STOP_INDEX.quiz },
  { title: 'Sources', stop: SOURCES_PAGE },
];

/** The four clinical facts (presenter guide). */
export const FACTS: { label: string; text: string; cites: number[] }[] = [
  { label: 'Cause', text: 'young kidney cells that keep dividing, usually after a gene change that happened by chance', cites: [3, 8] },
  { label: 'Symptoms', text: 'a lump in the belly, blood in the urine, fever, high blood pressure', cites: [5, 1] },
  { label: 'Diagnosis', text: 'ultrasound, then a CT scan or MRI, and a look at the tumor under a microscope', cites: [6] },
  { label: 'Treatment', text: 'surgery to remove the kidney, chemotherapy, and sometimes radiation', cites: [1, 7] },
];

/** Likely questions from the class, answered only from the sources (presenter guide). */
export const QA: { q: string; a: string; cites: number[] }[] = [
  { q: 'Can adults get it?', a: 'Very rarely. Nearly all cases are found before age 10.', cites: [8] },
  { q: 'Can it be in both kidneys?', a: 'Yes, in about 5 to 10 out of 100 children.', cites: [3] },
  { q: 'Is it inherited?', a: 'Usually not. About 9 out of 10 cases come from gene changes that happen by chance.', cites: [8] },
  { q: 'Can you live with one kidney?', a: 'Yes. People with one kidney can live full, healthy lives.', cites: [13] },
  { q: 'How many kids get it?', a: 'About 600 children a year in the United States. It is about 5 out of 100 childhood cancers.', cites: [4] },
  { q: 'How did Max Wilms die?', a: 'In 1918, during World War I, from an infection after he operated on a prisoner of war.', cites: [9] },
  { q: 'Was chemotherapy used for it early on?', a: 'Yes. Sidney Farber treated it with a drug called actinomycin D, which helped open the door to cancer chemotherapy.', cites: [9] },
];

export type Backdrop = 'dark' | 'lab' | 'paper' | 'studio' | 'deep';
