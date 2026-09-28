import { useEffect, useRef, useState } from 'react';
import { currentTargetStop, scrollToStop } from '../app/journey';
import { useStory } from '../app/store';
import { LAST_STOP, SOURCES_PAGE, STOPS } from '../content/story';
import { useJourney } from './useJourney';

/** Full screen hides the browser's bars — best on a smart board or projector. */
export function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => undefined);
}

function FullscreenButton() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  if (!document.fullscreenEnabled) return null;
  const label = on ? 'Exit full screen (F)' : 'Full screen (F)';
  return (
    <button type="button" className="icon-btn" aria-label={label} title={label} aria-pressed={on} onClick={toggleFullscreen}>
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path
          d={on ? 'M8 3v5H3M12 3v5h5M8 17v-5H3M12 17v-5h5' : 'M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5'}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

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
        <FullscreenButton />
      </nav>
    </header>
  );
}

/**
 * A slim zoom rail on the right: where we are in the dive (1907 → body → organ → wall → villi →
 * germ → …), ending with the sources. It moves continuously with the scroll. Only the current
 * section is named, so it never competes with the picture; hovering the rail shows every label.
 */
export function DepthRail() {
  const marker = useRef<HTMLSpanElement>(null);
  const stop = useStory((s) => s.stop);
  useJourney((t) => {
    if (marker.current) marker.current.style.top = `${((t / SOURCES_PAGE) * 100).toFixed(3)}%`;
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
            style={{ top: `${(i / SOURCES_PAGE) * 100}%` }}
            aria-label={`Go to: ${s.title.replace(/\*/g, '')}`}
            aria-current={i === stop ? 'location' : undefined}
            onClick={() => scrollToStop(i)}
          >
            {s.rail && <span className="rail__label">{s.rail}</span>}
          </button>
        ))}
        <button type="button" className="rail__stop has-label" style={{ top: '100%' }} aria-label="Go to: Sources" onClick={() => scrollToStop(SOURCES_PAGE)}>
          <span className="rail__label">Sources</span>
        </button>
        <span ref={marker} className="rail__marker" aria-hidden="true" />
      </div>
    </nav>
  );
}

/**
 * Big Back / Next buttons for a smart board or touch screen (a clicker or the arrow keys do the
 * same). Each press zooms smoothly to the neighbouring stop; after the summary comes the sources.
 */
export function PresenterNav() {
  const stop = useStory((s) => s.stop);
  const atEnd = stop === LAST_STOP;
  return (
    <nav className="pnav" aria-label="Presenter controls">
      <button
        type="button"
        className="pnav__btn"
        aria-label="Back"
        disabled={stop === 0}
        onClick={() => scrollToStop(currentTargetStop() - 1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <span className="pnav__count" aria-hidden="true">
        {stop + 1}
        <span className="pnav__of"> / {STOPS.length}</span>
      </span>
      <button
        type="button"
        className="pnav__btn pnav__btn--next"
        aria-label={atEnd ? 'Next: sources' : 'Next'}
        onClick={() => scrollToStop(currentTargetStop() + 1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </nav>
  );
}
