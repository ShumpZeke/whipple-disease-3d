// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QUESTIONS } from '../content/quiz';
import { STOP_INDEX } from '../content/story';
import { quizScore, useStory } from './store';

const st = () => useStory.getState();

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  st().restart();
  useStory.setState({ stop: 0, quizIndex: 0, quizAnswers: {}, quizFeedback: null, mechanism: 'disease' });
});

describe('stops', () => {
  it('tracks the stop nearest to the scroll position and clears transient UI', () => {
    st().openTerm({ key: 'villi', rect: { left: 0, top: 0, width: 1, height: 1 } });
    st().setStop(STOP_INDEX.villi);
    expect(st().stop).toBe(STOP_INDEX.villi);
    expect(st().term).toBeNull();
  });

  it('puts the healthy/disease toggle back when leaving the symptoms stop', () => {
    st().setStop(STOP_INDEX.symptoms);
    st().setMechanism('healthy');
    st().setStop(STOP_INDEX.spread);
    expect(st().mechanism).toBe('disease');
  });

  it('restart scrolls back to 1907 and clears the quiz', () => {
    st().setStop(STOP_INDEX.quiz);
    st().answerOrgan('Stomach', 'stomach');
    st().restart();
    expect(st().quizAnswers).toEqual({});
    expect(st().quizIndex).toBe(0);
  });
});

describe('overlays', () => {
  it('opens the sources focused on a reference and closes with closeOverlays', () => {
    st().openSources(5);
    expect(st().sourcesOpen).toBe(true);
    expect(st().sourceFocus).toBe(5);
    st().openGlossary();
    expect(st().sourcesOpen).toBe(false);
    expect(st().glossaryOpen).toBe(true);
    st().closeOverlays();
    expect(st().glossaryOpen).toBe(false);
  });
});

describe('quiz', () => {
  it('scores first tries separately from solved questions', () => {
    st().setStop(STOP_INDEX.quiz);
    // Q1 (organ): wrong first, then right
    st().answerOrgan('Stomach', 'stomach');
    expect(st().quizFeedback?.correct).toBe(false);
    expect(st().quizFeedback?.text).toMatch(/stomach/);
    st().answerOrgan('SmallIntestine', 'small intestine');
    expect(st().quizFeedback?.correct).toBe(true);
    st().nextQuestion();
    // remaining choice questions: pick the correct option directly
    for (let i = 1; i < QUESTIONS.length; i++) {
      const q = QUESTIONS[i];
      if (q.kind !== 'choice') continue;
      st().answerChoice(q.options.findIndex((o) => o.correct));
      expect(st().quizFeedback?.correct).toBe(true);
      st().nextQuestion();
    }
    const score = quizScore(st().quizAnswers);
    expect(score.solved).toBe(QUESTIONS.length);
    expect(score.firstTry).toBe(QUESTIONS.length - 1);
    expect(st().quizIndex).toBe(QUESTIONS.length);
  });

  it('explains a wrong choice and lets the student try again', () => {
    useStory.setState({ quizIndex: QUESTIONS.findIndex((q) => q.kind === 'choice') });
    const q = QUESTIONS[st().quizIndex];
    if (q.kind !== 'choice') throw new Error('expected a choice question');
    st().answerChoice(q.options.findIndex((o) => !o.correct));
    expect(st().quizFeedback?.correct).toBe(false);
    st().answerChoice(q.options.findIndex((o) => o.correct));
    expect(st().quizAnswers[q.id]).toEqual({ firstTry: false, solved: true });
  });
});
