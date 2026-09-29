import { useEffect, useState } from 'react';
import { names, periodLabel, SUBMISSION } from '../app/config';
import { useStory } from '../app/store';

/** Full screen hides the browser's bars, which is best on a smart board or projector. */
export function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else document.documentElement.requestFullscreen?.().catch(() => undefined);
}

function FullscreenLink() {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', sync);
    return () => document.removeEventListener('fullscreenchange', sync);
  }, []);
  if (!document.fullscreenEnabled) return null;
  return (
    <button type="button" className="link-btn" aria-pressed={on} title="Full screen (F)" onClick={toggleFullscreen}>
      {on ? 'Exit full screen' : 'Full screen'}
    </button>
  );
}

/**
 * The only things always on screen: the title with the project and its author in the top-left
 * corner (large on the home screen), and three small links in the top-right corner.
 */
/**
 * After the home screen the corner menu steps out of the way, so only the scene and its words are
 * on screen. It comes back while a mouse is near the top edge (or a key moves focus into it).
 */
function usePeek() {
  const [peek, setPeek] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (e.clientY < 110) {
        setPeek(true);
        clearTimeout(timer);
        timer = setTimeout(() => setPeek(false), 2500);
      }
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => {
      window.removeEventListener('pointermove', onMove);
      clearTimeout(timer);
    };
  }, []);
  return peek;
}

export function HudTop() {
  const stop = useStory((s) => s.stop);
  const openSources = useStory((s) => s.openSources);
  const openGlossary = useStory((s) => s.openGlossary);
  const peek = usePeek();
  return (
    <header className={`hud-top${peek ? ' is-peek' : ''}`}>
      <div className={`wordmark${stop === 0 ? ' is-home' : ''}`}>
        <span className="wordmark__title">Wilms Tumor</span>
        <span className="wordmark__meta">// {SUBMISSION.course}, eponym 27</span>
        <span className="wordmark__meta">
          {names()}, {periodLabel()}.
        </span>
      </div>
      <nav className="hud-links" aria-label="Exhibit tools">
        <button type="button" className="link-btn" onClick={openGlossary}>
          Terms
        </button>
        <button type="button" className="link-btn" onClick={() => openSources()}>
          Sources
        </button>
        <FullscreenLink />
      </nav>
    </header>
  );
}
