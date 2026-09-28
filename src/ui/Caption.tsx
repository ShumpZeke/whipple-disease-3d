import { useRef } from 'react';
import { creditLine } from '../app/config';
import { scrollToStop, stopPresence } from '../app/journey';
import { useStory } from '../app/store';
import { TERM_BY_KEY } from '../content/glossary';
import { FACTS, SOURCES_PAGE, STOPS } from '../content/story';
import { Quiz } from './Quiz';
import { Cites, RichText, TermButton } from './RichText';
import { useJourney } from './useJourney';

/** The stop's key medical term, broken into its word parts: “arthr- joint + -algia pain = joint pain”. */
function KeyTerm({ termKey, label = 'Key term' }: { termKey: string; label?: string }) {
  const t = TERM_BY_KEY.get(termKey);
  if (!t) return null;
  const name = t.term.replace(/\s*\(.*\)$/, '');
  return (
    <div className="keyterm">
      <p className="keyterm__head">
        <span className="keyterm__label">{label}</span>
        <TermButton termKey={t.key}>{t.key === 'tropheryma' ? <i>{name}</i> : name}</TermButton>
        {t.say && <span className="keyterm__say">say “{t.say}”</span>}
      </p>
      <p className="keyterm__parts">
        {t.parts?.map((p, i) => (
          <span key={p.part} className="keyterm__part">
            {i > 0 && <span className="keyterm__op"> + </span>}
            <b>{p.part}</b> {p.meaning}
          </span>
        ))}
        <span className="keyterm__meaning">
          {t.parts?.length ? <span className="keyterm__op"> = </span> : null}
          {t.short}
        </span>{' '}
        <Cites ids={t.cites.slice(0, 2)} />
      </p>
    </div>
  );
}

function Extras({ id }: { id: string }) {
  const mechanism = useStory((s) => s.mechanism);
  const setMechanism = useStory((s) => s.setMechanism);
  const restart = useStory((s) => s.restart);

  switch (id) {
    case 'body':
      return (
        <dl className="chips">
          <div>
            <dt>Body system</dt>
            <dd>Digestive system</dd>
          </div>
          <div>
            <dt>Specialty</dt>
            <dd>Gastroenterology</dd>
          </div>
          <div>
            <dt>Modern spelling</dt>
            <dd>Whipple disease</dd>
          </div>
        </dl>
      );
    case 'symptoms':
      return (
        <>
          <div className="caption__actions" role="group" aria-label="Compare villi">
            <button type="button" className="pill" aria-pressed={mechanism === 'healthy'} onClick={() => setMechanism('healthy')}>
              Healthy villi
            </button>
            <button type="button" className="pill" aria-pressed={mechanism === 'disease'} onClick={() => setMechanism('disease')}>
              Whipple’s disease
            </button>
          </div>
          <div className={`absorb absorb--${mechanism}`} aria-live="polite">
            <div className="absorb__row">
              <span>Absorbed</span>
              <span className="absorb__bar">
                <span className="absorb__fill absorb__fill--in" />
              </span>
            </div>
            <div className="absorb__row">
              <span>Lost</span>
              <span className="absorb__bar">
                <span className="absorb__fill absorb__fill--out" />
              </span>
            </div>
          </div>
        </>
      );
    case 'treatment':
      return (
        <div className="timeline" aria-label="Typical treatment timeline">
          <div className="timeline__step">
            <span className="timeline__bar" />
            <span>
              <b>IV antibiotics</b>
              <br />
              2–4 weeks
            </span>
          </div>
          <div className="timeline__step">
            <span className="timeline__bar" />
            <span>
              <b>Antibiotic pills</b>
              <br />≈ 1 year
            </span>
          </div>
          <div className="timeline__step">
            <span className="timeline__bar" />
            <span>
              <b>Check-ups</b>
              <br />
              it can come back
            </span>
          </div>
        </div>
      );
    case 'end':
      return (
        <>
          <ol className="facts">
            {FACTS.map((f) => (
              <li key={f.label}>
                <b>{f.label}:</b> <RichText text={f.text} /> <Cites ids={f.cites} />
              </li>
            ))}
          </ol>
          <div className="caption__actions">
            <button type="button" className="pill pill--primary" onClick={() => scrollToStop(SOURCES_PAGE)}>
              Sources ↓
            </button>
            <button type="button" className="pill" onClick={restart}>
              Back to 1907
            </button>
          </div>
          <p className="caption__credit">{creditLine()}</p>
        </>
      );
    default:
      return null;
  }
}

/** The caption of the nearest stop. It fades and drifts with the scroll, so it never feels like a slide change. */
export function Caption() {
  const stop = useStory((s) => s.stop);
  const s = STOPS[stop];
  const ref = useRef<HTMLElement>(null);
  useJourney(
    (t) => {
      const el = ref.current;
      if (!el) return;
      const p = stopPresence(t, stop);
      el.style.opacity = String(p);
      el.style.transform = `translateY(${((stop - t) * 36).toFixed(1)}px)`;
      el.style.visibility = p < 0.01 ? 'hidden' : 'visible';
    },
    [stop],
  );
  if (s.id === 'title') return null;
  if (s.id === 'quiz')
    return (
      <section ref={ref} className="caption caption--quiz" data-step="quiz">
        <Quiz />
      </section>
    );
  return (
    <section ref={ref} key={s.id} className="caption" aria-live="polite" aria-label={s.title.replace(/\*/g, '')} data-step={s.id}>
      <p className="caption__eyebrow">{s.eyebrow}</p>
      <h1 className="caption__title">
        <RichText text={s.title} />
      </h1>
      {s.text && (
        <p className="caption__body">
          <RichText text={s.text} />
        </p>
      )}
      {s.note && (
        <p className="caption__note">
          <RichText text={s.note} />
        </p>
      )}
      {s.term && <KeyTerm termKey={s.term} label={s.termLabel} />}
      <Extras id={s.id} />
      {s.hint && <p className="caption__hint">{s.hint}</p>}
    </section>
  );
}
