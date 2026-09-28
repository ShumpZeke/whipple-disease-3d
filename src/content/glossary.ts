/**
 * Medical terms. Each term: how to say it, word parts, a plain definition (paraphrased),
 * and source numbers from citations.ts.
 */
export interface Term {
  key: string;
  term: string;
  say?: string;
  /** Label for `say`, e.g. to mark it as a respelling guide rather than an official pronunciation. */
  sayNote?: string;
  parts?: { part: string; meaning: string }[];
  /** A few words to put on the big screen, e.g. “blood in the urine”. */
  short: string;
  definition: string;
  cites: number[];
}

export const GLOSSARY: Term[] = [
  {
    key: 'wilms',
    term: 'Wilms tumor',
    say: 'wilmz TOO-mer',
    short: 'a kidney cancer of young children',
    definition:
      'A cancer that starts in the kidney, usually in children younger than 5. It is named after Max Wilms, a German surgeon who wrote about it in 1899.',
    cites: [16, 1, 9],
  },
  {
    key: 'nephroblastoma',
    term: 'Nephroblastoma',
    say: 'NEF-roh-blas-TOH-muh',
    sayNote: 'respelling guide',
    parts: [
      { part: 'nephr(o)-', meaning: 'kidney' },
      { part: 'blast', meaning: 'bud or germ' },
      { part: '-oma', meaning: 'tumor' },
    ],
    short: 'a tumor of young kidney cells',
    definition: 'The medical name for Wilms tumor. It grows from young kidney cells that never finished maturing.',
    cites: [15, 1, 3],
  },
  {
    key: 'kidney',
    term: 'Kidney',
    say: 'KID-nee',
    short: 'the organ that filters blood and makes urine',
    definition:
      'One of two bean-shaped organs, each about the size of a fist, just below the rib cage on either side of the spine. Together they filter about 150 quarts of blood a day.',
    cites: [16, 12],
  },
  {
    key: 'nephron',
    term: 'Nephron',
    say: 'NEF-ron',
    sayNote: 'respelling guide',
    parts: [{ part: 'nephr-', meaning: 'kidney' }],
    short: 'one of the kidney’s tiny filters',
    definition:
      'A tiny filtering unit. Each kidney has about a million. A ball of blood vessels called the glomerulus filters the blood, and a tubule takes back what the body still needs.',
    cites: [12, 15],
  },
  {
    key: 'glomerulus',
    term: 'Glomerulus',
    say: 'gloh-MER-yoo-lus',
    sayNote: 'respelling guide',
    short: 'the ball of tiny blood vessels that filters blood',
    definition: 'The filter at the start of each nephron. Its thin walls let water and wastes pass out of the blood into the tubule.',
    cites: [12],
  },
  {
    key: 'ureter',
    term: 'Ureter',
    say: 'YER-eh-ter',
    short: 'the tube from a kidney to the bladder',
    definition: 'A thin tube of muscle that carries urine from a kidney down to the bladder. There is one for each kidney.',
    cites: [16, 12],
  },
  {
    key: 'hematuria',
    term: 'Hematuria',
    say: 'HEE-muh-TOOR-ee-uh',
    parts: [
      { part: 'hemat-', meaning: 'blood' },
      { part: '-uria', meaning: 'in the urine' },
    ],
    short: 'blood in the urine',
    definition: 'Blood in the urine. Almost 1 in 5 children with Wilms tumor have blood in their urine that you can see.',
    cites: [16, 15, 2],
  },
  {
    key: 'nephrectomy',
    term: 'Nephrectomy',
    say: 'neh-FREK-toh-mee',
    parts: [
      { part: 'nephr-', meaning: 'kidney' },
      { part: '-ectomy', meaning: 'removal' },
    ],
    short: 'surgery to remove a kidney',
    definition:
      'Surgery to remove a kidney. For Wilms tumor, the surgeon usually takes out the whole kidney with the tumor. A partial nephrectomy removes only the tumor and a little tissue around it.',
    cites: [16, 15, 1],
  },
  {
    key: 'chemotherapy',
    term: 'Chemotherapy',
    say: 'KEE-moh-THAYR-uh-pee',
    parts: [
      { part: 'chemo-', meaning: 'chemistry' },
      { part: 'therapy', meaning: 'treatment' },
    ],
    short: 'medicine that stops cancer cells from growing',
    definition: 'Treatment with drugs that stop cancer cells from growing, either by killing them or by stopping them from dividing.',
    cites: [16, 15],
  },
  {
    key: 'oncologist',
    term: 'Pediatric oncologist',
    say: 'pee-dee-A-trik on-KAH-loh-jist',
    parts: [
      { part: 'onco-', meaning: 'tumor' },
      { part: '-logy', meaning: 'study of' },
    ],
    short: 'a doctor who treats children with cancer',
    definition: 'A doctor with special training in finding and treating cancer in children.',
    cites: [16, 15, 17],
  },
  {
    key: 'ultrasound',
    term: 'Ultrasound',
    say: 'UL-truh-sownd',
    short: 'a picture made from sound echoes',
    definition: 'A test that sends sound waves into the body. The echoes make a picture of the organs on a screen. It is usually the first test for Wilms tumor.',
    cites: [16, 6],
  },
  {
    key: 'ct',
    term: 'CT scan',
    say: 'C-T skan',
    short: 'x-ray pictures taken in slices',
    definition: 'A test that uses an x-ray machine linked to a computer to take detailed pictures of the inside of the body, slice by slice.',
    cites: [16, 6],
  },
  {
    key: 'gene',
    term: 'Gene',
    say: 'jeen',
    short: 'a piece of DNA with instructions for a cell',
    definition:
      'A section of DNA that tells a cell what to do. Changes in genes such as WT1 can let kidney cells grow out of control. Most of these changes happen by chance.',
    cites: [8],
  },
  {
    key: 'metastasis',
    term: 'Metastasis',
    say: 'meh-TAS-tuh-sis',
    short: 'cancer spreading to another part of the body',
    definition:
      'When cancer cells break away and grow somewhere else. Wilms tumor can spread to the lungs, liver or nearby lymph nodes, so doctors check the lungs with a chest x-ray or CT scan.',
    cites: [16, 6],
  },
];

export const TERM_BY_KEY = new Map(GLOSSARY.map((t) => [t.key, t]));
