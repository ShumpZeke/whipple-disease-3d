import { describe, expect, it } from 'vitest';
import { periodLabel, SUBMISSION } from '../app/config';
import { MEDIA_CREDITS, SOURCES, SOURCE_BY_ID } from './citations';
import { GLOSSARY, TERM_BY_KEY } from './glossary';
import { QUESTIONS } from './quiz';
import { STEPS } from './story';

const allCaptionText = STEPS.flatMap((s) => s.captions.flatMap((c) => [c.title, ...c.body]));
const citeRefs = (t: string) => [...t.matchAll(/\{c:([\d,\s]+)\}/g)].flatMap((m) => m[1].split(',').map((n) => Number(n.trim())));
const termRefs = (t: string) => [...t.matchAll(/\{t:([a-z-]+)(?:\|[^}]+)?\}/g)].map((m) => m[1]);

describe('story order (storyboard)', () => {
  it('follows the required chronological order', () => {
    expect(STEPS.map((s) => s.id)).toEqual([
      'intro',
      'whipple',
      'case',
      'naming',
      'correction',
      'modern',
      'overview',
      'focus',
      'facts',
      'inside',
      'villi',
      'micro',
      'mechanism',
      'systems',
      'diagnosis',
      'treatment',
      'quiz',
      'end',
    ]);
  });

  it('has unique ids and at least one caption per step', () => {
    expect(new Set(STEPS.map((s) => s.id)).size).toBe(STEPS.length);
    for (const s of STEPS) expect(s.captions.length).toBeGreaterThan(0);
  });

  it('teaches at least four clinical facts, one at a time', () => {
    const facts = STEPS.find((s) => s.id === 'facts')!;
    expect(facts.captions).toHaveLength(4);
    for (const c of facts.captions) expect(citeRefs(c.body.join(' ')).length).toBeGreaterThan(0);
  });

  it('keeps the modern chapters on 3D worlds and history on HTML', () => {
    for (const id of ['whipple', 'case', 'naming', 'correction']) expect(STEPS.find((s) => s.id === id)!.world).toBe('none');
    for (const id of ['overview', 'focus', 'facts']) expect(STEPS.find((s) => s.id === id)!.world).toBe('anatomy');
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
    for (const id of cited) expect(SOURCE_BY_ID.has(id), `source ${id}`).toBe(true);
  });

  it('puts a source marker on every medical sentence block after the opening', () => {
    for (const s of STEPS) {
      if (['intro', 'quiz', 'end'].includes(s.id)) continue;
      for (const c of s.captions) {
        const cites = citeRefs(c.body.join(' '));
        expect(cites.length, `${s.id}: ${c.title}`).toBeGreaterThan(0);
      }
    }
  });

  it('credits the non-original media', () => {
    const text = MEDIA_CREDITS.map((c) => `${c.what} ${c.creator} ${c.license}`).join(' ');
    expect(text).toMatch(/BodyParts3D/);
    expect(text).toMatch(/CC BY-SA/);
    expect(text).toMatch(/Nobel Foundation/);
    expect(text).toMatch(/Internet Archive/);
    expect(text).toMatch(/AI-generated/);
  });
});

describe('medical terms', () => {
  it('defines every term used in the captions', () => {
    for (const k of allCaptionText.flatMap(termRefs)) expect(TERM_BY_KEY.has(k), k).toBe(true);
  });

  it('explains at least three terms with word parts or pronunciation', () => {
    const rich = GLOSSARY.filter((t) => (t.parts?.length ?? 0) > 0 && t.say);
    expect(rich.length).toBeGreaterThanOrEqual(3);
  });

  it('includes the key terms from the storyboard', () => {
    for (const k of ['villi', 'malabsorption', 'biopsy', 'pcr', 'tropheryma']) expect(TERM_BY_KEY.has(k)).toBe(true);
  });
});

describe('history accuracy', () => {
  const text = allCaptionText.join(' ');
  it('attributes the disease to George Hoyt Whipple and notes the list correction', () => {
    expect(text).toMatch(/George Hoyt Whipple/);
    expect(text).toMatch(/Allen O\. Whipple/);
    expect(text).toMatch(/1907/);
    expect(text).toMatch(/lipodystrophy/);
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
    expect(periodLabel()).toMatch(/^Period /);
  });
});
