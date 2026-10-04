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
 * What each stop says on screen: a few plain sentences that explain the scene (story.ts keeps a
 * one-line version of each for the guide and the tests).
 */
const DISPLAY_TEXT: Partial<Record<StopId, string>> = {
  doctor:
    'A German surgeon who lived from 1867 to 1918. He died during World War I from an infection he caught after operating on a prisoner of war. The tumor carries his name. {c:9,10}',
  name: 'Other doctors had already reported kidney tumors like this in children. In 1899, at age 32, Max Wilms published a detailed study that brought those reports together and explained it as one disease, so his name stayed with it. The medical name is {t:nephroblastoma}. {c:9,1}',
  body: 'Wilms tumor is a cancer that starts in a kidney, part of the urinary system. It is the most common kidney cancer in children. It usually affects one kidney; about 5 to 10 in 100 children have it in both. It is treated in {t:oncologist|pediatric oncology}. {c:1,3}',
  genes:
    'Before birth, the kidneys grow from young cells that should mature by age 3 or 4. In Wilms tumor some of them stay young and keep dividing. A change in a {t:gene} such as WT1 is often behind it. {c:3,8}',
  lump: 'The first sign is usually a swelling or hard lump in the belly that does not hurt, often noticed by a parent while bathing or dressing the child. Some children also have blood in the urine, called {t:hematuria}, a fever or high blood pressure. {c:5,1}',
  ultrasound:
    'An {t:ultrasound} usually comes first. It uses sound waves to make a picture of the kidney. A {t:ct|CT scan} or MRI then shows how big the tumor is and whether it has spread, and the tumor is checked under a microscope. {c:6}',
  treatment:
    'Treatment usually combines surgery and {t:chemotherapy}. Removing the kidney is called a {t:nephrectomy}. Chemotherapy can come before or after surgery, some children also get radiation, and the plan depends on the stage. {c:1,2}',
  end: 'Wilms tumor is a kidney cancer of young children, named after Max Wilms. With today’s treatment most children survive it: about 93 in 100 are alive five years after diagnosis. {c:1,2}',
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
