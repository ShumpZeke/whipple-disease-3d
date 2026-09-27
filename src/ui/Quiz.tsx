import { useState } from 'react';
import { quizScore, useStory } from '../app/store';
import { QUESTIONS } from '../content/quiz';
import { ORGANS, ORGAN_IDS } from '../three/anatomy/organs';
import { Cites } from './RichText';

export function Quiz() {
  const quizIndex = useStory((s) => s.quizIndex);
  const answers = useStory((s) => s.quizAnswers);
  const feedback = useStory((s) => s.quizFeedback);
  const answerChoice = useStory((s) => s.answerChoice);
  const answerOrgan = useStory((s) => s.answerOrgan);
  const nextQuestion = useStory((s) => s.nextQuestion);
  const next = useStory((s) => s.next);
  const [picked, setPicked] = useState<Record<string, number[]>>({});
  const [showList, setShowList] = useState(false);

  if (quizIndex >= QUESTIONS.length) {
    const score = quizScore(answers);
    return (
      <section className="caption caption-enter" aria-live="polite" data-step="quiz">
        <p className="caption__eyebrow">Quick self-check · done</p>
        <h1 className="caption__title">Nicely done</h1>
        <p className="quiz__done">
          You found all {score.total} answers — {score.firstTry} on the first try. Every answer is backed by the sources
          you saw along the way.
        </p>
        <div className="caption__actions">
          <button type="button" className="pill" onClick={next}>
            Continue
          </button>
        </div>
      </section>
    );
  }

  const q = QUESTIONS[quizIndex];
  const solved = answers[q.id]?.solved;
  const tried = picked[q.id] ?? [];

  return (
    <section key={q.id} className="caption caption-enter" aria-live="polite" data-step="quiz" data-question={q.id}>
      <p className="quiz__progress">
        Self-check · {quizIndex + 1} of {QUESTIONS.length}
      </p>
      <h1 className="quiz__prompt">{q.prompt}</h1>

      {q.kind === 'choice' && (
        <div className="quiz__options" role="group" aria-label="Answer choices">
          {q.options.map((o, i) => {
            const state = tried.includes(i) ? (o.correct ? ' is-right' : ' is-wrong') : '';
            return (
              <button
                key={o.text}
                type="button"
                className={`quiz__opt${state}`}
                disabled={!!solved && !o.correct}
                onClick={() => {
                  setPicked((p) => ({ ...p, [q.id]: [...(p[q.id] ?? []), i] }));
                  answerChoice(i);
                }}
              >
                {o.text}
              </button>
            );
          })}
        </div>
      )}

      {q.kind === 'organ' && !solved && (
        <div className="caption__actions">
          <button type="button" className="pill" aria-expanded={showList} onClick={() => setShowList((v) => !v)}>
            {showList ? 'Hide organ list' : 'Choose from a list instead'}
          </button>
          {showList &&
            ORGAN_IDS.map((id) => (
              <button key={id} type="button" className="pill" onClick={() => answerOrgan(id, ORGANS[id].name)}>
                {ORGANS[id].name}
              </button>
            ))}
        </div>
      )}

      {feedback && (
        <p className={`quiz__feedback ${feedback.correct ? 'is-right' : 'is-wrong'}`} role="status">
          <span aria-hidden="true">{feedback.correct ? '✓' : '↺'}</span>
          <span>
            {feedback.text} {feedback.correct && <Cites ids={q.cites} />}
          </span>
        </p>
      )}

      {solved && (
        <div className="caption__actions">
          <button type="button" className="pill" onClick={nextQuestion} autoFocus>
            {quizIndex === QUESTIONS.length - 1 ? 'See results' : 'Next question'}
          </button>
        </div>
      )}
    </section>
  );
}
