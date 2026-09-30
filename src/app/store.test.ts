// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { QUESTIONS } from '../content/quiz';
import { STOP_INDEX } from '../content/story';
import { quizScore, useStory } from './store';

const st = () => useStory.getState();

beforeEach(() => {
  window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  st().restart();
  useStory.setState({ stop: 0, quizIndex: 0, quizAnswers: {}, quizFeedback: null });
});

describe('stops', () => {
  it('tracks the stop nearest to the scroll position and clears transient UI', () => {
    st().openTerm({ key: 'nephron', rect: { left: 0, top: 0, width: 1, height: 1 } });
    st().setStop(STOP_INDEX.nephron);
    expect(st().stop).toBe(STOP_INDEX.nephron);
    expect(st().term).toBeNull();
  });

  it('restart scrolls back to the start and clears the quiz', () => {
    st().setStop(STOP_INDEX.quiz);
    st().answerChoice(0);
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
  it('scores one try per question and adds up the results', () => {
    st().setStop(STOP_INDEX.quiz);
    // the first question wrong, the rest right
    st().answerChoice(QUESTIONS[0].options.findIndex((o) => !o.correct));
    expect(st().quizFeedback?.correct).toBe(false);
    st().nextQuestion();
    for (let i = 1; i < QUESTIONS.length; i++) {
      st().answerChoice(QUESTIONS[i].options.findIndex((o) => o.correct));
      expect(st().quizFeedback?.correct).toBe(true);
      st().nextQuestion();
    }
    const score = quizScore(st().quizAnswers);
    expect(score).toEqual({ right: QUESTIONS.length - 1, total: QUESTIONS.length, percent: Math.round(((QUESTIONS.length - 1) / QUESTIONS.length) * 100) });
    expect(st().quizIndex).toBe(QUESTIONS.length);
  });

  it('keeps the first answer: a second click does not change it', () => {
    const q = QUESTIONS[0];
    const wrong = q.options.findIndex((o) => !o.correct);
    st().answerChoice(wrong);
    st().answerChoice(q.options.findIndex((o) => o.correct));
    expect(st().quizAnswers[q.id]).toEqual({ picked: wrong, correct: false });
  });

  it('can be taken again', () => {
    st().answerChoice(0);
    st().nextQuestion();
    st().retryQuiz();
    expect(st().quizIndex).toBe(0);
    expect(st().quizAnswers).toEqual({});
  });
});
