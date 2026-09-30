import { useRef } from 'react';
import { names, periodLabel, SUBMISSION } from '../app/config';
import { scrollToStop, smoothstep } from '../app/journey';
import { SECTIONS, STOPS } from '../content/story';
import { Cites, RichText } from './RichText';
import { Scramble } from './Scramble';
import { useJourney } from './useJourney';
import { HEADLINE } from '../content/figures';
import { StatRow } from './Charts';

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
 * The home screen: the eponym's name, how to say it, a one-line definition, who made the project,
 * and a menu of the parts (each one jumps there), over the 3D study where Max Wilms is at work.
 * It fades as the camera moves in towards him.
 */
function Cover() {
  const ref = useRef<HTMLElement>(null);
  useJourney((t) => {
    const el = ref.current;
    if (!el) return;
    const o = 1 - smoothstep(0.06, 0.4, t);
    el.style.opacity = String(o);
    el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
    el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
    el.style.transform = `scale(${(1 + t * 0.12).toFixed(4)})`;
  });
  return (
    <section ref={ref} className="cover cover--min fly" aria-labelledby="cover-title">
      <div className="cover__brand">
        <p className="cover__meta">
          // {SUBMISSION.course}, eponym 27
        </p>
        <h1 id="cover-title" className="cover__title">
          <Scramble text="Wilms Tumor" duration={1100} />
        </h1>
        <p className="cover__def">
          <RichText text={STOPS[0].text} />
        </p>
        <p className="cover__say">
          Say it <b>WILMZ TOO-mer</b>. Named after Max Wilms, a German surgeon. <Cites ids={[16, 9]} />
        </p>
        <p className="cover__meta">
          {names()}, {periodLabel()}
        </p>
      </div>
      <StatRow items={HEADLINE} className="cover__stats" />
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
