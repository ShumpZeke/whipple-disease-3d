/**
 * Medical terms. Each term: pronunciation guide, word parts, a plain definition (paraphrased),
 * and source numbers from citations.ts.
 */
export interface Term {
  key: string;
  term: string;
  say?: string;
  /** Label for `say`, e.g. to mark it as a respelling guide rather than an official pronunciation. */
  sayNote?: string;
  parts?: { part: string; meaning: string }[];
  /** A few words to put on the big screen, e.g. “joint pain”. */
  short: string;
  definition: string;
  cites: number[];
}

export const GLOSSARY: Term[] = [
  {
    key: 'tropheryma',
    term: 'Tropheryma whipplei',
    say: 'tro-FER-ih-muh WIP-uh-lee-eye',
    sayNote: 'CDC guide: tro-fer′ĭ-mə wi′-pəl-ē-ī',
    parts: [
      { part: 'trophe', meaning: 'nourishment (Greek)' },
      { part: 'eryma', meaning: 'barrier (Greek)' },
      { part: 'whipplei', meaning: 'honors George Hoyt Whipple' },
    ],
    short: 'the germ that causes Whipple’s disease',
    definition:
      'The rod-shaped bacterium that causes Whipple’s disease. The name means “nourishment barrier,” because the infection blocks the absorption of food.',
    cites: [6],
  },
  {
    key: 'malabsorption',
    term: 'Malabsorption',
    say: 'mal-ab-SORP-shun',
    parts: [
      { part: 'mal-', meaning: 'bad or abnormal' },
      { part: 'absorption', meaning: 'taking in' },
    ],
    short: 'trouble absorbing nutrients from food',
    definition: 'When the body has trouble taking in (absorbing) nutrients from food.',
    cites: [12, 13],
  },
  {
    key: 'villi',
    term: 'Villi (singular: villus)',
    say: 'VIL-eye',
    short: 'tiny finger-like bumps that absorb food',
    definition:
      'Tiny finger-like projections, about 0.5–1 mm long, that line the small intestine and greatly increase the area for absorbing nutrients.',
    cites: [11],
  },
  {
    key: 'lacteal',
    term: 'Lacteal',
    say: 'LAK-tee-ul',
    short: 'a tiny vessel in each villus that absorbs fat',
    definition: 'A small lymph vessel in the center of each villus. It absorbs fats from digested food.',
    cites: [11],
  },
  {
    key: 'biopsy',
    term: 'Biopsy',
    say: 'BY-op-see',
    parts: [
      { part: 'bi(o)-', meaning: 'life' },
      { part: '-opsy', meaning: 'visual examination' },
    ],
    short: 'a small piece of tissue taken to be examined',
    definition:
      'Removing a small piece of tissue so it can be stained and examined under a microscope. For Whipple’s disease, samples come from the small intestine.',
    cites: [13, 14, 2],
  },
  {
    key: 'endoscopy',
    term: 'Endoscopy',
    say: 'en-DOS-kuh-pee',
    parts: [
      { part: 'endo-', meaning: 'within' },
      { part: '-scopy', meaning: 'examine' },
    ],
    short: 'looking inside the body with a camera tube',
    definition:
      'Looking inside the body with an endoscope, a flexible tube with a small camera and light. Tiny tools passed through it can take biopsies.',
    cites: [13, 14],
  },
  {
    key: 'pcr',
    term: 'PCR (polymerase chain reaction)',
    say: 'P-C-R, puh-LIM-er-ace',
    short: 'a test that copies DNA to find a germ',
    definition:
      'A laboratory technique that makes many copies (“amplifies”) of a small piece of DNA, so even a tiny amount of a germ’s DNA can be detected.',
    cites: [10, 2],
  },
  {
    key: 'arthralgia',
    term: 'Arthralgia',
    say: 'ar-THRAL-juh',
    parts: [
      { part: 'arthr-', meaning: 'joint' },
      { part: '-algia', meaning: 'pain' },
    ],
    short: 'joint pain',
    definition: 'Joint pain. In Whipple’s disease it is often the first symptom, sometimes years before stomach and bowel problems.',
    cites: [13, 2, 3],
  },
  {
    key: 'lipodystrophy',
    term: 'Lipodystrophy',
    say: 'lip-oh-DIS-truh-fee',
    parts: [
      { part: 'lip(o)-', meaning: 'fat' },
      { part: 'dys-', meaning: 'abnormal' },
      { part: '-trophy', meaning: 'growth' },
    ],
    short: 'abnormal fat in the body’s tissues',
    definition:
      'Abnormal fat tissue. Whipple called the disease “intestinal lipodystrophy” because he found fat deposits in the intestine and its lymph nodes.',
    cites: [13, 5],
  },
  {
    key: 'macrophage',
    term: 'Macrophage',
    say: 'MAK-roh-fayj',
    parts: [
      { part: 'macro-', meaning: 'large' },
      { part: '-phage', meaning: 'eating' },
    ],
    short: 'a “big eater”: an immune cell that swallows germs',
    definition:
      'A large immune cell that swallows germs. In Whipple’s disease, macrophages in the villi fill up with the bacteria.',
    cites: [13, 2],
  },
  {
    key: 'pathology',
    term: 'Pathology',
    say: 'puh-THOL-uh-jee',
    parts: [
      { part: 'path(o)-', meaning: 'disease' },
      { part: '-logy', meaning: 'study of' },
    ],
    short: 'the study of disease',
    definition: 'The study of disease, especially by examining tissues and organs. Whipple was a pathologist.',
    cites: [13, 16, 7],
  },
  {
    key: 'endocarditis',
    term: 'Endocarditis',
    say: 'en-doh-kar-DY-tis',
    parts: [
      { part: 'endo-', meaning: 'within' },
      { part: 'cardi-', meaning: 'heart' },
      { part: '-itis', meaning: 'inflammation' },
    ],
    short: 'inflammation of the heart’s inner lining',
    definition: 'Inflammation of the heart’s inner lining and valves. Whipple’s disease can cause it and damage heart valves.',
    cites: [13, 3],
  },
  {
    key: 'duodenum',
    term: 'Duodenum',
    say: 'doo-oh-DEE-num',
    short: 'the first part of the small intestine',
    definition: 'The first part of the small intestine, right after the stomach. Upper endoscopy can reach it, so biopsies are often taken here.',
    cites: [13, 14, 9],
  },
  {
    key: 'pas',
    term: 'PAS stain',
    say: 'P-A-S',
    short: 'a stain that turns the germ-filled cells magenta',
    definition:
      'Periodic acid–Schiff stain, a dye used on tissue samples. In Whipple’s disease, macrophages full of bacteria are “PAS-positive,” so they stand out clearly under the microscope.',
    cites: [2, 9],
  },
];

export const TERM_BY_KEY = new Map(GLOSSARY.map((t) => [t.key, t]));
