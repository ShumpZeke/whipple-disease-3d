import { describe, expect, it } from 'vitest';
import { names, periodLabel, SUBMISSION } from '../app/config';
import { MEDIA_CREDITS, SOURCES, SOURCE_BY_ID } from './citations';
import { GLOSSARY, TERM_BY_KEY } from './glossary';
import { QUESTIONS } from './quiz';
import { FACTS, QA, SECTIONS, STOPS, STOP_INDEX } from './story';

const allCaptionText = STOPS.flatMap((s) => [s.title, s.text, s.note ?? '']);
const citeRefs = (t: string) => [...t.matchAll(/\{c:([\d,\s]+)\}/g)].flatMap((m) => m[1].split(',').map((n) => Number(n.trim())));
const termRefs = (t: string) => [...t.matchAll(/\{t:([a-z-]+)(?:\|[^}]+)?\}/g)].map((m) => m[1]);

describe('the one-page journey (storyboard order)', () => {
  it('goes from Max Wilms into the kidney, down to its cells, then out to signs, scans, treatment, a summary and the self-check', () => {
    expect(STOPS.map((s) => s.id)).toEqual([
      'title',
      'doctor',
      'book',
      'name',
      'body',
      'kidneys',
      'inside',
      'nephron',
      'cause',
      'genes',
      'lump',
      'signs',
      'ultrasound',
      'scans',
      'treatment',
      'outlook',
      'end',
      'quiz',
    ]);
  });

  it('has unique ids and a caption on every stop', () => {
    expect(new Set(STOPS.map((s) => s.id)).size).toBe(STOPS.length);
    for (const s of STOPS) {
      expect(s.title.length, s.id).toBeGreaterThan(0);
      if (s.id !== 'quiz') expect(s.text.length, s.id).toBeGreaterThan(0);
    }
  });

  it('keeps every caption to a couple of short, simple sentences', () => {
    for (const s of STOPS) {
      const words = s.text.replace(/\{c:[^}]+\}/g, '').split(/\s+/).filter(Boolean).length;
      expect(words, s.id).toBeLessThanOrEqual(24);
      const sentences = s.text.replace(/\{c:[^}]+\}/g, '').split(/[.?!](\s|$)/).filter((x) => x.trim().length > 1);
      expect(sentences.length, s.id).toBeLessThanOrEqual(3);
      expect(s.title.split(/\s+/).length, s.id).toBeLessThanOrEqual(6);
    }
  });

  it('writes plain sentences on screen: no em dashes, dots between words or fact numbers', () => {
    const onScreen = [
      ...STOPS.flatMap((s) => [s.title, s.text, s.note ?? '']),
      ...QUESTIONS.flatMap((q) => [q.prompt, q.correct, ...(q.kind === 'choice' ? q.options.flatMap((o) => [o.text, o.why ?? '']) : [q.retry])]),
      ...GLOSSARY.flatMap((t) => [t.short, t.definition]),
    ];
    for (const line of onScreen) {
      expect(line, line).not.toMatch(/[—·]/);
      expect(line, line).not.toMatch(/\bFact \d/);
    }
  });

  it('gives the presenter a script for every stop', () => {
    for (const s of STOPS) expect(s.say.split(/\s+/).length, s.id).toBeGreaterThanOrEqual(12);
  });

  it('features a key term, split into word parts, on most stops', () => {
    const featured = STOPS.filter((s) => s.term);
    expect(featured.length).toBeGreaterThanOrEqual(6);
    for (const s of featured) {
      const t = TERM_BY_KEY.get(s.term!);
      expect(t, s.id).toBeDefined();
      expect(t!.short.length, s.id).toBeGreaterThan(0);
    }
    expect(featured.filter((s) => (TERM_BY_KEY.get(s.term!)?.parts?.length ?? 0) > 0).length).toBeGreaterThanOrEqual(3);
  });

  it('covers four clinical facts, each with sources: cause, symptoms, diagnosis, treatment', () => {
    expect(FACTS.map((f) => f.label)).toEqual(['Cause', 'Symptoms', 'Diagnosis', 'Treatment']);
    for (const f of FACTS) expect(f.cites.length, f.label).toBeGreaterThan(0);
    for (const id of ['cause', 'genes', 'lump', 'signs', 'ultrasound', 'scans', 'treatment'] as const) {
      expect(citeRefs(STOPS[STOP_INDEX[id]].text).length, id).toBeGreaterThan(0);
    }
  });

  it('tells the history on the page and the modern story in 3D', () => {
    for (const id of ['title', 'doctor', 'book', 'name'] as const) {
      expect(STOPS[STOP_INDEX[id]].world).toBe('none');
      expect(STOPS[STOP_INDEX[id]].scene).toBe('history');
    }
    for (const s of STOPS.slice(STOP_INDEX.body)) expect(s.world, s.id).not.toBe('none');
  });

  it('lists the parts of the talk on the home screen, ending with the sources', () => {
    expect(SECTIONS[0].title).toBe('History');
    expect(SECTIONS.at(-1)?.title).toBe('Sources');
    for (let i = 1; i < SECTIONS.length; i++) expect(SECTIONS[i].stop).toBeGreaterThan(SECTIONS[i - 1].stop);
  });
});

describe('citations', () => {
  it('has at least three credible sources with URLs', () => {
    expect(SOURCES.length).toBeGreaterThanOrEqual(3);
    for (const s of SOURCES) expect(s.url).toMatch(/^https:\/\//);
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    SOURCES.forEach((s, i) => expect(s.id).toBe(i + 1));
  });

  it('never cites a missing source', () => {
    const cited = [
      ...allCaptionText.flatMap(citeRefs),
      ...GLOSSARY.flatMap((t) => t.cites),
      ...QUESTIONS.flatMap((q) => q.cites),
      ...FACTS.flatMap((f) => f.cites),
      ...QA.flatMap((x) => x.cites),
    ];
    for (const id of cited) expect(SOURCE_BY_ID.has(id), `source ${id}`).toBe(true);
  });

  it('uses every source somewhere', () => {
    const cited = new Set([
      ...allCaptionText.flatMap(citeRefs),
      ...GLOSSARY.flatMap((t) => t.cites),
      ...QUESTIONS.flatMap((q) => q.cites),
      ...FACTS.flatMap((f) => f.cites),
      ...QA.flatMap((x) => x.cites),
    ]);
    // the scene labels cite 14 (kidney parts); everything else is cited in the text
    for (const s of SOURCES) if (s.id !== 14) expect(cited.has(s.id), `source ${s.id}`).toBe(true);
  });

  it('puts a source marker on every stop that states a fact', () => {
    for (const s of STOPS) {
      if (['quiz'].includes(s.id)) continue;
      expect(citeRefs(s.text).length, s.id).toBeGreaterThan(0);
    }
  });

  it('credits the non-original media', () => {
    const text = MEDIA_CREDITS.map((c) => `${c.what} ${c.creator} ${c.license}`).join(' ');
    expect(text).toMatch(/BodyParts3D/);
    expect(text).toMatch(/CC BY-SA/);
    expect(text).toMatch(/Wellcome Collection/);
    expect(text).toMatch(/CC BY 4\.0/);
    expect(text).toMatch(/AI assistant/);
  });
});

describe('medical terms', () => {
  it('defines every term used in the captions', () => {
    for (const k of allCaptionText.flatMap(termRefs)) expect(TERM_BY_KEY.has(k), k).toBe(true);
  });

  it('uses at least three medical terms in the captions', () => {
    const used = new Set([...allCaptionText.flatMap(termRefs), ...STOPS.flatMap((s) => (s.term ? [s.term] : []))]);
    expect(used.size).toBeGreaterThanOrEqual(3);
  });

  it('explains at least three terms with word parts and pronunciation', () => {
    const rich = GLOSSARY.filter((t) => (t.parts?.length ?? 0) > 0 && t.say);
    expect(rich.length).toBeGreaterThanOrEqual(3);
  });

  it('includes the key terms from the storyboard', () => {
    for (const k of ['wilms', 'nephroblastoma', 'nephron', 'hematuria', 'nephrectomy', 'ultrasound']) expect(TERM_BY_KEY.has(k), k).toBe(true);
  });

  it('breaks nephroblastoma into kidney + bud + tumor', () => {
    const parts = TERM_BY_KEY.get('nephroblastoma')!.parts!.map((p) => p.meaning);
    expect(parts).toEqual(['kidney', 'bud or germ', 'tumor']);
  });
});

describe('history accuracy', () => {
  const text = allCaptionText.join(' ');
  it('names Max Wilms, his dates and his 1899 book', () => {
    expect(text).toMatch(/Max Wilms/);
    expect(text).toMatch(/1867 to 1918/);
    expect(text).toMatch(/The Mixed Tumors of the Kidney/);
    expect(STOPS[STOP_INDEX.name].term).toBe('nephroblastoma');
    expect(citeRefs(STOPS[STOP_INDEX.name].note ?? '').length).toBeGreaterThan(0);
  });
});

describe('quiz', () => {
  it('has 2–4 questions, one answered on the 3D model', () => {
    expect(QUESTIONS.length).toBeGreaterThanOrEqual(2);
    expect(QUESTIONS.length).toBeLessThanOrEqual(4);
    expect(QUESTIONS.some((q) => q.kind === 'organ')).toBe(true);
  });

  it('has exactly one correct option per multiple-choice question', () => {
    for (const q of QUESTIONS) if (q.kind === 'choice') expect(q.options.filter((o) => o.correct)).toHaveLength(1);
  });

  it('accepts either kidney for the organ question', () => {
    const q = QUESTIONS.find((x) => x.kind === 'organ');
    expect(q?.kind === 'organ' && q.answer).toEqual(['LeftKidney', 'RightKidney']);
  });
});

describe('submission details', () => {
  it('names the student and shows an editable class period', () => {
    expect(SUBMISSION.studentName).toBe('Vardhmansinh Rathod');
    expect(names()).toBe('Vardhmansinh Rathod, Eren Robinson and Shanya Prezy');
    expect(SUBMISSION.course).toBe('Medical Terminology');
    expect(SUBMISSION.classPeriod).toBe('3rd Block');
    expect(periodLabel()).toBe('3rd Block');
    expect(SUBMISSION.assignedEponym).toMatch(/Wilms tumor/);
  });
});
