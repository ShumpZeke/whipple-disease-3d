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
    demo: 'Point to the list of parts along the bottom, then tap History to jump there',
    term: 'wilms',
    say: 'Our eponym is Wilms tumor, said WILMZ TOO-mer. It is a kidney cancer that young children get, and its medical name is nephroblastoma. I organized this into the history, what the disease is, how it starts, the signs, diagnosis, treatment, and a quick check. That list is along the bottom, and each one jumps to its part. Scrolling moves one camera through the whole thing.',
  },
  {
    id: 'doctor',
    scene: 'history',
    world: 'none',
    eyebrow: 'History',
    title: 'Dr. Max Wilms',
    text: 'A German surgeon who lived from 1867 to 1918. The tumor is named after him. {c:9,10}',
    demo: 'Tap a small reference number to show where a fact comes from',
    say: 'This is Max Wilms, a German surgeon who lived from 1867 to 1918. The card shows his timeline. The small numbers next to the facts are my references. If I tap one, it shows where that fact came from.',
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
    text: 'Other doctors had reported this tumor. His detailed 1899 study brought the findings together, so it took his name. The medical name is {t:nephroblastoma}. {c:9,1}',
    term: 'nephroblastoma',
    termLabel: 'Its medical name',
    note: 'Nephr means kidney, blast means bud, oma means tumor. {c:15}',
    demo: 'Tap the underlined word nephroblastoma to show how to say it and its word parts',
    say: 'Here is the part people get wrong. Max Wilms did not discover this tumor. Other doctors had already reported kidney tumors like it in children. In 1899, when he was 32, he published a detailed study that pulled those reports together and explained it as one disease. That is why his name stuck to it. The medical name is nephroblastoma. If I tap the word, it breaks down: nephr means kidney, blast means a young cell, and oma means tumor.',
  },
  {
    id: 'body',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'The disease',
    title: 'What is Wilms tumor?',
    text: 'A cancer that starts in a kidney, part of the urinary system. It is the most common kidney cancer in kids. {c:1,3}',
    demo: 'Drag the model to turn it, then tap the + on the kidney',
    say: 'Now we go into the drawing in his book, and it becomes the urinary system. Wilms tumor starts in a kidney. It is the most common kidney cancer in children, mostly ages 2 to 5, about 600 kids a year in the U.S. The doctors who treat it are pediatric oncologists. I can drag the model to turn it.',
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
    say: 'We just zoomed from the kidney, into one of its tiny filters, down to the cells and their DNA. Before birth, the kidneys grow from young cells. Sometimes a few never mature and keep dividing, and that becomes the tumor. A gene called WT1 is often involved. In about 9 out of 10 cases the gene change is only in the tumor cells, so it usually does not run in families.',
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
    demo: 'Tap the underlined word hematuria',
    say: 'Back out at the kidney, this is the tumor. The first sign is usually a lump or swelling in the belly that does not hurt. A parent often notices it. Some kids also have blood in the urine. That is called hematuria: hemat means blood and uria means urine. Fever and high blood pressure can happen too.',
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
    say: 'To find it, doctors usually start with an ultrasound, which makes a picture from sound waves. Then a CT scan or MRI shows how big it is and whether it has spread. The final answer comes from looking at the tumor under a microscope.',
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
    text: 'Treatment usually combines surgery and {t:chemotherapy}. Removing the kidney is a {t:nephrectomy}. Some children also get radiation. {c:1,2}',
    term: 'nephrectomy',
    note: 'Nephr means kidney, ectomy means removal. {c:15}',
    demo: 'Tap the word chemotherapy, then scroll on to watch the kidney come out',
    say: 'Treatment usually combines surgery and chemotherapy, said KEE-moh-THAYR-uh-pee. The surgery is a nephrectomy: nephr means kidney and ectomy means removal. Watch the kidney with the tumor come out. Chemotherapy can come before or after surgery, and some children also need radiation. The exact plan depends on the stage and on whether one or both kidneys are affected. A person can live a healthy life with one kidney.',
  },
  {
    id: 'outlook',
    pass: true,
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Treatment',
    title: 'The outlook',
    text: 'You can live a healthy life with one kidney. About 93 in 100 children are alive five years later. {c:13,2}',
    say: 'Here is the good news. You can live a healthy life with one kidney, and each dot here is a child: 93 out of 100 are alive five years later. Treating it with medicine even helped open the door to chemotherapy for cancer.',
  },
  {
    id: 'end',
    scene: 'history',
    world: 'none',
    eyebrow: 'Summary',
    title: 'In short',
    text: 'A kidney cancer in young children, named after Max Wilms. About 93 in 100 children are alive five years later. {c:1,2,9}',
    demo: 'Point to the 93 dots, then to the References link',
    say: 'The camera comes back out of the book to Max Wilms, where we started. So, in short: a kidney cancer in young children, named after Max Wilms. And the outlook is good. Each dot is a child: about 93 out of 100 are alive five years later.',
  },
  {
    id: 'quiz',
    scene: 'history',
    world: 'none',
    eyebrow: 'Quick check',
    title: 'Quick check',
    text: '',
    demo: 'Read each question, let a classmate call the answer, tap it, then scroll down to the references',
    say: 'To finish, five quick questions. Call out the answer and I will tap it. After that, the full reference list is one scroll down, in APA format.',
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
  { title: 'References', stop: SOURCES_PAGE },
];

/** The four clinical facts (presenter guide). */
export const FACTS: { label: string; text: string; cites: number[] }[] = [
  { label: 'Cause', text: 'young kidney cells that keep dividing, usually after a gene change found only in the tumor cells', cites: [3, 8] },
  { label: 'Symptoms', text: 'a lump in the belly, blood in the urine, fever, high blood pressure', cites: [5, 1] },
  { label: 'Diagnosis', text: 'ultrasound, then a CT scan or MRI, and a look at the tumor under a microscope', cites: [6] },
  { label: 'Treatment', text: 'surgery to remove the kidney, chemotherapy, and sometimes radiation', cites: [1, 7] },
];

/** Likely questions from the class, answered only from the sources (presenter guide). */
export const QA: { q: string; a: string; cites: number[] }[] = [
  { q: 'Can adults get it?', a: 'Very rarely. Nearly all cases are found before age 10.', cites: [8] },
  { q: 'Can it be in both kidneys?', a: 'Yes, in about 5 to 10 out of 100 children.', cites: [3] },
  { q: 'Did Max Wilms discover it?', a: 'No. Other doctors had reported it earlier. His 1899 study brought the findings together, and his name became attached to it.', cites: [9] },
  { q: 'Is it inherited?', a: 'Usually not. In about 9 out of 10 cases the gene change is only in the tumor cells. Most Wilms tumors do not run in families.', cites: [8] },
  { q: 'Is the treatment always the same?', a: 'No. It depends on the stage and on whether one or both kidneys are affected. Chemotherapy can come before or after surgery.', cites: [1, 2] },
  { q: 'Can you live with one kidney?', a: 'Yes. People with one kidney can live full, healthy lives.', cites: [13] },
  { q: 'How many kids get it?', a: 'About 600 children a year in the United States. It is about 5 out of 100 childhood cancers.', cites: [4] },
  { q: 'How did Max Wilms die?', a: 'In 1918, during World War I, from an infection after he operated on a prisoner of war.', cites: [9] },
  { q: 'Was chemotherapy used for it early on?', a: 'Yes. Sidney Farber treated it with a drug called actinomycin D, which helped open the door to cancer chemotherapy.', cites: [9] },
];

export type Backdrop = 'dark' | 'lab' | 'paper' | 'studio' | 'deep';
