/**
 * Reference list (APA 7). Numbers are stable: on-screen markers like [2] point here.
 * Every medical claim on screen carries at least one of these numbers.
 */
export interface Source {
  id: number;
  /** APA reference, split so the title can be italicised where APA requires it. */
  authors: string;
  year: string;
  title: string;
  container?: string;
  details?: string;
  url: string;
  /** Short plain-language note shown under the reference. */
  usedFor: string;
  kind: 'medical' | 'history' | 'anatomy' | 'terminology';
}

export const SOURCES: Source[] = [
  {
    id: 1,
    authors: 'Malik, Z.',
    year: '2025, April',
    title: 'Whipple disease',
    container: 'Merck Manual Consumer Version',
    details: 'Merck & Co.',
    url: 'https://www.merckmanuals.com/home/digestive-disorders/malabsorption/whipple-disease',
    usedFor: 'Definition, cause, the four main symptoms, organs affected, treatment, prognosis.',
    kind: 'medical',
  },
  {
    id: 2,
    authors: 'Malik, Z.',
    year: '2025, March',
    title: 'Whipple disease',
    container: 'Merck Manual Professional Version',
    details: 'Merck & Co.',
    url: 'https://www.merckmanuals.com/professional/gastrointestinal-disorders/malabsorption-syndromes/whipple-disease',
    usedFor: 'PAS-positive macrophages in the villi, small-bowel biopsy, PCR, antibiotic regimens, relapse and follow-up.',
    kind: 'medical',
  },
  {
    id: 3,
    authors: 'MedlinePlus',
    year: '2026',
    title: 'Whipple disease',
    container: 'MedlinePlus Medical Encyclopedia',
    details: 'U.S. National Library of Medicine. Reviewed April 27, 2026, by T. Eisner & D. C. Dugdale.',
    url: 'https://medlineplus.gov/ency/article/000209.htm',
    usedFor: 'Who is affected, joint pain as the earliest symptom, tests (endoscopy, biopsy, PCR), treatment length, outlook.',
    kind: 'medical',
  },
  {
    id: 4,
    authors: 'Antunes, C., & Singhal, M.',
    year: '2023',
    title: 'Whipple disease',
    container: 'StatPearls',
    details: 'StatPearls Publishing (NCBI Bookshelf NBK441937).',
    url: 'https://www.ncbi.nlm.nih.gov/books/NBK441937/',
    usedFor: 'History: the 1907 case, the name “intestinal lipodystrophy,” identification of the bacterium in 1992.',
    kind: 'history',
  },
  {
    id: 5,
    authors: 'Whipple, G. H.',
    year: '1907',
    title:
      'A hitherto undescribed disease characterized anatomically by deposits of fat and fatty acids in the intestinal and mesenteric lymphatic tissues',
    container: 'Bulletin of the Johns Hopkins Hospital',
    details: '18(198), 382–391. Public-domain scan via the Internet Archive.',
    url: 'https://archive.org/details/sim_johns-hopkins-medical-journal_1907-09_18_198',
    usedFor: 'The original 1907 description: the patient, the autopsy findings, the “rod-shaped organism (?)”, and the name he proposed.',
    kind: 'history',
  },
  {
    id: 6,
    authors: 'Centers for Disease Control and Prevention',
    year: '2010',
    title: 'Etymologia: Tropheryma whipplei',
    container: 'Emerging Infectious Diseases',
    details: '16(5), 839. https://doi.org/10.3201/eid1605.e11605',
    url: 'https://wwwnc.cdc.gov/eid/article/16/5/e1-1605_article',
    usedFor: 'Pronunciation and word origin of Tropheryma whipplei; George Hoyt Whipple first described the syndrome in 1907.',
    kind: 'terminology',
  },
  {
    id: 7,
    authors: 'Nobel Prize Outreach',
    year: 'n.d.',
    title: 'George H. Whipple – Biographical',
    container: 'NobelPrize.org',
    url: 'https://www.nobelprize.org/prizes/medicine/1934/whipple/biographical/',
    usedFor: 'Whipple’s birth (1878), training and Johns Hopkins career, and the 1934 Nobel Prize.',
    kind: 'history',
  },
  {
    id: 8,
    authors: 'Gjunkshi, L., Gjunkshi, L., Persaud, N. A., & Gray, S. F.',
    year: '2025',
    title: 'Allen Oldfather Whipple (1881–1963): A pioneer of general surgery',
    container: 'Cureus',
    details: '17(7), e88895. https://doi.org/10.7759/cureus.88895',
    url: 'https://doi.org/10.7759/cureus.88895',
    usedFor: 'Allen O. Whipple was a surgeon; the Whipple procedure (pancreaticoduodenectomy) is named for him.',
    kind: 'history',
  },
  {
    id: 9,
    authors: 'Huang, Y., Harrison, S. M., Bali, A., Rangani, R., Ashmila, H., & Badurdeen, D. S.',
    year: '2023',
    title: 'Whipple’s disease: A textbook disease that is often missed in real life',
    container: 'ACG Case Reports Journal',
    details: '10(11), e01199. https://doi.org/10.14309/crj.0000000000001199',
    url: 'https://doi.org/10.14309/crj.0000000000001199',
    usedFor: 'Biopsy findings: flattened villi and PAS-stained macrophages in the lamina propria; ceftriaxone then TMP-SMX.',
    kind: 'medical',
  },
  {
    id: 10,
    authors: 'National Human Genome Research Institute',
    year: '2020, August 17',
    title: 'Polymerase chain reaction (PCR) fact sheet',
    container: 'Genome.gov',
    url: 'https://www.genome.gov/about-genomics/fact-sheets/Polymerase-Chain-Reaction-Fact-Sheet',
    usedFor: 'What PCR is: a technique that “amplifies” (copies) small segments of DNA.',
    kind: 'terminology',
  },
  {
    id: 11,
    authors: 'Betts, J. G., Young, K. A., Wise, J. A., Johnson, E., Poe, B., Kruse, D. H., Korol, O., Johnson, J. E., Womble, M., & DeSaix, P.',
    year: '2022',
    title: 'Anatomy and physiology (2nd ed.), §23.5 The small and large intestines',
    container: 'OpenStax',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-5-the-small-and-large-intestines',
    usedFor: 'Circular folds, villi (0.5–1 mm), the capillaries and lacteal inside each villus, microvilli.',
    kind: 'anatomy',
  },
  {
    id: 12,
    authors: 'MedlinePlus',
    year: '2026',
    title: 'Malabsorption',
    container: 'MedlinePlus Medical Encyclopedia',
    details: 'U.S. National Library of Medicine.',
    url: 'https://medlineplus.gov/ency/article/000299.htm',
    usedFor: 'Definition of malabsorption.',
    kind: 'terminology',
  },
  {
    id: 13,
    authors: 'MedlinePlus',
    year: 'n.d.',
    title: 'Appendix A: Word parts and what they mean',
    container: 'MedlinePlus',
    details: 'U.S. National Library of Medicine.',
    url: 'https://medlineplus.gov/appendixa.html',
    usedFor: 'Word parts: arthr-, lip-, dys-, -trophy, mal-, bio-, -opsy, endo-, -scopy, macro-, -phagia, cardi-, -itis, path-.',
    kind: 'terminology',
  },
  {
    id: 14,
    authors: 'MedlinePlus',
    year: '2025',
    title: 'Endoscopy',
    container: 'MedlinePlus Medical Encyclopedia',
    details: 'U.S. National Library of Medicine. Reviewed April 21, 2025.',
    url: 'https://medlineplus.gov/ency/article/003338.htm',
    usedFor: 'Endoscope: a flexible tube with a camera and light; used to take biopsies.',
    kind: 'terminology',
  },
  {
    id: 15,
    authors: 'Columbia University Department of Surgery',
    year: '2015, November 12',
    title: 'History of medicine: Whipple’s improvised breakthrough',
    container: 'Columbia Surgery',
    url: 'https://columbiasurgery.org/news/2015/11/12/history-medicine-whipples-improvised-breakthrough',
    usedFor: 'Allen O. Whipple’s 1935 pancreatic operation at Columbia-Presbyterian.',
    kind: 'history',
  },
  {
    id: 16,
    authors: 'MedlinePlus',
    year: 'n.d.',
    title: 'Understanding medical words: A tutorial',
    container: 'MedlinePlus',
    details: 'U.S. National Library of Medicine.',
    url: 'https://medlineplus.gov/medwords/',
    usedFor: 'How medical words are built from parts, e.g. “-ology” means the study of something.',
    kind: 'terminology',
  },
  {
    id: 17,
    authors: 'Betts, J. G., Young, K. A., Wise, J. A., Johnson, E., Poe, B., Kruse, D. H., Korol, O., Johnson, J. E., Womble, M., & DeSaix, P.',
    year: '2022',
    title: 'Anatomy and physiology (2nd ed.), §23.1 Overview of the digestive system',
    container: 'OpenStax',
    url: 'https://openstax.org/books/anatomy-and-physiology-2e/pages/23-1-overview-of-the-digestive-system',
    usedFor: 'The four layers of the intestinal wall: mucosa, submucosa, muscularis and serosa.',
    kind: 'anatomy',
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
    what: '3D digestive organs, heart, brain and knee',
    creator: 'BodyParts3D, © The Database Center for Life Science (DBCLS)',
    license: 'CC BY-SA 2.1 Japan',
    url: 'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/download.html',
    note: 'Remeshed, simplified, shaded and combined for this exhibit; the modified models are shared under the same license.',
  },
  {
    what: 'Portrait of George Hoyt Whipple (1934)',
    creator: 'The Nobel Foundation, via Wikimedia Commons',
    license: 'Public domain (PD-Sweden-photo, PD-1996)',
    url: 'https://commons.wikimedia.org/wiki/File:George_Whipple_nobel.jpg',
  },
  {
    what: '1907 article page, naming paragraph and photomicrograph plates (Figs. 2 and 9)',
    creator: 'G. H. Whipple, Bulletin of the Johns Hopkins Hospital (1907); scan by the Internet Archive',
    license: 'Public domain (published 1907)',
    url: 'https://archive.org/details/sim_johns-hopkins-medical-journal_1907-09_18_198',
  },
  {
    what: 'Background film of an early-1900s laboratory',
    creator: 'AI-generated for this project with Google Vids',
    license: 'Illustrative reconstruction — not a historical record',
    note: 'No people are shown. It is only atmosphere behind the real archival images.',
  },
  {
    what: 'Tissue, villi, microscopic, diagnosis and PCR scenes; paper and grain textures',
    creator: 'Created for this project (procedural 3D and code)',
    license: 'Original work',
    note: 'Illustrations — not to scale; colors chosen for clarity.',
  },
  {
    what: 'Typefaces: Newsreader and Instrument Sans',
    creator: 'The Newsreader Project Authors; The Instrument Sans Project Authors',
    license: 'SIL Open Font License 1.1',
  },
];
