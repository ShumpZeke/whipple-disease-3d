/**
 * The whole exhibit is ONE continuous zoom. Scrolling moves a camera through these stops in order:
 * 1907 → Whipple → the case → the name → today's digestive system → small intestine → its wall →
 * villi → the bacterium (cause) → malabsorption (symptoms) → the whole body → diagnosis → treatment →
 * a quick check → summary (then the list of sources).
 *
 * Written to be presented: one idea per stop, a big headline, one or two short sentences, and at
 * most one "key term" broken into its word parts. `say` is the presenter's script for that stop
 * (shown on the printable presenter guide, not on the big screen).
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
  /** Glossary key shown as this stop's "key term" (word parts + meaning). */
  term?: string;
  /** Heading for the key-term box when it isn't simply "Key term". */
  termLabel?: string;
  /** Optional second, smaller line (used for the class-list correction). */
  note?: string;
  /** What the presenter can tap or do here. */
  hint?: string;
  /** Presenter script: what to say out loud at this stop. */
  say: string;
}

export const STOPS: Stop[] = [
  {
    id: 'title',
    scene: 'history',
    world: 'none',
    rail: 'Home',
    eyebrow: 'Medical Terminology · Eponym #26',
    title: 'Whipple’s Disease',
    text: 'A rare infection, caused by bacteria, that damages the small intestine so the body can’t absorb food. {c:1,2}',
    hint: 'Introduce yourself, then tap Start (or tap a section to jump to it)',
    say: 'My eponym is Whipple’s disease. An eponym is a medical term named after a person. My project is one page that zooms in, in five parts: the history, the disease, four facts, a quick check, and my sources. You can tap any underlined word for its meaning and the small numbers for my sources.',
  },
  {
    id: 'doctor',
    scene: 'history',
    world: 'none',
    rail: 'History',
    eyebrow: 'History · Who was Whipple?',
    title: 'Dr. George Hoyt Whipple',
    text: 'The disease is named after him. He was a pathologist: a doctor who studies diseased tissue to find out what went wrong. {c:5,7}',
    term: 'pathology',
    say: 'The disease is named after Dr. George Hoyt Whipple. He was born in 1878 in New Hampshire and became a doctor at Johns Hopkins. He was a pathologist — “path-” means disease and “-ology” means study of — so he studied diseased tissue. In 1934 he even shared a Nobel Prize for his work on anemia.',
  },
  {
    id: 'case',
    scene: 'history',
    world: 'none',
    eyebrow: 'History · The first case, 1907',
    title: 'A mystery illness',
    text: 'A 36-year-old doctor lost weight and had diarrhea and joint pain. After he died, Whipple found his intestine lining packed with fat. {c:5}',
    hint: 'Tap a highlighted phrase to see what it means today',
    say: 'His patient was a 36-year-old doctor who kept losing weight and had diarrhea and joint pain. Nobody knew why. After the patient died, Whipple did an autopsy and found the lining of the small intestine packed with fat.',
  },
  {
    id: 'name',
    scene: 'history',
    world: 'none',
    eyebrow: 'History · The name',
    title: 'Why is it named after him?',
    text: 'He was the first to describe it, in 1907, so the disease carries his name. That makes it an eponym. {c:5,6}',
    term: 'lipodystrophy',
    termLabel: 'His 1907 name for it',
    note: 'Correction: our class list says “Allen Whipple.” It is George Hoyt Whipple. Allen O. Whipple was a different doctor, a surgeon. {c:6,8}',
    say: 'Whipple was the first to describe it, so the disease carries his name. That’s what makes it an eponym. He called it intestinal lipodystrophy: “lipo” means fat, “dys” means abnormal, “trophy” means growth. One correction: our class list says Allen Whipple, but that’s a different doctor, a surgeon. The disease is named after George Hoyt Whipple.',
  },
  {
    id: 'body',
    scene: 'anatomy',
    world: 'anatomy',
    rail: 'The disease',
    eyebrow: 'The disease · Definition',
    title: 'What is Whipple’s disease?',
    text: 'A rare infection, caused by bacteria, that damages the small intestine so the body can’t absorb food. {c:1,2,3}',
    hint: 'Tap ＋ on the small intestine to zoom in',
    say: 'Here is my definition, in my own words: Whipple’s disease is a rare infection, caused by bacteria, that damages the small intestine so the body can’t absorb food. It belongs to the digestive system, so the doctors who handle it are digestive-system specialists — gastroenterology.',
  },
  {
    id: 'intestine',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'The disease · The organ',
    title: 'The small intestine',
    text: 'This is where food is absorbed into the body. The infection damages its lining, so food is not absorbed well. {c:1,3}',
    term: 'malabsorption',
    say: 'The small intestine is where nutrients from food get absorbed into the body. The infection damages its lining, so food isn’t absorbed well. That’s called malabsorption: “mal-” means bad, so it literally means bad absorption.',
  },
  {
    id: 'wall',
    scene: 'tissue',
    world: 'tissue',
    eyebrow: 'The disease · Zoom in',
    title: 'Inside the wall',
    text: 'The wall has four layers. The inner lining (the mucosa) has folds that give it more surface to absorb food. {c:17,11}',
    say: 'Let’s zoom into the wall. It has four layers. The inside layer, the mucosa, is folded, which gives it more surface for absorbing food.',
  },
  {
    id: 'villi',
    scene: 'villi',
    world: 'villi',
    eyebrow: 'The disease · Zoom in closer',
    title: 'Villi',
    text: 'Tiny finger-like bumps, 0.5–1 mm tall, that soak up food. Inside each one: blood vessels and a {t:lacteal} for fat. {c:11}',
    term: 'villi',
    say: 'The lining is covered in villi: tiny finger-like bumps, less than a millimeter tall, that soak up nutrients. Inside each one are tiny blood vessels and a lacteal, which carries away fat. Remember the villi — this is where the disease does its damage.',
  },
  {
    id: 'cause',
    scene: 'micro',
    world: 'micro',
    rail: '4 facts',
    eyebrow: 'Fact 1 · Cause',
    title: '*Tropheryma whipplei*',
    text: 'A rod-shaped bacterium causes the disease. Immune cells called macrophages fill up with it. {c:1,2,6}',
    term: 'macrophage',
    say: 'Fact one, the cause: a rod-shaped bacterium called Tropheryma whipplei — say it “tro-FER-ih-muh WIP-uh-lee-eye.” Immune cells called macrophages — “macro” means large, “phage” means eating — swallow the bacteria and end up packed full of them.',
  },
  {
    id: 'symptoms',
    scene: 'villi',
    world: 'villi',
    eyebrow: 'Fact 2 · Symptoms',
    title: 'Food is not absorbed',
    text: 'Damaged villi flatten and can’t absorb food. The result: diarrhea, weight loss and belly pain. {c:1,2,9}',
    hint: 'Tap to compare healthy and infected villi',
    say: 'Fact two, symptoms. The infected villi flatten, so food passes straight through instead of being absorbed. That causes diarrhea, weight loss and belly pain. Compare them here: healthy villi absorb most of the food, infected villi absorb very little.',
  },
  {
    id: 'spread',
    scene: 'anatomy',
    world: 'anatomy',
    eyebrow: 'Fact 2 · Symptoms',
    title: 'Beyond the gut',
    text: 'Joint pain is often the first sign, sometimes years earlier. The infection can also reach the heart and brain. {c:1,2,3}',
    term: 'arthralgia',
    say: 'It doesn’t stay in the gut. Joint pain — arthralgia: “arthr-” means joint and “-algia” means pain — is often the very first symptom, sometimes years before the stomach problems. It can also spread to the heart and the brain.',
  },
  {
    id: 'biopsy',
    scene: 'biopsy',
    world: 'diagnosis',
    eyebrow: 'Fact 3 · Diagnosis',
    title: 'Step 1: Take a sample',
    text: 'Through an {t:endoscopy|endoscope} (a thin tube with a camera), a doctor takes a tiny piece of the small intestine. {c:2,14}',
    term: 'biopsy',
    say: 'Fact three: how doctors find it. Step one: a doctor passes an endoscope — a thin tube with a camera — into the small intestine and takes a tiny sample. That sample is a biopsy: “bio-” means life, “-opsy” means viewing.',
  },
  {
    id: 'stain',
    scene: 'stain',
    world: 'diagnosis',
    eyebrow: 'Fact 3 · Diagnosis',
    title: 'Step 2: Stain it',
    text: 'A PAS stain turns the germ-filled macrophages bright magenta under the microscope. {c:2,9}',
    term: 'pas',
    say: 'Step two: the sample gets a PAS stain. Under the microscope, the macrophages full of bacteria show up bright magenta. That’s the classic sign of Whipple’s disease.',
  },
  {
    id: 'pcr',
    scene: 'pcr',
    world: 'diagnosis',
    eyebrow: 'Fact 3 · Diagnosis',
    title: 'Step 3: Find its DNA',
    text: 'PCR copies the germ’s DNA again and again, so even a tiny trace can be found. {c:10,2}',
    term: 'pcr',
    say: 'Step three: PCR, the polymerase chain reaction. It copies the bacterium’s DNA again and again — 1, 2, 4, 8, 16 copies — so even a tiny trace becomes enough to detect.',
  },
  {
    id: 'treatment',
    scene: 'villi',
    world: 'villi',
    eyebrow: 'Fact 4 · Treatment',
    title: 'Long-term antibiotics',
    text: 'About 2–4 weeks of IV antibiotics, then about a year of antibiotic pills. Without treatment, it can be fatal. {c:1,2,3}',
    say: 'Fact four, treatment. Patients get about two to four weeks of antibiotics through an IV, then about a year of antibiotic pills. With treatment the villi heal and people get better; without treatment it can be fatal. It can come back, so doctors keep checking on patients.',
  },
  {
    id: 'quiz',
    scene: 'anatomy',
    world: 'anatomy',
    rail: 'Quick check',
    eyebrow: 'Quick check',
    title: 'What do you remember?',
    text: '',
    say: 'Quick check! Ask the class each question and let someone come up and tap the answer.',
  },
  {
    id: 'end',
    scene: 'anatomy',
    world: 'anatomy',
    rail: 'Summary',
    eyebrow: 'Summary',
    title: 'Whipple’s disease in 4 facts',
    text: 'Named after George Hoyt Whipple, who first described it in 1907. {c:5,6}',
    say: 'To sum up: it’s caused by the bacterium Tropheryma whipplei. It causes diarrhea, weight loss, belly pain and joint pain. It’s diagnosed with a biopsy, a PAS stain and PCR. And it’s treated with about a year of antibiotics. My sources are listed at the end.',
  },
];

export const STOP_INDEX = Object.fromEntries(STOPS.map((s, i) => [s.id, i])) as Record<StopId, number>;
export const LAST_STOP = STOPS.length - 1;
/** Scrolling one screen past the last stop reaches the list of sources. */
export const SOURCES_PAGE = LAST_STOP + 1;

/** The home screen's “What's inside” menu: the five parts of the exhibit. */
export const SECTIONS: { title: string; sub: string; stop: number }[] = [
  { title: 'History', sub: 'Who Whipple was and the first case (1907)', stop: STOP_INDEX.doctor },
  { title: 'The disease', sub: 'Definition, body system, the small intestine', stop: STOP_INDEX.body },
  { title: 'Four facts', sub: 'Cause · symptoms · diagnosis · treatment', stop: STOP_INDEX.cause },
  { title: 'Quick check', sub: 'Four questions for the class', stop: STOP_INDEX.quiz },
  { title: 'Sources', sub: 'References, medical terms and credits', stop: SOURCES_PAGE },
];

/** The four facts, for the summary and the presenter guide. */
export const FACTS: { label: string; text: string; cites: number[] }[] = [
  { label: 'Cause', text: 'the bacterium *Tropheryma whipplei*', cites: [1, 2] },
  { label: 'Symptoms', text: 'diarrhea, weight loss, belly pain and joint pain', cites: [1, 3] },
  { label: 'Diagnosis', text: 'biopsy of the small intestine, PAS stain, PCR', cites: [2, 3] },
  { label: 'Treatment', text: 'about a year of antibiotics', cites: [1, 2] },
];

export type Backdrop = 'dark' | 'lab' | 'paper' | 'studio' | 'deep';
