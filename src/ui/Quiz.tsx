import { creditLine } from '../app/config';
import { scrollToStop } from '../app/journey';
import { quizScore, useStory } from '../app/store';
import { answerOf, QUESTIONS } from '../content/quiz';
import { SOURCES_PAGE } from '../content/story';
import { Cites } from './RichText';

const LETTERS = ['A', 'B', 'C', 'D'];

function verdict(right: number, total: number) {
  if (right === total) return 'Perfect score';
  if (right >= total - 1) return 'Great job';
  if (right >= Math.ceil(total / 2)) return 'Good work';
  return 'Worth another look';
}

/** A row of one mark per question: right, wrong, or not answered yet. */
function Progress({ current }: { current?: number }) {
  const answers = useStory((s) => s.quizAnswers);
  return (
    <span className="quiz__marks" aria-hidden="true">
      {QUESTIONS.map((q, i) => {
        const a = answers[q.id];
        return <i key={q.id} className={a ? (a.correct ? 'is-right' : 'is-wrong') : i === current ? 'is-now' : ''} />;
      })}
    </span>
  );
}

/** The quick check: five big multiple-choice questions, one try each, then the results. */
export function Quiz() {
  const quizIndex = useStory((s) => s.quizIndex);
  const answers = useStory((s) => s.quizAnswers);
  const answerChoice = useStory((s) => s.answerChoice);
  const nextQuestion = useStory((s) => s.nextQuestion);
  const retryQuiz = useStory((s) => s.retryQuiz);
  const restart = useStory((s) => s.restart);

  if (quizIndex >= QUESTIONS.length) {
    const score = quizScore(answers);
    return (
      <div className="quiz quiz--done" aria-live="polite" data-quiz="done">
        <p className="quiz__top">
          <span>Your results</span>
          <Progress />
        </p>
        <p className="quiz__score">
          <b>{score.right}</b>
          <span>/ {score.total}</span>
        </p>
        <p className="quiz__verdict">
          {score.percent}% correct. {verdict(score.right, score.total)}
        </p>
        <ol className="quiz__review">
          {QUESTIONS.map((q) => {
            const ok = answers[q.id]?.correct;
            return (
              <li key={q.id} className={ok ? 'is-right' : 'is-wrong'}>
                <span className="quiz__tick" aria-label={ok ? 'right' : 'wrong'}>
                  {ok ? '✓' : '✗'}
                </span>
                <span className="quiz__topic">{q.topic}</span>
                <span className="quiz__answer">{answerOf(q)}</span>
              </li>
            );
          })}
        </ol>
        <div className="quiz__actions">
          <button type="button" className="quiz__btn is-main" onClick={retryQuiz}>
            Try again
          </button>
          <button type="button" className="quiz__btn" onClick={() => scrollToStop(SOURCES_PAGE)}>
            References
          </button>
          <button type="button" className="quiz__btn" onClick={restart}>
            Start over
          </button>
        </div>
        <p className="caption__credit">{creditLine()}</p>
      </div>
    );
  }

  const q = QUESTIONS[quizIndex];
  const a = answers[q.id];
  return (
    <div key={q.id} className="quiz quiz-enter" aria-live="polite" data-question={q.id}>
      <p className="quiz__top">
        <span className="quiz__progress">
          Question {quizIndex + 1} of {QUESTIONS.length}
        </span>
        <Progress current={quizIndex} />
      </p>
      <h1 className="quiz__prompt">{q.prompt}</h1>
      <div className="quiz__options" role="group" aria-label="Answer choices">
        {q.options.map((o, i) => {
          const state = !a ? '' : o.correct ? ' is-right' : a.picked === i ? ' is-wrong' : ' is-dim';
          return (
            <button key={o.text} type="button" className={`quiz__opt${state}`} disabled={!!a} onClick={() => answerChoice(i)}>
              <b className="quiz__letter">{LETTERS[i]}</b>
              <span>{o.text}</span>
            </button>
          );
        })}
      </div>
      {a && (
        <div className="quiz__after">
          <p className={`quiz__feedback ${a.correct ? 'is-right' : 'is-wrong'}`} role="status">
            {a.correct ? 'Correct!' : `Not quite. It is: ${answerOf(q)}`} <Cites ids={q.cites} />
          </p>
          <button type="button" className="quiz__btn is-main" onClick={nextQuestion} autoFocus>
            {quizIndex === QUESTIONS.length - 1 ? 'See my results' : 'Next question'}
          </button>
        </div>
      )}
    </div>
  );
}
