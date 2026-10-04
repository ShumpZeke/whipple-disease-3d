import { useEffect, useRef } from 'react';
import { names, periodLabel } from '../app/config';
import { scrollToStop, stopPresence } from '../app/journey';
import { pinToScene } from '../app/pinned';
import { useStory } from '../app/store';
import { SOURCES_PAGE, STOPS } from '../content/story';
import { StopFacts } from './Charts';
import { Quiz } from './Quiz';
import { RichText } from './RichText';
import { useJourney } from './useJourney';

/** The summary: where to go next, and who made the exhibit. */
function Extras() {
  const restart = useStory((s) => s.restart);
  return (
    <>
      <div className="caption__links">
        <button type="button" className="text-link" onClick={() => scrollToStop(SOURCES_PAGE)}>
          References
        </button>
        <button type="button" className="text-link" onClick={restart}>
          Start again
        </button>
      </div>
      <p className="caption__credit">
        {names()}, {periodLabel()}
      </p>
    </>
  );
}

/**
 * The words for the stop the camera rests at, built the same way every time so the exhibit reads as
 * one infographic: the section it belongs to, a headline that states the takeaway, three key facts
 * as big figures, then a few plain sentences that explain them. The block is pinned beside what it
 * describes (app/pinned.ts), so it arrives and leaves with the 3D scene instead of changing like a
 * slide; the soft shade that keeps it readable stays in the corner of the screen.
 */
export function Caption() {
  const stop = useStory((s) => s.stop);
  const reduced = useStory((s) => s.reducedMotion);
  const s = STOPS[stop];
  const ref = useRef<HTMLElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  useJourney(
    (t) => {
      const p = stopPresence(t, stop);
      for (const el of [ref.current, shade.current]) {
        if (!el) continue;
        el.style.opacity = String(p);
        el.style.visibility = p < 0.01 ? 'hidden' : 'visible';
      }
    },
    [stop],
  );

  // (the quiz stays put: it is something to tap, not part of the scene)
  const pinned = s.id !== 'quiz' && !reduced;
  useEffect(() => {
    const el = ref.current;
    if (!el || !pinned) return;
    const off = pinToScene(el, stop);
    return () => {
      off();
      el.style.transform = '';
    };
  }, [stop, pinned]);

  // no words on the home screen (it has its own) or on stops the camera only flies through
  if (s.id === 'title' || s.pass) return null;
  if (s.id === 'quiz')
    return (
      <section ref={ref} className="caption caption--quiz" data-step="quiz">
        <Quiz />
      </section>
    );

  return (
    <>
      <div ref={shade} className="caption-shade" aria-hidden="true" />
      <section ref={ref} key={s.id} className="caption" aria-live="polite" aria-label={s.title} data-step={s.id}>
        <p className="caption__kicker">{s.eyebrow}</p>
        <h1 className="caption__title">{s.title}</h1>
        <StopFacts id={s.id} />
        <p className="caption__body">
          <RichText text={s.text} />
        </p>
        {s.id === 'end' && <Extras />}
      </section>
    </>
  );
}
