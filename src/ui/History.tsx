import { useRef } from 'react';
import { periodLabel, SUBMISSION } from '../app/config';
import { scrollToStop, smoothstep } from '../app/journey';
import { useStory } from '../app/store';
import { SECTIONS, STOP_INDEX, STOPS, type World } from '../content/story';
import { Cites, RichText, TermButton } from './RichText';
import { Scramble } from './Scramble';
import { useJourney } from './useJourney';

/* ------------------------------------------------------------------ backdrops */

const DEEP: World[] = ['kidney', 'nephron', 'cells', 'diagnosis'];

/**
 * Backdrops cross-fade with the scroll: the home screen → a warm archive tone (history) →
 * paper (the engraved plate) → studio graphite (anatomy) or deep plum (inside the kidney).
 */
export function Backdrops() {
  const world = useStory((s) => s.displayWorld);
  const cover = useRef<HTMLDivElement>(null);
  const archive = useRef<HTMLDivElement>(null);
  useJourney((t) => {
    if (cover.current) cover.current.style.opacity = String(1 - smoothstep(0.2, 0.7, t));
    if (archive.current)
      archive.current.style.opacity = String(
        smoothstep(0.1, 0.55, t) * (1 - smoothstep(STOP_INDEX.name + 0.02, STOP_INDEX.name + 0.3, t)),
      );
  });
  return (
    <>
      <div ref={cover} className="backdrop backdrop--cover is-on is-driven" />
      <div ref={archive} className="backdrop backdrop--archive is-on is-driven" style={{ opacity: 0 }} />
      <div className={`backdrop backdrop--studio${world === 'anatomy' ? ' is-on' : ''}`} />
      <div className={`backdrop backdrop--deep${DEEP.includes(world) ? ' is-on' : ''}`} />
      {/* Paper for the engraved plate; the scroll "develops" it away (HingeController). */}
      <div className="backdrop backdrop--paper hinge-paper is-driven" style={{ opacity: 0 }} />
    </>
  );
}

/* ------------------------------------------------------------------ shared bits */

/**
 * Fly-through styling for a history element anchored at stop `k`:
 * it approaches from a little smaller, rests at scale 1, then grows past the camera and fades.
 */
function flyThrough(el: HTMLElement | null, t: number, k: number, grow = 1.4) {
  if (!el) return;
  const d = t - k;
  const opacity = 1 - smoothstep(0.28, 0.52, Math.abs(d));
  const scale = d < 0 ? 1 + d * 0.22 : 1 + d * grow;
  el.style.opacity = String(opacity);
  el.style.transform = `scale(${scale.toFixed(4)})`;
  el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
  el.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
}

/* ------------------------------------------------------------------ home screen */

/** Size of the rendered home-screen picture (scripts/cover-art.mjs). */
const COVER = { w: 616, h: 1300 };

/**
 * The home screen: the eponym's name, how to say it, a one-line definition, who made the project,
 * and a menu of the five parts (each one jumps there). It zooms away as the story starts.
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
    el.style.transform = `scale(${(1 + t * 0.35).toFixed(4)})`;
  });
  return (
    <section ref={ref} className="cover fly" aria-labelledby="cover-title">
      <div className="cover__brand">
        <h1 id="cover-title" className="cover__title">
          <Scramble text="Wilms Tumor" duration={1100} />
        </h1>
        <p className="cover__meta">// {SUBMISSION.course}, eponym 27</p>
        <p className="cover__meta">
          By {SUBMISSION.studentName}, {periodLabel()}.
        </p>
      </div>
      <div className="cover__about">
        <p className="cover__label">About</p>
        <p className="cover__def">
          <RichText text={STOPS[0].text} />
        </p>
        <p className="cover__say">
          Say it wilmz TOO-mer. Named after Max Wilms, a German surgeon. <Cites ids={[16, 9]} />
        </p>
      </div>
      <nav className="cover__toc" aria-label="What’s inside">
        <p className="cover__label">Inside</p>
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
      <figure className="cover__art">
        <img
          src="/cover/urinary.webp"
          width={COVER.w}
          height={COVER.h}
          alt="3D model of the urinary system: two kidneys with the adrenal glands on top, the ureters, the bladder, the aorta and the vena cava."
        />
      </figure>
      <p className="cover__scroll">Scroll down to explore.</p>
    </section>
  );
}

/* ------------------------------------------------------------------ who was Max Wilms */

const LIFE: { year: string; text: string; cites: number[] }[] = [
  { year: '1867', text: 'Born in Germany', cites: [10] },
  { year: '1899', text: 'Wrote a book about this kidney tumor, at age 32', cites: [9] },
  { year: '1904', text: 'Became a professor', cites: [11] },
  { year: '1918', text: 'Died during World War I, from an infection he caught while operating', cites: [9] },
];

/** A profile card: the portrait and the four dates to know. */
function Profile() {
  const ref = useRef<HTMLDivElement>(null);
  useJourney((t) => flyThrough(ref.current, t, STOP_INDEX.doctor));
  return (
    <div ref={ref} className="archive-stage fly">
      <article className="print profile" aria-label="Profile of Max Wilms">
        <figure className="profile__photo">
          <img
            src="/archive/wilms-portrait.webp"
            width={560}
            height={821}
            alt="Black-and-white portrait photograph of Max Wilms in a dark suit and bow tie, seated with an open book."
          />
          <figcaption>Wellcome Collection, CC BY 4.0</figcaption>
        </figure>
        <div className="profile__body">
          <p className="profile__kicker">The tumor is named after</p>
          <h2 className="profile__name">Max Wilms</h2>
          <p className="profile__life">1867 to 1918, German surgeon</p>
          <ol className="profile__timeline">
            {LIFE.map((l) => (
              <li key={l.year}>
                <b>{l.year}</b>
                <span>
                  {l.text} <Cites ids={l.cites} />
                </span>
              </li>
            ))}
          </ol>
        </div>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------------ his book */

/** The 1899 book, set like an old title page (a description of it, not a scan). */
function Book() {
  const ref = useRef<HTMLDivElement>(null);
  useJourney((t) => flyThrough(ref.current, t, STOP_INDEX.book));
  return (
    <div ref={ref} className="archive-stage fly">
      <article className="print book" aria-label="Max Wilms’s 1899 book">
        <p className="book__kicker">1899</p>
        <h2 className="book__title" lang="de">
          Die Mischgeschwülste der Niere
        </h2>
        <p className="book__en">The Mixed Tumors of the Kidney</p>
        <p className="book__by">by Max Wilms</p>
        <ul className="book__facts">
          <li>
            He wrote it at 32, while he was still a young surgeon in training. <Cites ids={[9]} />
          </li>
          <li>
            It showed how well he knew the way organs form before birth. <Cites ids={[9]} />
          </li>
          <li>
            Others had described the tumor before him, but after his book it took his name. <Cites ids={[9]} />
          </li>
        </ul>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------------ the name */

const PARTS = [
  { part: 'nephro', meaning: 'kidney' },
  { part: 'blast', meaning: 'bud, a young cell' },
  { part: 'oma', meaning: 'tumor' },
];

/** The medical name split into its word parts, each with its meaning underneath. */
function Naming() {
  const ref = useRef<HTMLDivElement>(null);
  useJourney((t) => {
    const el = ref.current;
    if (!el) return;
    const d = t - STOP_INDEX.name;
    // arrives like the other pages, then rushes past quickly so the engraved plate can appear
    const opacity = d < 0 ? 1 - smoothstep(0.28, 0.52, -d) : 1 - smoothstep(0.08, 0.28, d);
    el.style.opacity = String(opacity);
    el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
    el.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
    el.style.transform = `scale(${(d < 0 ? 1 + d * 0.22 : 1 + d * 2.2).toFixed(4)})`;
  });
  return (
    <div ref={ref} className="archive-stage fly">
      <article className="print wordparts" aria-label="The word parts of nephroblastoma">
        <p className="wordparts__kicker">Its medical name</p>
        <h2 className="wordparts__word">
          {PARTS.map((p) => (
            <span key={p.part}>{p.part}</span>
          ))}
        </h2>
        <ol className="wordparts__parts">
          {PARTS.map((p) => (
            <li key={p.part}>
              <b>{p.part}</b>
              <span>{p.meaning}</span>
            </li>
          ))}
        </ol>
        <p className="wordparts__say">
          Say it <TermButton termKey="nephroblastoma">NEF-roh-blas-TOH-muh</TermButton> <Cites ids={[15, 1]} />
        </p>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------------ plate label (hinge) */

export function PlateLabel() {
  return (
    <div className="plate-label" aria-hidden="true" style={{ opacity: 0 }}>
      <div className="plate-label__kicker">Plate I</div>
      <div className="plate-label__title">The urinary organs</div>
    </div>
  );
}

/* ------------------------------------------------------------------ layer */

export function HistoryLayer() {
  return (
    <div className="history">
      <Cover />
      <Profile />
      <Book />
      <Naming />
    </div>
  );
}
