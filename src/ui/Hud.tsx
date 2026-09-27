import { creditLine } from '../app/config';
import { useStory } from '../app/store';
import { STEPS } from '../content/story';

const Arrow = ({ dir }: { dir: 'left' | 'right' }) => (
  <svg viewBox="0 0 16 16" aria-hidden="true">
    <path
      d={dir === 'right' ? 'M3 8h10M9 4l4 4-4 4' : 'M13 8H3M7 4L3 8l4 4'}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export function HudTop() {
  const step = useStory((s) => s.step);
  const openSources = useStory((s) => s.openSources);
  const openGlossary = useStory((s) => s.openGlossary);
  const resetCamera = useStory((s) => s.resetCamera);
  const s = STEPS[step];
  const is3D = s.world !== 'none';
  return (
    <header className="hud-top">
      <div className="wordmark" aria-live="polite">
        {step > 0 ? (
          <>
            <span className="wordmark__title">Whipple’s Disease</span>
            <span className="wordmark__chapter">
              {s.chapter} · {s.label}
            </span>
          </>
        ) : (
          <span className="wordmark__chapter">An interactive exhibit</span>
        )}
      </div>
      <nav className="hud-links" aria-label="Exhibit tools">
        {is3D && (
          <button type="button" className="icon-btn" aria-label="Reset view (R)" title="Reset view (R)" onClick={resetCamera}>
            <svg viewBox="0 0 20 20" aria-hidden="true">
              <path
                d="M4 10a6 6 0 1 0 2-4.5M4 3.5V7h3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
        <button type="button" className="link-btn" onClick={openGlossary}>
          Terms
        </button>
        <button type="button" className="link-btn" onClick={() => openSources()}>
          Sources
        </button>
      </nav>
    </header>
  );
}

export function HudBottom() {
  const step = useStory((s) => s.step);
  const sub = useStory((s) => s.sub);
  const next = useStory((s) => s.next);
  const back = useStory((s) => s.back);
  const goTo = useStory((s) => s.goTo);
  const atEnd = step === STEPS.length - 1;
  if (step === 0) return null;
  const nextLabel =
    STEPS[step].captions.length > 1 && sub < STEPS[step].captions.length - 1 ? 'Next' : atEnd ? 'End' : 'Next';
  return (
    <div className="hud-bottom">
      <button type="button" className="nav-btn" onClick={back} aria-label="Previous (Left arrow)">
        <Arrow dir="left" />
        <span>Back</span>
      </button>
      <div className="progress" role="navigation" aria-label="Story progress">
        {STEPS.map((st, i) => (
          <button
            key={st.id}
            type="button"
            className={`progress__tick${i < step ? ' is-done' : ''}${i === step ? ' is-current' : ''}${
              i > 0 && STEPS[i - 1].chapter !== st.chapter ? ' is-chapter-start' : ''
            }`}
            aria-label={`${i + 1}. ${st.label}`}
            aria-current={i === step ? 'step' : undefined}
            onClick={() => goTo(i)}
          >
            <span className="progress__label">{st.label}</span>
          </button>
        ))}
      </div>
      <button
        type="button"
        className="nav-btn nav-btn--primary"
        onClick={next}
        disabled={atEnd}
        aria-label="Next (Right arrow)"
      >
        <span>{nextLabel}</span>
        <Arrow dir="right" />
      </button>
    </div>
  );
}

export function Credit() {
  const step = useStory((s) => s.step);
  if (step !== 0 && step !== STEPS.length - 1) return null;
  return <div className="credit">{creditLine()}</div>;
}
