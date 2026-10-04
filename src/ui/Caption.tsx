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
  doctor: 'Max Wilms was a German surgeon; the tumor is named after him. {c:9,10}',
  name: 'His 1899 work gave the tumor its name. The medical term is {t:nephroblastoma}. {c:9,1}',
  body: 'Wilms tumor is the most common kidney cancer in children. {c:1,3}',
  genes: 'It begins when young kidney cells keep dividing, often after a {t:gene} change such as WT1. {c:3,8}',
  lump: 'The first sign is often a painless belly lump; blood in urine is {t:hematuria}. {c:5,2}',
  ultrasound: '{t:ultrasound|Ultrasound} usually comes first; CT or MRI shows more detail. {c:6}',
  treatment: 'Removing the affected kidney is a {t:nephrectomy}; chemotherapy usually follows. {c:1,7}',
  end: 'Wilms tumor is usually treatable, and most children survive. {c:1,2}',
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
