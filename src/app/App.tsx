import { Component, lazy, Suspense, useEffect, useState, type ReactNode } from 'react';
import { LAST_STOP, nextPause, prevPause, SOURCES_PAGE, STOPS, STOP_INDEX, type StopId } from '../content/story';
import { ORGANS } from '../three/anatomy/organs';
import { Caption } from '../ui/Caption';
import { Fallback, StageLoading } from '../ui/Fallback';
import { Backdrops, HistoryLayer } from '../ui/History';
import { EndSources } from '../ui/EndSources';
import { HudTop, toggleFullscreen } from '../ui/Hud';
import { GlossaryOverlay, SourcesOverlay } from '../ui/Overlays';
import { TermPopover } from '../ui/TermPopover';
import { currentTargetStop, journey, scrollToStop, startJourney } from './journey';
import { useStory } from './store';

const Stage = lazy(() => import('../three/Stage'));

/** three.js needs WebGL 2; older smart-board or kiosk browsers without it get the still images. */
function webglAvailable() {
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}

/** If the 3D stage fails to start on some device, show the still images instead of a blank page. */
class StageBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    useStory.getState().setWebgl('failed');
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Keyboard and presenter clickers (which send PageDown/PageUp or arrow keys) move one stop at a
 * time with a smooth zoom. The page itself also scrolls normally with a wheel, trackpad or touch.
 */
function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const st = useStory.getState();
      const overlay = st.sourcesOpen || st.glossaryOpen;
      if (e.key === 'Escape') {
        if (st.term || overlay) {
          st.closeOverlays();
          e.preventDefault();
        } else if (st.historyNote) st.setHistoryNote(null);
        return;
      }
      if (overlay) return;
      const target = e.target as HTMLElement;
      const tag = target?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      const onButton = tag === 'BUTTON' || tag === 'A';
      const forward = ['ArrowDown', 'ArrowRight', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey && !onButton);
      const backward = ['ArrowUp', 'ArrowLeft', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey && !onButton);
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
        return;
      }
      // the list of sources scrolls like a normal page; stepping back from its top returns to the summary
      const sourcesTop = SOURCES_PAGE * window.innerHeight;
      if (window.scrollY > sourcesTop - 4) {
        if (backward && window.scrollY < sourcesTop + 4) {
          scrollToStop(LAST_STOP);
          e.preventDefault();
        } else if (e.key === 'Home') {
          scrollToStop(0);
          e.preventDefault();
        }
        return;
      }
      if (forward) {
        scrollToStop(nextPause(currentTargetStop()));
        e.preventDefault();
      } else if (backward) {
        scrollToStop(prevPause(currentTargetStop()));
        e.preventDefault();
      } else if (e.key === 'Home') {
        scrollToStop(0);
        e.preventDefault();
      } else if (e.key === 'End') {
        scrollToStop(LAST_STOP);
        e.preventDefault();
      } else if (e.key === 'r' || e.key === 'R') {
        st.resetCamera();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function useReducedMotion() {
  const set = useStory((s) => s.setReducedMotion);
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    const url = new URLSearchParams(window.location.search).has('reduced');
    const apply = () => {
      const v = q.matches || url;
      journey.reduced = v;
      set(v);
    };
    apply();
    q.addEventListener('change', apply);
    return () => q.removeEventListener('change', apply);
  }, [set]);
}

/** The scroll journey: start the driver; honour #stop or ?stop= deep links. */
function useJourneyDriver() {
  useEffect(() => {
    const st = useStory.getState();
    const q = new URLSearchParams(window.location.search);
    const id = (q.get('stop') ?? window.location.hash.replace('#', '')) as StopId;
    if (id && id in STOP_INDEX) {
      window.scrollTo(0, STOP_INDEX[id] * window.innerHeight);
      journey.t = journey.target = STOP_INDEX[id];
    } else if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
      window.scrollTo(0, 0);
    }
    return startJourney(
      (i) => useStory.getState().setStop(i),
      (w) => st.setDisplayWorld(w),
    );
  }, []);
}

function HoverTip() {
  const hovered = useStory((s) => s.hoveredOrgan);
  const stop = useStory((s) => s.stop);

  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const onMove = (e: PointerEvent) => setPt({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  const id = STOPS[stop].id;
  if (!hovered || !pt || id !== 'body') return null;
  return (
    <div className="hover-tip" style={{ left: pt.x, top: pt.y }} aria-hidden="true">
      {ORGANS[hovered].name}
    </div>
  );
}

/**
 * An unseen button over the bottom-right corner of the screen. During a talk, one click or tap
 * there moves on to the next part, exactly like a presenter clicker. It draws nothing at all (no
 * outline, no hover change, no pointer hand), and it is left out of the Tab order, so it never
 * shows; the keyboard, a clicker, the wheel and swipes all still work as before.
 */
function NextZone() {
  return (
    <button
      type="button"
      className="next-zone"
      aria-label="Go to the next part"
      tabIndex={-1}
      onClick={(e) => {
        // never keep the focus (a focused button could show a ring on the next key press)
        e.currentTarget.blur();
        useStory.getState().next();
      }}
    />
  );
}

export default function App() {
  useKeyboard();
  useReducedMotion();
  useJourneyDriver();
  const stop = useStory((s) => s.stop);
  const reduced = useStory((s) => s.reducedMotion);
  const webgl = useStory((s) => s.webgl);
  const stageReady = useStory((s) => s.stageReady);
  const [canWebgl] = useState(webglAvailable);
  const [loadStage, setLoadStage] = useState(false);

  // start downloading the 3D stage while the visitor is still on the history pages
  useEffect(() => {
    if (!canWebgl) return;
    if (journey.target > 0.5) {
      setLoadStage(true);
      return;
    }
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setLoadStage(true), { timeout: 1200 });
      return () => window.cancelIdleCallback(id);
    }
    const id = setTimeout(() => setLoadStage(true), 600);
    return () => clearTimeout(id);
  }, [canWebgl]);

  const fallback = !canWebgl || webgl === 'failed';

  return (
    <>
      {/* The page is one long scroll: each 100vh of scrolling moves the camera one stop deeper. */}
      <div className="scroller" style={{ height: `${(LAST_STOP + 1) * 100}vh` }} aria-hidden="true">
        {STOPS.map((s, i) => (
          <div key={s.id} id={`stop-${s.id}`} className="snap" style={{ top: `${i * 100}vh` }} />
        ))}
      </div>
      <main className={`exhibit${reduced ? ' reduce-motion' : ''}${stop > 0 ? ' is-immersive' : ''}`} aria-label="Wilms tumor interactive exhibit">
        <Backdrops />
        {!fallback && loadStage && (
          <div className={`canvas-layer${stageReady ? ' is-ready' : ''}`}>
            <StageBoundary>
              <Suspense fallback={null}>
                <Stage />
              </Suspense>
            </StageBoundary>
          </div>
        )}
        {fallback && <Fallback />}
        {!fallback && <StageLoading />}
        <NextZone />
        <HistoryLayer />
        <Caption />
        <HudTop />
        <HoverTip />
        <TermPopover />
        <SourcesOverlay />
        <GlossaryOverlay />
      </main>
      <EndSources />
    </>
  );
}
