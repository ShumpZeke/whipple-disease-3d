import { useRef } from 'react';
import { creditLine } from '../app/config';
import { stopPresence } from '../app/journey';
import { useStory } from '../app/store';
import { STOPS } from '../content/story';
import { Quiz } from './Quiz';
import { RichText } from './RichText';
import { useJourney } from './useJourney';

function Extras({ id }: { id: string }) {
  const mechanism = useStory((s) => s.mechanism);
  const setMechanism = useStory((s) => s.setMechanism);
  const openSources = useStory((s) => s.openSources);
  const openGlossary = useStory((s) => s.openGlossary);
  const restart = useStory((s) => s.restart);

  switch (id) {
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
              <span>Absorbed into villi</span>
              <span className="absorb__bar">
                <span className="absorb__fill absorb__fill--in" />
              </span>
            </div>
            <div className="absorb__row">
              <span>Passes through (lost)</span>
              <span className="absorb__bar">
                <span className="absorb__fill absorb__fill--out" />
              </span>
            </div>
            <span className="absorb__note">Illustration — more vs. less, not measured amounts.</span>
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
              <br />≈ 12 months or more
            </span>
          </div>
          <div className="timeline__step">
            <span className="timeline__bar" />
            <span>
              <b>Follow-up</b>
              <br />
              watch for relapse
            </span>
          </div>
        </div>
      );
    case 'end':
      return (
        <>
          <div className="caption__actions">
            <button type="button" className="pill" onClick={() => openSources()}>
              Sources
            </button>
            <button type="button" className="pill" onClick={openGlossary}>
              Medical terms
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
      <section ref={ref} className="caption" data-step="quiz">
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
      <Extras id={s.id} />
      {s.hint && <p className="caption__hint">{s.hint}</p>}
    </section>
  );
}
