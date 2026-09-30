import { useEffect, useRef } from 'react';
import { names, periodLabel } from '../app/config';
import { scrollToStop, smoothstep } from '../app/journey';
import { pinToScene } from '../app/pinned';
import { useStory } from '../app/store';
import { SECTIONS, STOPS } from '../content/story';
import { RichText } from './RichText';
import { Scramble } from './Scramble';
import { useJourney } from './useJourney';

/* ------------------------------------------------------------------ backdrop */

/**
 * One background for the whole journey. Every scene, from the study to the DNA, sits in the same
 * dark space, so moving between them feels like one continuous zoom rather than a change of slide.
 */
export function Backdrops() {
  return <div className="backdrop backdrop--studio is-on" />;
}

/* ------------------------------------------------------------------ home screen */

/**
 * The home screen: the eponym's name, a one-line definition, who made the project, and a menu of
 * the parts (each one jumps there), over the 3D study where Max Wilms is at work. The name hangs in
 * the room (see app/pinned.ts), so it slides away with the room as the camera moves in towards him.
 */
function Cover() {
  const ref = useRef<HTMLElement>(null);
  const brand = useRef<HTMLDivElement>(null);
  const reduced = useStory((s) => s.reducedMotion);
  useJourney((t) => {
    const el = ref.current;
    if (!el) return;
    const o = 1 - smoothstep(0.06, 0.4, t);
    el.style.opacity = String(o);
    el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
  });
  useEffect(() => {
    const el = brand.current;
    if (!el || reduced) return;
    const off = pinToScene(el, 0);
    return () => {
      off();
      el.style.transform = '';
    };
  }, [reduced]);
  return (
    <section ref={ref} className="cover cover--min fly" aria-labelledby="cover-title">
      <div ref={brand} className="cover__brand">
        <h1 id="cover-title" className="cover__title">
          <Scramble text="Wilms Tumor" duration={1100} />
        </h1>
        <p className="cover__def">
          <RichText text={STOPS[0].text} />
        </p>
        <p className="cover__meta">
          {names()}, {periodLabel()}
        </p>
      </div>
      <nav className="cover__toc" aria-label="What’s inside">
        <ol>
          {SECTIONS.map((sec, i) => (
            <li key={sec.title}>
              <button type="button" onClick={() => scrollToStop(sec.stop)}>
                <span className="cover__n">{String(i + 1).padStart(2, '0')}</span>
                {sec.title}
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </section>
  );
}

/* ------------------------------------------------------------------ layer */

export function HistoryLayer() {
  return (
    <div className="history">
      <Cover />
    </div>
  );
}
