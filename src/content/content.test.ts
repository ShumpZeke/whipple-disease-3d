import { describe, expect, it } from 'vitest';
import { periodLabel, SUBMISSION } from '../app/config';
import { MEDIA_CREDITS, SOURCES, SOURCE_BY_ID } from './citations';
import { GLOSSARY, TERM_BY_KEY } from './glossary';
import { QUESTIONS } from './quiz';
import { FACTS, STOPS, STOP_INDEX } from './story';

const allCaptionText = STOPS.flatMap((s) => [s.title, s.text, s.note ?? '']);
const citeRefs = (t: string) => [...t.matchAll(/\{c:([\d,\s]+)\}/g)].flatMap((m) => m[1].split(',').map((n) => Number(n.trim())));
const termRefs = (t: string) => [...t.matchAll(/\{t:([a-z-]+)(?:\|[^}]+)?\}/g)].map((m) => m[1]);

describe('the one-page journey (storyboard order)', () => {
  it('zooms from 1907 down to the germ, then out to diagnosis, treatment and the self-check', () => {
    expect(STOPS.map((s) => s.id)).toEqual([
      'title',
      'doctor',
      'case',
      'name',
      'body',
      'intestine',
      'wall',
      'villi',
      'cause',
      'symptoms',
      'spread',
      'biopsy',
      'stain',
      'pcr',
      'treatment',
      'quiz',
      'end',
    ]);
  });

  it('has unique ids and a caption on every stop', () => {
    expect(new Set(STOPS.map((s) => s.id)).size).toBe(STOPS.length);
    for (const s of STOPS) {
      expect(s.title.length, s.id).toBeGreaterThan(0);
      if (s.id !== 'quiz') expect(s.text.length, s.id).toBeGreaterThan(0);
    }
  });

  it('keeps every caption short enough to read out from the board', () => {
    for (const s of STOPS) {
      const words = s.text.replace(/\{c:[^}]+\}/g, '').split(/\s+/).filter(Boolean).length;
      expect(words, s.id).toBeLessThanOrEqual(26);
      expect(s.title.split(/\s+/).length, s.id).toBeLessThanOrEqual(6);
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
    expect(featured.filter((s) => (TERM_BY_KEY.get(s.term!)?.parts?.length ?? 0) > 0).length).toBeGreaterThanOrEqual(5);
  });

  it('sums up the four facts on the last stop', () => {
    expect(FACTS.map((f) => f.label)).toEqual(['Cause', 'Symptoms', 'Diagnosis', 'Treatment']);
    for (const f of FACTS) expect(f.cites.length, f.label).toBeGreaterThan(0);
  });

  it('teaches four numbered clinical facts: cause, symptoms, diagnosis, treatment', () => {
    const facts = new Map<number, string[]>();
    for (const s of STOPS) {
      const m = s.eyebrow.match(/^Fact (\d)/);
      if (m) facts.set(Number(m[1]), [...(facts.get(Number(m[1])) ?? []), s.id]);
    }
    expect([...facts.keys()].sort()).toEqual([1, 2, 3, 4]);
    expect(facts.get(1)).toContain('cause');
    expect(facts.get(2)).toContain('symptoms');
    expect(facts.get(3)).toContain('biopsy');
    expect(facts.get(4)).toContain('treatment');
  });

  it('tells the history on the page and the modern story in 3D', () => {
    for (const id of ['title', 'doctor', 'case', 'name'] as const) {
      expect(STOPS[STOP_INDEX[id]].world).toBe('none');
      expect(STOPS[STOP_INDEX[id]].scene).toBe('history');
    }
    for (const s of STOPS.slice(STOP_INDEX.body)) expect(s.world, s.id).not.toBe('none');
  });
});

describe('citations', () => {
  it('has at least three credible sources with URLs', () => {
    expect(SOURCES.length).toBeGreaterThanOrEqual(3);
    for (const s of SOURCES) expect(s.url).toMatch(/^https:\/\//);
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
  });

  it('never cites a missing source', () => {
    const cited = [
      ...allCaptionText.flatMap(citeRefs),
      ...GLOSSARY.flatMap((t) => t.cites),
      ...QUESTIONS.flatMap((q) => q.cites),
    ];
    for (const id of [...cited, ...FACTS.flatMap((f) => f.cites)]) expect(SOURCE_BY_ID.has(id), `source ${id}`).toBe(true);
  });

  it('puts a source marker on every stop that states a fact', () => {
    for (const s of STOPS) {
      if (['title', 'quiz', 'end'].includes(s.id)) continue;
      expect(citeRefs(s.text).length, s.id).toBeGreaterThan(0);
    }
  });

  it('credits the non-original media', () => {
    const text = MEDIA_CREDITS.map((c) => `${c.what} ${c.creator} ${c.license}`).join(' ');
    expect(text).toMatch(/BodyParts3D/);
    expect(text).toMatch(/CC BY-SA/);
    expect(text).toMatch(/Nobel Foundation/);
    expect(text).toMatch(/Internet Archive/);
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
    for (const k of ['villi', 'malabsorption', 'biopsy', 'pcr', 'tropheryma']) expect(TERM_BY_KEY.has(k)).toBe(true);
  });
});

describe('history accuracy', () => {
  const text = allCaptionText.join(' ');
  it('attributes the disease to George Hoyt Whipple (1907) and corrects the class list', () => {
    expect(text).toMatch(/George Hoyt Whipple/);
    expect(text).toMatch(/1907/);
    // his 1907 name for it, shown as the key term on the “name” stop
    expect(STOPS[STOP_INDEX.name].term).toBe('lipodystrophy');
    const note = STOPS[STOP_INDEX.name].note ?? '';
    expect(note).toMatch(/Allen Whipple/);
    expect(note).toMatch(/Allen O\. Whipple/);
    expect(citeRefs(note).length).toBeGreaterThan(0);
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
});

describe('submission details', () => {
  it('names the student and shows an editable class period', () => {
    expect(SUBMISSION.studentName).toBe('Vardhmansinh Rathod');
    expect(SUBMISSION.course).toBe('Medical Terminology');
    expect(SUBMISSION.classPeriod).toBe('3rd Block');
    expect(periodLabel()).toBe('3rd Block');
  });
});
