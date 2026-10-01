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

function Person() {
  return (
    <svg viewBox="0 0 24 36" aria-hidden="true">
      <circle cx="12" cy="6" r="4" />
      <path d="M7.2 13.2c0-2 1.7-3.7 3.7-3.7h2.2c2 0 3.7 1.7 3.7 3.7v8.2h-2.7V34h-4.2V21.4H7.2z" />
    </svg>
  );
}

/** A small visual that changes with the question without giving the answer away before a choice. */
function QuestionVisual({ id, revealed }: { id: string; revealed: boolean }) {
  if (id === 'cured') {
    return (
      <div className={`qviz qviz--people${revealed ? ' is-revealed' : ''}`} role="img" aria-label={revealed ? 'About 9 out of 10 children survive' : 'Ten children'}>
        <div className="qviz__people" aria-hidden="true">
          {Array.from({ length: 10 }, (_, i) => (
            <i key={i} className={revealed && i < 9 ? 'is-on' : ''}>
              <Person />
            </i>
          ))}
        </div>
        <p>{revealed ? 'about 9 in 10' : 'How many out of 10?'}</p>
      </div>
    );
  }

  if (id === 'who') {
    return (
      <div className={`qviz qviz--age${revealed ? ' is-revealed' : ''}`} role="img" aria-label={revealed ? 'Ages 2 through 5 highlighted' : 'Age scale from birth to 10'}>
        <div className="qviz__agebar" aria-hidden="true">
          {Array.from({ length: 11 }, (_, age) => (
            <span key={age} className={revealed && age >= 2 && age <= 5 ? 'is-on' : ''}>
              <i />
              <b>{age}</b>
            </span>
          ))}
        </div>
        <p>{revealed ? 'usually ages 2–5' : 'age at diagnosis'}</p>
      </div>
    );
  }

  if (id === 'name') {
    const parts = [
      ['nephro', 'kidney'],
      ['blast', 'young cell'],
      ['oma', 'tumor'],
    ];
    return (
      <div className={`qviz qviz--word${revealed ? ' is-revealed' : ''}`} role="img" aria-label={revealed ? 'Nephro means kidney, blast means young cell, oma means tumor' : 'The word nephroblastoma split into three parts'}>
        <div className="qviz__wordparts">
          {parts.map(([part, meaning]) => (
            <span key={part}>
              <b>{part}</b>
              <small>{revealed ? meaning : '?'}</small>
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (id === 'test') {
    return (
      <div className={`qviz qviz--scan${revealed ? ' is-revealed' : ''}`} role="img" aria-label={revealed ? 'Ultrasound screen with sound waves' : 'Medical scan screen'}>
        <div className="qviz__monitor" aria-hidden="true">
          <span className="qviz__screen">
            <i className="qviz__scan-shape" />
            {revealed && <i className="qviz__waves" />}
          </span>
          <span className="qviz__stand" />
        </div>
        <p>{revealed ? 'ultrasound first' : 'which scan comes first?'}</p>
      </div>
    );
  }

  if (id === 'where') {
    return (
      <div className={`qviz qviz--body${revealed ? ' is-revealed' : ''}`} role="img" aria-label={revealed ? 'The kidneys are highlighted' : 'Body diagram with several possible organ areas'}>
        <svg viewBox="0 0 180 120" aria-hidden="true">
          <path className="qviz__torso" d="M63 18c8-8 46-8 54 0 7 7 9 17 8 29l-4 52H59l-4-52c-1-12 1-22 8-29z" />
          <ellipse className="qviz__candidate" cx="74" cy="42" rx="14" ry="10" />
          <ellipse className="qviz__candidate" cx="106" cy="42" rx="14" ry="10" />
          <ellipse className="qviz__candidate" cx="90" cy="62" rx="17" ry="9" />
          <path className={`qviz__kidney${revealed ? ' is-on' : ''}`} d="M68 61c-10 1-14 10-11 20 3 10 12 14 19 7 5-5 3-10 7-15-3-8-7-13-15-12z" />
          <path className={`qviz__kidney${revealed ? ' is-on' : ''}`} d="M112 61c10 1 14 10 11 20-3 10-12 14-19 7-5-5-3-10-7-15 3-8 7-13 15-12z" />
          <ellipse className="qviz__candidate" cx="90" cy="91" rx="9" ry="7" />
        </svg>
        <p>{revealed ? 'starts in a kidney' : 'where does it start?'}</p>
      </div>
    );
  }

  return null;
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
            Sources
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
      <QuestionVisual id={q.id} revealed={!!a} />
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
