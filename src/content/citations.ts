/**
 * Reference list (APA 7). Numbers are stable: on-screen markers like [2] point here.
 * Every medical claim on screen carries at least one of these numbers.
 */
export interface Source {
  id: number;
  /**
   * How APA 7 formats it. web: the page title is italic, then the site name.
   * journal: the article title is plain, then *Journal, volume*(issue), pages.
   * entry: an entry "In *Reference work*". book: the book title is italic, then the publisher.
   */
  type: 'web' | 'journal' | 'entry' | 'book';
  authors: string;
  year: string;
  title: string;
  /** Site name (web), journal name, reference work (entry) or publisher (book). */
  container?: string;
  /** Publisher of a reference work (entry). */
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  /** The page, or for journal articles the DOI link. */
  url: string;
  /** Short plain-language note shown under the reference. */
  usedFor: string;
  kind: 'medical' | 'history' | 'anatomy' | 'terminology';
}

export const SOURCES: Source[] = [
  {
    id: 1,
    type: 'web',
    authors: 'National Cancer Institute',
    year: '2025, May 12',
    title: 'Wilms tumor (PDQ®): Patient version',
    url: 'https://www.cancer.gov/types/kidney/patient/wilms-treatment-pdq',
    usedFor: 'What Wilms tumor is, its other name, the ages it affects, signs, tests, and the treatments (nephrectomy, chemotherapy, radiation).',
    kind: 'medical',
  },
  {
    id: 2,
    type: 'web',
    authors: 'PDQ Pediatric Treatment Editorial Board',
    year: '2025, April 15',
    title: 'Wilms tumor and other childhood kidney tumors treatment (PDQ®): Health professional version',
    container: 'National Cancer Institute',
    url: 'https://www.cancer.gov/types/kidney/hp/wilms-treatment-pdq',
    usedFor: 'How it is usually found (a lump noticed by a parent), how often blood in the urine and high blood pressure occur, and the 93% five-year survival.',
    kind: 'medical',
  },
  {
    id: 3,
    type: 'web',
    authors: 'American Cancer Society',
    year: '2025, January 21',
    title: 'What are Wilms tumors?',
    url: 'https://www.cancer.org/cancer/types/wilms-tumor/about/what-is-wilms-tumor.html',
    usedFor: 'How the tumor starts from young kidney cells that never matured, and how often both kidneys are affected.',
    kind: 'medical',
  },
  {
    id: 4,
    type: 'web',
    authors: 'American Cancer Society',
    year: '2025, January 21',
    title: 'Key statistics for Wilms tumors',
    url: 'https://www.cancer.org/cancer/types/wilms-tumor/about/key-statistics.html',
    usedFor: 'About 600 children a year in the U.S., about 5% of childhood cancers, average age 3 to 4.',
    kind: 'medical',
  },
  {
    id: 5,
    type: 'web',
    authors: 'American Cancer Society',
    year: '2025, January 21',
    title: 'Signs and symptoms of Wilms tumors',
    url: 'https://www.cancer.org/cancer/types/wilms-tumor/detection-diagnosis-staging/signs-and-symptoms.html',
    usedFor: 'The first sign is often swelling or a hard lump in the belly, usually not painful, noticed while bathing or dressing the child.',
    kind: 'medical',
  },
  {
    id: 6,
    type: 'web',
    authors: 'American Cancer Society',
    year: '2025, January 21',
    title: 'Tests for Wilms tumors',
    url: 'https://www.cancer.org/cancer/types/wilms-tumor/detection-diagnosis-staging/how-diagnosed.html',
    usedFor: 'Ultrasound usually comes first, then CT or MRI and a check of the lungs; the tumor is usually examined after it is removed.',
    kind: 'medical',
  },
  {
    id: 7,
    type: 'entry',
    authors: 'MedlinePlus',
    year: '2026',
    title: 'Wilms tumor',
    container: 'MedlinePlus medical encyclopedia',
    publisher: 'U.S. National Library of Medicine',
    url: 'https://medlineplus.gov/ency/article/001575.htm',
    usedFor: 'Usual age (about 3 and a half, most before 5), signs, tests, treatment, and the 90% cure rate when it has not spread.',
    kind: 'medical',
  },
  {
    id: 8,
    type: 'web',
    authors: 'MedlinePlus',
    year: '2023, July 13',
    title: 'Wilms tumor',
    container: 'MedlinePlus Genetics',
    url: 'https://medlineplus.gov/genetics/condition/wilms-tumor/',
    usedFor: 'The genes involved (such as WT1), and that about 90% of cases come from gene changes that happen by chance, not inherited.',
    kind: 'medical',
  },
  {
    id: 9,
    type: 'journal',
    authors: 'Raffensperger, J.',
    year: '2015',
    title: 'Max Wilms and his tumor',
    container: 'Journal of Pediatric Surgery',
    volume: '50',
    issue: '2',
    pages: '356–359',
    url: 'https://doi.org/10.1016/j.jpedsurg.2014.10.054',
    usedFor: 'How the name came about: earlier reports, his 1899 book at age 32, his death in World War I, and how surgery, radiation and chemotherapy raised survival to 90%.',
    kind: 'history',
  },
  {
    id: 10,
    type: 'journal',
    authors: 'Zantinga, A. R., & Coppes, M. J.',
    year: '1992',
    title: 'Max Wilms (1867–1918): The man behind the eponym',
    container: 'Medical and Pediatric Oncology',
    volume: '20',
    issue: '6',
    pages: '515–518',
    url: 'https://doi.org/10.1002/mpo.2950200606',
    usedFor: 'Max Wilms’s life dates and his place in the history of the tumor.',
    kind: 'history',
  },
  {
    id: 11,
    type: 'journal',
    authors: 'Morgoshia, T. S., & Kokhanenko, N. Y.',
    year: '2018',
    title: 'The contribution of the legendary surgeon and oncologist Max Wilms (1867–1918) to clinical medicine',
    container: 'Russian Journal of Pediatric Hematology and Oncology',
    volume: '5',
    issue: '1',
    pages: '103–105',
    url: 'https://doi.org/10.17650/2311-1267-2018-5-1-103-105',
    usedFor: 'His 1899 monograph and his appointment as a professor in 1904.',
    kind: 'history',
  },
  {
    id: 12,
    type: 'web',
    authors: 'National Institute of Diabetes and Digestive and Kidney Diseases',
    year: '2018',
    title: 'Your kidneys & how they work',
    url: 'https://www.niddk.nih.gov/health-information/kidney-disease/kidneys-how-they-work',
    usedFor: 'Kidney size and place, the 150 quarts of blood filtered a day, the million nephrons, glomerulus and tubule, ureters and bladder.',
    kind: 'anatomy',
  },
  {
    id: 13,
    type: 'web',
    authors: 'National Institute of Diabetes and Digestive and Kidney Diseases',
    year: '2020',
    title: 'Solitary or single-functioning kidney',
    url: 'https://www.niddk.nih.gov/health-information/kidney-disease/solitary-kidney',
    usedFor: 'A kidney may be removed to treat cancer (nephrectomy), and people with one kidney can live full, healthy lives.',
    kind: 'anatomy',
  },
  {
    id: 14,
    type: 'book',
    authors: 'Betts, J. G., Young, K. A., Wise, J. A., Johnson, E., Poe, B., Kruse, D. H., Korol, O., Johnson, J. E., Womble, M., & DeSaix, P.',
    year: '2022',
    title: 'Anatomy and physiology 2e (Section 25.3, Gross anatomy of the kidney)',
    container: 'OpenStax',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/25-3-gross-anatomy-of-the-kidney',
    usedFor: 'The parts of a kidney: capsule, cortex, medulla, pyramids, renal pelvis and hilum, and the adrenal gland on top.',
    kind: 'anatomy',
  },
  {
    id: 15,
    type: 'web',
    authors: 'MedlinePlus',
    year: 'n.d.',
    title: 'Appendix A: Word parts and what they mean',
    container: 'U.S. National Library of Medicine',
    url: 'https://medlineplus.gov/appendixa.html',
    usedFor: 'Word parts: nephr- kidney, -blast bud or germ, -oma tumor, -ectomy removal, hemat- blood, -uria in the urine, onco- tumor, chemo- chemistry.',
    kind: 'terminology',
  },
  {
    id: 16,
    type: 'web',
    authors: 'National Cancer Institute',
    year: 'n.d.',
    title: 'NCI dictionary of cancer terms',
    url: 'https://www.cancer.gov/publications/dictionaries/cancer-terms',
    usedFor: 'Pronunciations and plain definitions: Wilms tumor, nephrectomy, hematuria, ultrasound, CT scan, chemotherapy, pediatric oncologist.',
    kind: 'terminology',
  },
  {
    id: 17,
    type: 'web',
    authors: 'MedlinePlus',
    year: 'n.d.',
    title: 'Understanding medical words: A tutorial',
    container: 'U.S. National Library of Medicine',
    url: 'https://medlineplus.gov/medwords/',
    usedFor: 'How medical words are built from parts, for example -logy means the study of something.',
    kind: 'terminology',
  },
];

export const SOURCE_BY_ID = new Map(SOURCES.map((s) => [s.id, s]));

export interface MediaCredit {
  what: string;
  creator: string;
  license: string;
  url?: string;
  note?: string;
}

export const MEDIA_CREDITS: MediaCredit[] = [
  {
    what: '3D kidneys, ureters, bladder, adrenal glands and blood vessels (also the drawing in the book)',
    creator: 'BodyParts3D, © The Database Center for Life Science (DBCLS)',
    license: 'CC BY-SA 2.1 Japan',
    url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
    note: 'Remeshed, simplified, shaded and combined for this exhibit; the modified models are shared under the same license.',
  },
  {
    what: 'Portrait of Max Wilms',
    creator: 'Wellcome Collection, via Wikimedia Commons',
    license: 'CC BY 4.0',
    url: 'https://commons.wikimedia.org/wiki/File:Portrait_of_Max_Wilms._Wellcome_M0017800.jpg',
  },
  {
    what: 'The study with Max Wilms at his desk and his book; the tumor, kidney cross-section, nephron, cells, DNA, ultrasound and CT scenes; paper and grain textures',
    creator: 'Created for this project (modelled in code; the study built with Blender)',
    license: 'Original work',
    note: 'Illustrations, not to scale, with colors chosen for clarity. The figure at the desk is a simple likeness based on his portrait. The scans are drawings, not patient images.',
  },
  {
    what: 'Development assistance',
    creator: 'Claude (Anthropic)',
    license: 'Project assistance',
    note: 'Medical facts are supported by the references above.',
  },
  {
    what: 'Typefaces: IBM Plex Sans, IBM Plex Mono and Unbounded',
    creator: 'IBM; The Unbounded Project Authors (via Fontsource)',
    license: 'SIL Open Font License 1.1',
  },
];
