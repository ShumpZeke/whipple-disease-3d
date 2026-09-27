import { beforeEach, describe, expect, it } from 'vitest';
import { QUESTIONS } from '../content/quiz';
import { STEPS, STEP_INDEX } from '../content/story';
import { quizScore, useStory } from './store';

const st = () => useStory.getState();

beforeEach(() => {
  st().restart();
  useStory.setState({ quizIndex: 0, quizAnswers: {}, quizFeedback: null });
});

describe('navigation', () => {
  it('walks forward through every step and sub-step, then stops at the end', () => {
    let moves = 0;
    const total = STEPS.reduce((n, s) => n + s.captions.length, 0);
    while (moves < 200) {
      const before = `${st().step}.${st().sub}`;
      st().next();
      if (`${st().step}.${st().sub}` === before) break;
      moves++;
    }
    expect(moves).toBe(total - 1);
    expect(st().step).toBe(STEPS.length - 1);
  });

  it('goes back into the last sub-step of the previous step', () => {
    st().goToId('inside');
    st().back();
    expect(STEPS[st().step].id).toBe('facts');
    expect(st().sub).toBe(3);
  });

  it('does not go before the opening', () => {
    st().back();
    expect(st().step).toBe(0);
  });

  it('clamps goTo and resets transient UI', () => {
    st().openTerm({ key: 'villi', rect: { left: 0, top: 0, width: 1, height: 1 } });
    st().goTo(999, 99);
    expect(st().step).toBe(STEPS.length - 1);
    expect(st().term).toBeNull();
  });

  it('restart returns to 1907 and clears the quiz', () => {
    st().goToId('quiz');
    st().answerChoice(0);
    st().restart();
    expect(st().step).toBe(0);
    expect(st().quizAnswers).toEqual({});
  });
});

describe('overlays', () => {
  it('opens the sources focused on a reference and closes with closeOverlays', () => {
    st().openSources(5);
    expect(st().sourcesOpen).toBe(true);
    expect(st().sourceFocus).toBe(5);
    st().closeOverlays();
    expect(st().sourcesOpen).toBe(false);
  });
});

describe('quiz', () => {
  it('scores first tries separately from solved questions', () => {
    st().goTo(STEP_INDEX.quiz);
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
  });
});
