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
 * The zoom gauge on the right: the parts of the story from top (home) to bottom (sources), a
 * marker that slides as the camera zooms, and arrows to go on or back (a clicker, the arrow keys
 * or a swipe do the same). Tap a part's name to jump there.
 */
export function DepthRail() {
  const marker = useRef<HTMLSpanElement>(null);
  const stop = useStory((s) => s.stop);
  useJourney((t) => {
    if (marker.current) marker.current.style.top = `${((t / SOURCES_PAGE) * 100).toFixed(3)}%`;
  });
  let section = stop;
  while (section > 0 && !STOPS[section].rail) section--;
  const atEnd = stop === LAST_STOP;
  return (
    <nav className="rail" aria-label="Move through the exhibit">
      <button
        type="button"
        className="rail__arrow"
        aria-label="Back"
        title="Back (↑)"
        disabled={stop === 0}
        onClick={() => scrollToStop(currentTargetStop() - 1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <div className="rail__track">
        {STOPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`rail__stop cat-${s.cat}${s.rail ? ' has-label' : ''}${i === stop ? ' is-current' : ''}${i === section ? ' is-section' : ''}`}
            style={{ top: `${(i / SOURCES_PAGE) * 100}%` }}
            aria-label={`Go to: ${s.title.replace(/\*/g, '')}`}
            aria-current={i === stop ? 'location' : undefined}
            onClick={() => scrollToStop(i)}
          >
            {s.rail && <span className="rail__label">{s.rail}</span>}
          </button>
        ))}
        <button
          type="button"
          className="rail__stop cat-summary has-label"
          style={{ top: '100%' }}
          aria-label="Go to: Sources"
          onClick={() => scrollToStop(SOURCES_PAGE)}
        >
          <span className="rail__label">Sources</span>
        </button>
        <span ref={marker} className="rail__marker" aria-hidden="true" />
      </div>
      <button
        type="button"
        className="rail__arrow rail__arrow--next"
        aria-label={atEnd ? 'Next: sources' : 'Next'}
        title="Next (↓)"
        onClick={() => scrollToStop(currentTargetStop() + 1)}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </nav>
  );
}
