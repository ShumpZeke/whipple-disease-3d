import { useStory } from '../app/store';
import { STEPS } from '../content/story';
import { Quiz } from './Quiz';
import { RichText } from './RichText';

function StepExtras({ id }: { id: string }) {
  const mechanism = useStory((s) => s.mechanism);
  const setMechanism = useStory((s) => s.setMechanism);
  const next = useStory((s) => s.next);
  const sub = useStory((s) => s.sub);
  const goTo = useStory((s) => s.goTo);
  const step = useStory((s) => s.step);
  const openSources = useStory((s) => s.openSources);
  const openGlossary = useStory((s) => s.openGlossary);
  const restart = useStory((s) => s.restart);

  switch (id) {
    case 'overview':
      return (
        <div className="caption__actions">
          <button type="button" className="pill" onClick={next}>
            Focus on the small intestine
          </button>
        </div>
      );
    case 'facts':
    case 'diagnosis': {
      const n = STEPS[step].captions.length;
      return (
        <div className="caption__actions" role="group" aria-label="Choose a part">
          {Array.from({ length: n }, (_, i) => (
            <button
              key={i}
              type="button"
              className="pill"
              aria-pressed={i === sub}
              onClick={() => goTo(step, i)}
            >
              {id === 'facts' ? ['Cause', 'Symptoms', 'Diagnosis', 'Treatment'][i] : ['Biopsy', 'Microscope', 'PCR'][i]}
            </button>
          ))}
        </div>
      );
    }
    case 'mechanism':
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
            <span className="absorb__note">Illustration — shows more vs. less, not measured amounts.</span>
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
              <br />2–4 weeks
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
              <br />watch for relapse
            </span>
          </div>
        </div>
      );
    case 'end':
      return (
        <div className="caption__actions">
          <button type="button" className="pill" onClick={() => openSources()}>
            Sources
          </button>
          <button type="button" className="pill" onClick={openGlossary}>
            Medical terms
          </button>
          <button type="button" className="pill" onClick={restart}>
            Restart story
          </button>
        </div>
      );
    default:
      return null;
  }
}

export function Caption() {
  const step = useStory((s) => s.step);
  const sub = useStory((s) => s.sub);
  const s = STEPS[step];
  if (s.id === 'intro') return null;
  if (s.id === 'quiz') return <Quiz />;
  const c = s.captions[Math.min(sub, s.captions.length - 1)];
  const right = false;
  return (
    <section
      key={`${s.id}-${sub}`}
      className={`caption caption-enter${right ? ' caption--right' : ''}`}
      // on the 1907 → today step the caption waits until the engraved plate has "developed"
      style={s.id === 'modern' ? { animationDelay: '5s', animationDuration: '900ms' } : undefined}
      aria-live="polite"
      aria-label={c.title.replace(/\*/g, '')}
      data-step={s.id}
    >
      <p className="caption__eyebrow">{c.eyebrow}</p>
      <h1 className="caption__title">
        <RichText text={c.title} />
      </h1>
      {c.body.map((b, i) => (
        <p key={i} className="caption__body">
          <RichText text={b} />
        </p>
      ))}
      <StepExtras id={s.id} />
      {c.hint && <p className="caption__hint">{c.hint}</p>}
    </section>
  );
}
