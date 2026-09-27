import { lazy, Suspense, useEffect, useState } from 'react';
import { STEPS } from '../content/story';
import { ORGANS } from '../three/anatomy/organs';
import { Caption } from '../ui/Caption';
import { Fallback, StageLoading } from '../ui/Fallback';
import { Backdrops, HistoryLayer } from '../ui/History';
import { Credit, HudBottom, HudTop } from '../ui/Hud';
import { GlossaryOverlay, SourcesOverlay } from '../ui/Overlays';
import { TermPopover } from '../ui/TermPopover';
import { useStory } from './store';

const Stage = lazy(() => import('../three/Stage'));

function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}

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
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D' || e.key === 'PageDown') {
        st.next();
        e.preventDefault();
      } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A' || e.key === 'PageUp') {
        st.back();
        e.preventDefault();
      } else if (e.key === 'r' || e.key === 'R') {
        st.resetCamera();
      } else if (e.key === 'Home') {
        st.goTo(0);
      } else if (e.key === 'End') {
        st.goTo(STEPS.length - 1);
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
    const apply = () => set(q.matches || url);
    apply();
    q.addEventListener('change', apply);
    return () => q.removeEventListener('change', apply);
  }, [set]);
}

function HoverTip() {
  const hovered = useStory((s) => s.hoveredOrgan);
  const step = useStory((s) => s.step);
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const onMove = (e: PointerEvent) => setPt({ x: e.clientX, y: e.clientY });
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
  const id = STEPS[step].id;
  if (!hovered || !pt || !['overview', 'end', 'quiz'].includes(id)) return null;
  const quiz = id === 'quiz';
  return (
    <div className="hover-tip" style={{ left: pt.x, top: pt.y }} aria-hidden="true">
      {quiz ? 'Select this organ' : ORGANS[hovered].name}
    </div>
  );
}

function PlateLabel() {
  const step = useStory((s) => s.step);
  if (STEPS[step].id !== 'modern') return null;
  return (
    <div className="plate-label" aria-hidden="true">
      <div className="plate-label__kicker">Plate I</div>
      <div className="plate-label__title">The organs of digestion</div>
    </div>
  );
}

function ScaleNote() {
  const step = useStory((s) => s.step);
  const id = STEPS[step].id;
  if (!['inside', 'villi', 'micro', 'mechanism', 'diagnosis', 'treatment'].includes(id)) return null;
  return <p className="scale-note">Illustration · not to scale · colors for clarity</p>;
}

/** Deep links for presenting and testing, e.g. ?step=villi or ?step=facts&sub=2 */
function useDeepLink() {
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const id = q.get('step');
    const i = STEPS.findIndex((s) => s.id === id);
    if (i > 0) useStory.getState().goTo(i, Number(q.get('sub') ?? 0) || 0);
  }, []);
}

export default function App() {
  useKeyboard();
  useReducedMotion();
  useDeepLink();
  const step = useStory((s) => s.step);
  const displayWorld = useStory((s) => s.displayWorld);
  const veil = useStory((s) => s.veil);
  const reduced = useStory((s) => s.reducedMotion);
  const webgl = useStory((s) => s.webgl);
  const [canWebgl] = useState(webglAvailable);
  const [loadStage, setLoadStage] = useState(false);
  const worldNeeded = STEPS[step].world !== 'none';

  // start downloading the 3D stage while the visitor reads the opening
  useEffect(() => {
    if (!canWebgl) return;
    // deep links straight into a 3D chapter load the stage immediately
    if (STEPS[useStory.getState().step].world !== 'none' || new URLSearchParams(window.location.search).has('step')) {
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

  const showCanvas = worldNeeded && displayWorld !== 'none';
  const fallback = !canWebgl || webgl === 'failed';

  return (
    <main className={`exhibit${reduced ? ' reduce-motion' : ''}`} aria-label="Whipple's disease interactive exhibit">
      <Backdrops />
      {!fallback && loadStage && (
        <div className={`canvas-layer${showCanvas ? '' : ' is-hidden'}`}>
          <Suspense fallback={null}>
            <Stage />
          </Suspense>
        </div>
      )}
      {fallback && worldNeeded && <Fallback />}
      {!fallback && <StageLoading />}
      <div className={`veil${veil ? ' is-on' : ''}`} />
      <PlateLabel />
      <HistoryLayer />
      <Caption />
      <ScaleNote />
      <HudTop />
      <HudBottom />
      <Credit />
      <HoverTip />
      <TermPopover />
      <SourcesOverlay />
      <GlossaryOverlay />
      <div className="grain" aria-hidden="true" />
    </main>
  );
}
