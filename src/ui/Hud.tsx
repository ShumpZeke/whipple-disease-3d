import { useRef } from 'react';
import { creditLine } from '../app/config';
import { scrollToStop, smoothstep } from '../app/journey';
import { useStory } from '../app/store';
import { LAST_STOP, STOPS } from '../content/story';
import { useJourney } from './useJourney';

export function HudTop() {
  const stop = useStory((s) => s.stop);
  const world = useStory((s) => s.displayWorld);
  const openSources = useStory((s) => s.openSources);
  const openGlossary = useStory((s) => s.openGlossary);
  const resetCamera = useStory((s) => s.resetCamera);
  return (
    <header className="hud-top">
      <div className="wordmark">
        {stop > 0 ? (
          <span className="wordmark__title">Whipple’s Disease</span>
        ) : (
          <span className="wordmark__chapter">An interactive exhibit</span>
        )}
      </div>
      <nav className="hud-links" aria-label="Exhibit tools">
        {world !== 'none' && (
          <button type="button" className="icon-btn" aria-label="Reset the view (R)" title="Reset the view (R)" onClick={resetCamera}>
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

/**
 * A slim zoom rail on the right: where we are in the dive (1907 → body → organ → wall → villi →
 * germ → …). It moves continuously with the scroll. Only the current section is named, so it
 * never competes with the picture; hovering the rail shows every label (click to jump).
 */
export function DepthRail() {
  const marker = useRef<HTMLSpanElement>(null);
  const stop = useStory((s) => s.stop);
  useJourney((t) => {
    if (marker.current) marker.current.style.top = `${((t / LAST_STOP) * 100).toFixed(3)}%`;
  });
  let section = stop;
  while (section > 0 && !STOPS[section].rail) section--;
  return (
    <nav className="rail" aria-label="Zoom depth">
      <div className="rail__track">
        {STOPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`rail__stop${s.rail ? ' has-label' : ''}${i === stop ? ' is-current' : ''}${i === section ? ' is-section' : ''}`}
            style={{ top: `${(i / LAST_STOP) * 100}%` }}
            aria-label={`Go to: ${s.title.replace(/\*/g, '')}`}
            aria-current={i === stop ? 'location' : undefined}
            onClick={() => scrollToStop(i)}
          >
            {s.rail && <span className="rail__label">{s.rail}</span>}
          </button>
        ))}
        <span ref={marker} className="rail__marker" aria-hidden="true" />
      </div>
    </nav>
  );
}

/** Only on the opening: a gentle reminder that scrolling is the way in. */
export function ScrollCue() {
  const ref = useRef<HTMLDivElement>(null);
  useJourney((t) => {
    if (ref.current) ref.current.style.opacity = String(1 - smoothstep(0.02, 0.2, t));
  });
  return (
    <div ref={ref} className="scroll-cue" aria-hidden="true">
      <span className="scroll-cue__mouse">
        <span />
      </span>
    </div>
  );
}

export function Credit() {
  const ref = useRef<HTMLDivElement>(null);
  useJourney((t) => {
    if (!ref.current) return;
    const o = 1 - smoothstep(0.1, 0.35, t);
    ref.current.style.opacity = String(o);
    ref.current.style.visibility = o < 0.01 ? 'hidden' : 'visible';
  });
  return (
    <div ref={ref} className="credit">
      {creditLine()}
    </div>
  );
}
