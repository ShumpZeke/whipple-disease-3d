import { useEffect, useRef } from 'react';
import { creditLine } from '../app/config';
import { scrollToStop, stopPresence } from '../app/journey';
import { pinToScene } from '../app/pinned';
import { useStory } from '../app/store';
import { SOURCES_PAGE, STOPS } from '../content/story';
import { StopFigures } from './Charts';
import { Quiz } from './Quiz';
import { RichText } from './RichText';
import { Scramble } from './Scramble';
import { useJourney } from './useJourney';

/** The last stop: links to the sources and back to the start, and who made the exhibit. */
function Extras({ id }: { id: string }) {
  const restart = useStory((s) => s.restart);

  switch (id) {
    case 'end':
      return (
        <>
          <div className="caption__links">
            <button type="button" className="text-link" onClick={() => scrollToStop(SOURCES_PAGE)}>
              Sources
            </button>
            <button type="button" className="text-link" onClick={restart}>
              Start again
            </button>
          </div>
          <p className="caption__credit">{creditLine()}</p>
        </>
      );
    default:
      return null;
  }
}

/**
 * The words for the nearest stop: a heading and a few plain sentences in the corner of the scene.
 * They are pinned in the 3D world beside what they describe (see app/pinned.ts), so they arrive
 * with the scene and move away with it, instead of changing like slides. The soft shade that keeps
 * them readable stays in the corner of the screen.
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
      <section ref={ref} key={s.id} className="caption" aria-live="polite" aria-label={s.title.replace(/\*/g, '')} data-step={s.id}>
        <h1 className="caption__title">
          <Scramble text={s.title} />
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
        <StopFigures id={s.id} />
        <Extras id={s.id} />
      </section>
    </>
  );
}
