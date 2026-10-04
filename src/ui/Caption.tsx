import { useEffect, useRef } from 'react';
import { creditLine } from '../app/config';
import { scrollToStop, stopPresence } from '../app/journey';
import { pinToScene } from '../app/pinned';
import { useStory } from '../app/store';
import { SOURCES_PAGE, STOPS, type StopId } from '../content/story';
import { StopFigures } from './Charts';
import { Quiz } from './Quiz';
import { RichText } from './RichText';
import { useJourney } from './useJourney';

/**
 * The full research copy stays in story.ts for the guide and sources. On the main journey we show
 * only the sentence needed at that moment. The 3D scene carries the rest of the explanation.
 */
const DISPLAY_TEXT: Partial<Record<StopId, string>> = {
  doctor: 'A German surgeon. The tumor is named after him. {c:9,10}',
  name: 'He described it in 1899. Its medical name is {t:nephroblastoma}. {c:9,1}',
  body: 'A kidney cancer in young children. {c:1,3}',
  genes: 'A {t:gene} change makes young kidney cells keep dividing. {c:3,8}',
  lump: 'The first sign is a painless lump in the belly. {c:5,2}',
  ultrasound: 'An {t:ultrasound} finds the tumor. {c:6}',
  treatment: 'Surgery removes the kidney. Then chemotherapy. {c:1,7}',
  end: 'Most children are cured. {c:1,2}',
};

/** The last stop: two quiet utility links and the project credit. */
function Extras({ id }: { id: string }) {
  const restart = useStory((s) => s.restart);

  switch (id) {
    case 'end':
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
          <p className="caption__credit">{creditLine()}</p>
        </>
      );
    default:
      return null;
  }
}

/**
 * The active fact is pinned beside the thing it describes. It moves with the 3D scene rather than
 * behaving like a new slide. Extra definitions stay behind tappable medical terms.
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

  if (s.id === 'title' || s.pass) return null;
  if (s.id === 'quiz')
    return (
      <section ref={ref} className="caption caption--quiz" data-step="quiz">
        <Quiz />
      </section>
    );

  const text = DISPLAY_TEXT[s.id] ?? s.text;
  const showNote = s.id === 'name' && s.note;

  return (
    <>
      <div ref={shade} className="caption-shade" aria-hidden="true" />
      <section ref={ref} key={s.id} className="caption" aria-live="polite" aria-label={s.title.replace(/\*/g, '')} data-step={s.id}>
        <h1 className="caption__title">{s.title}</h1>
        {text && (
          <p className="caption__body">
            <RichText text={text} />
          </p>
        )}
        {showNote && (
          <p className="caption__note">
            <RichText text={s.note!} />
          </p>
        )}
        <StopFigures id={s.id} />
        <Extras id={s.id} />
      </section>
    </>
  );
}
