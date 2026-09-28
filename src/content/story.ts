/**
 * The whole exhibit is ONE continuous zoom. Scrolling moves a camera through these stops in order:
 * home → Max Wilms → his 1899 book → the name → the disease → the kidneys → inside a kidney →
 * a nephron → young cells → genes → the lump → other signs → ultrasound → CT → treatment →
 * outlook → a quick check → summary (then the list of sources).
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
}

export const STOPS: Stop[] = [
  {
    id: 'title',
    scene: 'history',
    world: 'none',
    eyebrow: 'Home',
    title: 'Wilms Tumor',
    text: 'Wilms tumor is a kidney cancer that grows in young children. Its medical name is nephroblastoma. {c:1,3}',
    demo: 'Point to the list of parts, then scroll down',
    say: 'My eponym is Wilms tumor. An eponym is a medical term named after a person. As I scroll, we go from the doctor it is named after all the way into the kidney where it grows.',
  },
  {
    id: 'doctor',
    scene: 'history',
    world: 'none',
    eyebrow: 'History',
    title: 'Dr. Max Wilms',
    text: 'The tumor is named after Max Wilms, a German surgeon. He lived from 1867 to 1918. {c:9,10}',
    demo: 'Tap a small source number to show where a fact comes from',
    say: 'Wilms tumor is named after Max Wilms, a German surgeon. He was born in 1867, became a professor in 1904, and died in 1918, during World War I, after catching an infection while operating on a prisoner of war.',
  },
  {
    id: 'book',
    scene: 'history',
    world: 'none',
    eyebrow: 'History',
    title: 'His 1899 book',
    text: 'When he was 32, he wrote a book called The Mixed Tumors of the Kidney. It showed how much he knew about how organs form before birth. {c:9,11}',
    say: 'In 1899, when he was only 32, he published a book called The Mixed Tumors of the Kidney. It was about tumors like this one, and it showed he really understood how the kidney forms before a baby is born.',
  },
  {
    id: 'name',
    scene: 'history',
    world: 'none',
    eyebrow: 'History',
    title: 'Why it has his name',
    text: 'Other doctors had written about this tumor before him, but after his book it became known by his name. The medical name is {t:nephroblastoma}. {c:9,1}',
    term: 'nephroblastoma',
    termLabel: 'Its medical name',
    note: 'Nephr means kidney, blast means bud and oma means tumor. {c:15}',
    say: 'He was not the first to describe it, but after his book the tumor became known by his name. That is what makes it an eponym. Doctors also call it nephroblastoma, which breaks down into kidney, bud and tumor.',
  },
  {
    id: 'body',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'The disease',
    title: 'What is Wilms tumor?',
    text: 'A cancer that starts in a kidney, part of the urinary system. It is the most common kidney cancer in children. Most kids who get it are 2 to 5 years old. {c:1,4}',
    demo: 'Drag the model to turn it, then tap the + on the kidney',
    say: 'Here is my definition. Wilms tumor is a cancer that starts in a kidney, which is part of the urinary system. It is the most common kidney cancer in kids, and most of them are between 2 and 5. About 600 children get it each year in the United States.',
  },
  {
    id: 'kidneys',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'The disease',
    title: 'The kidneys',
    text: 'Two bean-shaped organs, each about the size of a fist, below the rib cage on either side of the spine. Every day they filter about 150 quarts of blood. {c:12}',
    term: 'kidney',
    say: 'These are the kidneys. They are about the size of a fist and sit below the ribs on either side of the spine. Every day they clean about 150 quarts of blood and turn the waste into urine.',
  },
  {
    id: 'inside',
    scene: 'kidney',
    world: 'kidney',
    eyebrow: 'The disease',
    title: 'Inside a kidney',
    text: 'The outer layer is the cortex and the inner part is the medulla. Urine collects in the middle and drains down a tube called the {t:ureter} to the bladder. {c:14,12}',
    term: 'ureter',
    say: 'If we cut a kidney open, the outside layer is the cortex and the inside is the medulla. Urine gathers in the middle and flows down the ureter to the bladder.',
  },
  {
    id: 'nephron',
    scene: 'nephron',
    world: 'nephron',
    eyebrow: 'The disease',
    title: 'Tiny filters',
    text: 'Each kidney has about a million {t:nephron|nephrons}. In each one, a ball of tiny blood vessels called the {t:glomerulus} filters the blood, and a tube takes back what the body still needs. {c:12}',
    term: 'nephron',
    demo: 'Tap the underlined word glomerulus',
    say: 'Each kidney has about a million tiny filters called nephrons. The glomerulus is the little ball of blood vessels that does the filtering, and the tube after it takes back the water and nutrients the body still needs.',
  },
  {
    id: 'cause',
    scene: 'cells',
    world: 'cells',
    eyebrow: 'The cause',
    title: 'How it starts',
    text: 'Before birth, kidneys grow from young cells that are meant to mature. Sometimes a few stay young. If they start dividing out of control, they can form a Wilms tumor. {c:3}',
    say: 'So how does it start? Before a baby is born, the kidneys grow from young cells. Usually they mature by age 3 or 4. But if a few stay young and start dividing out of control, they can turn into a Wilms tumor.',
  },
  {
    id: 'genes',
    scene: 'dna',
    world: 'cells',
    eyebrow: 'The cause',
    title: 'Changes in genes',
    text: 'Changes in {t:gene|genes} such as WT1 let those cells keep growing. About 9 out of 10 of these changes happen by chance and are not passed down in families. {c:8}',
    term: 'gene',
    say: 'What makes them keep growing is a change in their genes, like a gene called WT1. About 9 out of 10 times the change just happens by chance. It is not something passed down from parents.',
  },
  {
    id: 'lump',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Signs',
    title: 'A lump in the belly',
    text: 'The tumor can grow big before anyone notices. Often a parent feels a lump or swelling in the belly while bathing the child. It usually does not hurt. {c:5,2}',
    say: 'The tumor can get pretty big before anyone notices. A lot of the time a parent feels a lump or swelling in the belly while giving the child a bath. It usually does not hurt, which is why it can hide.',
  },
  {
    id: 'signs',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Signs',
    title: 'Other signs',
    text: 'Some children have blood in their urine, called {t:hematuria}. Others have a fever, high blood pressure or a poor appetite. {c:1,2}',
    term: 'hematuria',
    note: 'Hemat means blood and uria means in the urine. {c:15}',
    demo: 'Tap the underlined word hematuria to show how to say it',
    say: 'Other signs are blood in the urine, which is called hematuria, a fever, high blood pressure, or not wanting to eat.',
  },
  {
    id: 'ultrasound',
    scene: 'ultrasound',
    world: 'diagnosis',
    eyebrow: 'Diagnosis',
    title: 'Finding it',
    text: 'The first test is usually an {t:ultrasound}. Sound waves bounce off the organs and make a picture that can show a lump in the kidney. {c:6,16}',
    term: 'ultrasound',
    say: 'To find it, doctors usually start with an ultrasound. It sends sound waves into the belly, and the echoes make a picture that can show a lump in the kidney.',
  },
  {
    id: 'scans',
    scene: 'ct',
    world: 'diagnosis',
    eyebrow: 'Diagnosis',
    title: 'A closer look',
    text: 'A {t:ct|CT scan} or MRI shows the tumor in detail and whether it has spread, for example to the lungs. The tumor is usually checked under a microscope after it is taken out. {c:6}',
    term: 'ct',
    say: 'Then a CT scan or MRI takes detailed pictures in slices. That shows how big the tumor is and whether it has spread, for example to the lungs. The final answer comes from looking at the tumor under a microscope, usually after surgery.',
  },
  {
    id: 'treatment',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Treatment',
    title: 'Treatment',
    text: 'Surgeons usually remove the kidney with the tumor. This is called a {t:nephrectomy}. After surgery, most children get {t:chemotherapy}, and some also get radiation. {c:1,7}',
    term: 'nephrectomy',
    note: 'Nephr means kidney and ectomy means removal. {c:15}',
    say: 'The main treatment is surgery to take out the kidney with the tumor. That is a nephrectomy. After that, most kids get chemotherapy, which is medicine that stops cancer cells, and some also get radiation.',
  },
  {
    id: 'outlook',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Treatment',
    title: 'The outlook',
    text: 'People can live healthy lives with one kidney. Today about 9 in 10 children with Wilms tumor survive. A hundred years ago, very few did. {c:13,2,9}',
    say: 'Here is the good news. You can live a healthy life with one kidney, and today about 9 out of 10 kids with Wilms tumor survive. Treating it with medicine even helped open the door to chemotherapy for cancer.',
  },
  {
    id: 'quiz',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Quick check',
    title: 'Quick check',
    text: '',
    demo: 'Read each question and let a classmate tap the answer',
    say: 'Let’s see what you remember. I’ll read each question, and someone can come up and tap the answer.',
  },
  {
    id: 'end',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Summary',
    title: 'In short',
    text: 'Wilms tumor is a kidney cancer of young children, named after Max Wilms, who wrote about it in 1899. Doctors find it with scans, treat it with surgery and chemotherapy, and about 9 in 10 children survive. {c:1,2,9}',
    demo: 'Tap Sources to show the reference list',
    say: 'So, Wilms tumor is a kidney cancer in young kids, named after Max Wilms. It starts from young kidney cells, doctors find it with scans, and surgery and chemotherapy cure about 9 in 10 children. My sources are listed at the end.',
  },
];

export const STOP_INDEX = Object.fromEntries(STOPS.map((s, i) => [s.id, i])) as Record<StopId, number>;
export const LAST_STOP = STOPS.length - 1;
/** Scrolling one screen past the last stop reaches the list of sources. */
export const SOURCES_PAGE = LAST_STOP + 1;

/** The home screen's list of parts (each one jumps there). */
export const SECTIONS: { title: string; stop: number }[] = [
  { title: 'History', stop: STOP_INDEX.doctor },
  { title: 'The disease', stop: STOP_INDEX.body },
  { title: 'Inside the kidney', stop: STOP_INDEX.inside },
  { title: 'The cause', stop: STOP_INDEX.cause },
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
