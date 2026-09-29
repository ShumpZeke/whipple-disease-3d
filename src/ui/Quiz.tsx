import { useState } from 'react';
import { creditLine } from '../app/config';
import { scrollToStop } from '../app/journey';
import { quizScore, useStory } from '../app/store';
import { SOURCES_PAGE } from '../content/story';
import { QUESTIONS } from '../content/quiz';
import { ORGANS, ORGAN_IDS } from '../three/anatomy/organs';
import { Cites } from './RichText';

/** The self-check: short questions, answered by tapping the model or a choice. */
export function Quiz() {
  const quizIndex = useStory((s) => s.quizIndex);
  const answers = useStory((s) => s.quizAnswers);
  const feedback = useStory((s) => s.quizFeedback);
  const answerChoice = useStory((s) => s.answerChoice);
  const answerOrgan = useStory((s) => s.answerOrgan);
  const nextQuestion = useStory((s) => s.nextQuestion);
  const [picked, setPicked] = useState<Record<string, number[]>>({});
  const [showList, setShowList] = useState(false);
  const restart = useStory((s) => s.restart);

  if (quizIndex >= QUESTIONS.length) {
    const score = quizScore(answers);
    return (
      <div aria-live="polite" data-quiz="done">
        <h1 className="caption__title">Nicely done</h1>
        <p className="caption__body">
          All {score.total} answers found, {score.firstTry} on the first try.
        </p>
        <div className="caption__links">
          <button type="button" className="text-link" onClick={() => scrollToStop(SOURCES_PAGE)}>
            Sources
          </button>
          <button type="button" className="text-link" onClick={restart}>
            Start again
          </button>
        </div>
        <p className="caption__credit">{creditLine()}</p>
      </div>
    );
  }

  const q = QUESTIONS[quizIndex];
  const solved = answers[q.id]?.solved;
  const tried = picked[q.id] ?? [];

  return (
    <div key={q.id} className="quiz-enter" aria-live="polite" data-question={q.id}>
      <p className="quiz__progress">
        Question {quizIndex + 1} of {QUESTIONS.length}
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
        <div className="caption__links">
          <button type="button" className="text-link" aria-expanded={showList} onClick={() => setShowList((v) => !v)}>
            {showList ? 'Hide the list' : 'Pick from a list'}
          </button>
          {showList &&
            ORGAN_IDS.map((id) => (
              <button key={id} type="button" className="text-link" onClick={() => answerOrgan(id, ORGANS[id].name)}>
                {ORGANS[id].name}
              </button>
            ))}
        </div>
      )}

      {feedback && (
        <p className={`quiz__feedback ${feedback.correct ? 'is-right' : 'is-wrong'}`} role="status">
          {feedback.text} {feedback.correct && <Cites ids={q.cites} />}
        </p>
      )}

      {solved && (
        <div className="caption__links">
          <button type="button" className="text-link" onClick={nextQuestion} autoFocus>
            {quizIndex === QUESTIONS.length - 1 ? 'See how you did' : 'Next question'}
          </button>
        </div>
      )}
    </div>
  );
}
