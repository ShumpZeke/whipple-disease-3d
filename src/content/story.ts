/**
 * The whole exhibit is ONE continuous zoom. Scrolling moves a camera through these stops in order:
 * home → Whipple → the case → the name → the disease → small intestine → its wall → villi →
 * the bacterium → symptoms → the whole body → diagnosis → treatment → a quick check → summary
 * (then the list of sources).
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
  /** The part of the story (presenter guide only). */
  eyebrow: string;
  title: string;
  text: string;
  /** The medical term this stop teaches (presenter guide: pronunciation and word parts). */
  term?: string;
  /** Heading for that term in the guide when it isn't simply "Key term". */
  termLabel?: string;
  /** A second, smaller line on screen (used for the class-list correction). */
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
    title: 'Whipple’s Disease',
    text: 'Whipple’s disease is a rare infection. It damages the small intestine, so the body cannot absorb food. {c:1,2}',
    demo: 'Point to the list of parts, then scroll down',
    say: 'My eponym is Whipple’s disease. An eponym is a medical term named after a person. As I scroll, we zoom from the first case in 1907 all the way down to the germ that causes it.',
  },
  {
    id: 'doctor',
    scene: 'history',
    world: 'none',
    eyebrow: 'History',
    title: 'Dr. George Hoyt Whipple',
    text: 'The disease is named after him. He was a {t:pathology|pathologist}, a doctor who studies diseased tissue. Path means disease and ology means the study of. {c:5,7,13}',
    term: 'pathology',
    demo: 'Tap the underlined word pathologist to show its meaning',
    say: 'It is named after Dr. George Hoyt Whipple. He was born in 1878 and worked at Johns Hopkins as a pathologist, a doctor who studies diseased tissue. In 1934 he won a Nobel Prize.',
  },
  {
    id: 'case',
    scene: 'history',
    world: 'none',
    eyebrow: 'History',
    title: 'The first case',
    text: 'In 1907 he studied a 36-year-old doctor who kept losing weight and had diarrhea and joint pain. After the patient died, Whipple found his intestine packed with fat. {c:5}',
    demo: 'Tap a highlighted phrase in the 1907 article',
    say: 'In 1907 Whipple studied a patient who was losing weight and had diarrhea and joint pain. Nobody knew why. At the autopsy, the lining of his small intestine was full of fat.',
  },
  {
    id: 'name',
    scene: 'history',
    world: 'none',
    eyebrow: 'History',
    title: 'Why it has his name',
    text: 'He was the first to describe it, so it carries his name. He called it {t:lipodystrophy|intestinal lipodystrophy}, which means abnormal fat in the intestine. {c:5,6}',
    term: 'lipodystrophy',
    termLabel: 'His 1907 name for it',
    note: 'Our class list says Allen Whipple, but that is a different doctor. Allen O. Whipple was a surgeon. This disease is named after George Hoyt Whipple. {c:6,8}',
    say: 'He described it first, so it carries his name. That is what makes it an eponym. One correction: our class list says Allen Whipple, but he was a different doctor, a surgeon.',
  },
  {
    id: 'body',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'The disease',
    title: 'What is Whipple’s disease?',
    text: 'A rare infection caused by bacteria. It damages the small intestine, so the body cannot take in the food it eats. It is a disease of the digestive system. {c:1,2,3}',
    demo: 'Drag the model to turn it, then tap the + on the small intestine',
    say: 'In my own words, it is a rare bacterial infection that damages the small intestine, so the body cannot absorb food. It is a disease of the digestive system, so it is treated by gastroenterologists.',
  },
  {
    id: 'intestine',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'The disease',
    title: 'The small intestine',
    text: 'This is where food is absorbed into the body. The infection damages its lining, so food is not absorbed well. This is called {t:malabsorption}, and mal means bad. {c:1,3,12}',
    term: 'malabsorption',
    say: 'The small intestine is where food gets absorbed. The infection damages its lining, and that is called malabsorption. Mal means bad, so it literally means bad absorption.',
  },
  {
    id: 'wall',
    scene: 'tissue',
    world: 'tissue',
    eyebrow: 'The disease',
    title: 'Inside the wall',
    text: 'The wall has four layers. The inside layer, the mucosa, is folded, which gives it more surface to absorb food. {c:17,11}',
    say: 'Now we zoom into the wall. It has four layers, and the inside layer is folded to give it more surface for absorbing food.',
  },
  {
    id: 'villi',
    scene: 'villi',
    world: 'villi',
    eyebrow: 'The disease',
    title: 'Villi',
    text: 'The lining is covered in tiny fingers called villi, each less than a millimeter tall. Inside each one are blood vessels and a {t:lacteal} that carry food away. {c:11}',
    term: 'villi',
    say: 'The lining is covered in villi, tiny fingers that soak up food. Remember them, because this is exactly where the disease does its damage.',
  },
  {
    id: 'cause',
    scene: 'micro',
    world: 'micro',
    eyebrow: 'The cause',
    title: '*Tropheryma whipplei*',
    text: 'This rod-shaped bacterium causes the disease. Immune cells called {t:macrophage|macrophages} swallow the bacteria and fill up with them. Macro means large and phage means eat. {c:1,2,6,13}',
    term: 'macrophage',
    say: 'The cause is a bacterium called Tropheryma whipplei. You say it tro-FER-ih-muh WIP-uh-lee-eye. Immune cells called macrophages, which means big eaters, swallow it and end up full of it.',
  },
  {
    id: 'symptoms',
    scene: 'villi',
    world: 'villi',
    eyebrow: 'Symptoms',
    title: 'Food is not absorbed',
    text: 'The infected villi become flat, so food passes straight through. That causes diarrhea, weight loss and belly pain. {c:1,2,9}',
    demo: 'Tap Healthy villi, then Infected villi, to compare',
    say: 'Here is what that does. The villi go flat, so food passes straight through instead of being absorbed. That is why people get diarrhea, lose weight and have belly pain.',
  },
  {
    id: 'spread',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Symptoms',
    title: 'Beyond the gut',
    text: 'Joint pain is often the first sign, sometimes years earlier. Doctors call it {t:arthralgia}. Arthr means joint and algia means pain. The infection can also reach the heart and brain. {c:1,2,3,13}',
    term: 'arthralgia',
    say: 'It does not stay in the gut. Joint pain, called arthralgia, is often the very first sign, sometimes years before the stomach problems. It can also reach the heart and the brain.',
  },
  {
    id: 'biopsy',
    scene: 'biopsy',
    world: 'diagnosis',
    eyebrow: 'Diagnosis',
    title: 'Finding it',
    text: 'A doctor slides a thin tube with a camera, an {t:endoscopy|endoscope}, into the small intestine and takes a tiny piece. That piece is called a {t:biopsy}. {c:2,14}',
    term: 'biopsy',
    demo: 'Tap a small source number to show where a fact comes from',
    say: 'To find it, a doctor passes an endoscope, a thin tube with a camera, into the small intestine and takes a tiny sample called a biopsy. Bio means life and opsy means viewing.',
  },
  {
    id: 'stain',
    scene: 'stain',
    world: 'diagnosis',
    eyebrow: 'Diagnosis',
    title: 'Under the microscope',
    text: 'A {t:pas|PAS stain} colors the sample. The immune cells full of bacteria turn bright magenta, so they are easy to spot. {c:2,9}',
    term: 'pas',
    say: 'The sample gets a PAS stain. Under the microscope, the cells full of bacteria turn bright magenta, which is the classic sign of Whipple’s disease.',
  },
  {
    id: 'pcr',
    scene: 'pcr',
    world: 'diagnosis',
    eyebrow: 'Diagnosis',
    title: 'Finding its DNA',
    text: 'A test called {t:pcr|PCR} copies the germ’s DNA again and again, so even a tiny trace can be found. {c:10,2}',
    term: 'pcr',
    say: 'Doctors can also use PCR. It copies the germ’s DNA over and over, one, two, four, eight, sixteen, so even a tiny trace becomes enough to find.',
  },
  {
    id: 'treatment',
    scene: 'villi',
    world: 'villi',
    eyebrow: 'Treatment',
    title: 'Treatment',
    text: 'Two to four weeks of antibiotics through a vein, then antibiotic pills for about a year. Without treatment it can be fatal, and it can come back, so doctors keep checking. {c:1,2,3}',
    say: 'The treatment is antibiotics for a long time. First two to four weeks through an IV, then pills for about a year. With treatment the villi heal. Without it, the disease can be fatal.',
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
    text: 'A bacterium damages the lining of the small intestine, so food is not absorbed. Doctors find it with a small sample and a stain, and about a year of antibiotics treats it. It is named after George Hoyt Whipple, who described it in 1907. {c:1,2,5}',
    demo: 'Tap Sources to show the reference list',
    say: 'So, a bacterium damages the small intestine and stops it absorbing food. A biopsy, a stain and PCR find it, and a year of antibiotics treats it. My sources are listed at the end.',
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
  { title: 'The cause', stop: STOP_INDEX.cause },
  { title: 'Symptoms', stop: STOP_INDEX.symptoms },
  { title: 'Diagnosis', stop: STOP_INDEX.biopsy },
  { title: 'Treatment', stop: STOP_INDEX.treatment },
  { title: 'Quick check', stop: STOP_INDEX.quiz },
  { title: 'Sources', stop: SOURCES_PAGE },
];

/** The four clinical facts (presenter guide). */
export const FACTS: { label: string; text: string; cites: number[] }[] = [
  { label: 'Cause', text: 'the bacterium *Tropheryma whipplei*', cites: [1, 2] },
  { label: 'Symptoms', text: 'diarrhea, weight loss, belly pain and joint pain', cites: [1, 3] },
  { label: 'Diagnosis', text: 'a biopsy, a PAS stain and PCR', cites: [2, 3] },
  { label: 'Treatment', text: 'about a year of antibiotics', cites: [1, 2] },
];

/** Likely questions from the class, answered only from the sources (presenter guide). */
export const QA: { q: string; a: string; cites: number[] }[] = [
  { q: 'Who gets it?', a: 'It is rare. It most often affects middle-aged white men.', cites: [3, 1] },
  { q: 'Can it be cured?', a: 'Yes, with long-term antibiotics. It can come back, so doctors keep checking.', cites: [1, 3] },
  { q: 'What happens without treatment?', a: 'It keeps getting worse and can be fatal.', cites: [1, 3] },
  { q: 'How do people catch it?', a: 'My sources do not say how people catch it, only that the bacterium Tropheryma whipplei causes it.', cites: [1] },
  { q: 'When was the germ found?', a: 'Whipple saw rod-shaped germs in 1907, but the bacterium was only identified in 1992.', cites: [5, 4] },
  { q: 'What does Tropheryma mean?', a: 'It is Greek for nourishment barrier, because it blocks food from being absorbed.', cites: [6] },
  { q: 'Is it the same as the Whipple procedure?', a: 'No. That pancreas operation is named after a different doctor, the surgeon Allen O. Whipple.', cites: [8, 15] },
];

export type Backdrop = 'dark' | 'lab' | 'paper' | 'studio' | 'deep';
