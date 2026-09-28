import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { creditLine } from '../app/config';
import { smoothstep } from '../app/journey';
import { useStory } from '../app/store';
import { NAMING_MARKS, SUMMARY_MARKS, type Box } from '../content/archive';
import { STOP_INDEX, type World } from '../content/story';
import { Cites, TermButton } from './RichText';
import { useJourney } from './useJourney';

/* ------------------------------------------------------------------ backdrops */

const DEEP: World[] = ['tissue', 'villi', 'micro', 'diagnosis'];

/**
 * Backdrops cross-fade with the scroll: dark (1907 title) → the laboratory film (history) →
 * paper (the engraved plate) → studio graphite (anatomy) or deep plum (tissue and cells).
 */
export function Backdrops() {
  const reduced = useStory((s) => s.reducedMotion);
  const world = useStory((s) => s.displayWorld);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dark = useRef<HTMLDivElement>(null);
  const lab = useRef<HTMLDivElement>(null);
  const credit = useRef<HTMLParagraphElement>(null);
  const [videoOk, setVideoOk] = useState(true);
  const [labVisible, setLabVisible] = useState(true);

  useJourney((t) => {
    const labOpacity = smoothstep(0.15, 0.6, t) * (1 - smoothstep(STOP_INDEX.name + 0.02, STOP_INDEX.name + 0.3, t));
    if (dark.current) dark.current.style.opacity = String(1 - smoothstep(0.25, 0.7, t));
    if (lab.current) {
      lab.current.style.opacity = String(labOpacity);
      // slow push-in: the laboratory drifts closer as we scroll into the story
      lab.current.style.transform = `scale(${1.02 + 0.045 * Math.min(t, 3.5)})`;
    }
    if (credit.current) {
      credit.current.style.opacity = String(labOpacity);
      credit.current.style.visibility = labOpacity < 0.01 ? 'hidden' : 'visible';
    }
    const on = labOpacity > 0.01;
    setLabVisible((v) => (v === on ? v : on));
  });

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (labVisible && !reduced) v.play().catch(() => setVideoOk(false));
    else v.pause();
  }, [labVisible, reduced]);

  return (
    <>
      <div ref={dark} className="backdrop backdrop--dark is-on" />
      <div ref={lab} className="backdrop backdrop--lab is-on is-driven" aria-hidden="true">
        {/* Poster keeps the plate visible for reduced motion or if autoplay is blocked */}
        <img src="/media/lab-1907-poster.jpg" alt="" />
        {videoOk && (
          <video
            ref={videoRef}
            src="/media/lab-1907-reconstruction.mp4"
            poster="/media/lab-1907-poster.jpg"
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setVideoOk(false)}
          />
        )}
      </div>
      <p ref={credit} className="lab-credit">
        Background: AI-generated reconstruction (Google Vids) · not a historical photo
      </p>
      <div className={`backdrop backdrop--studio${world === 'anatomy' ? ' is-on' : ''}`} />
      <div className={`backdrop backdrop--deep${DEEP.includes(world) ? ' is-on' : ''}`} />
      {/* Paper for the engraved 1907-style plate; the scroll "develops" it away (HingeController). */}
      <div className="backdrop backdrop--paper hinge-paper is-driven" style={{ opacity: 0 }} />
    </>
  );
}

/* ------------------------------------------------------------------ shared bits */

function Note({ title, children, style }: { title: string; children: ReactNode; style?: CSSProperties }) {
  return (
    <div className="note" role="status" style={style}>
      <b>{title}</b>
      {children}
    </div>
  );
}

function Marks({ boxes, label, active, onSelect }: { boxes: Box[]; label: string; active: boolean; onSelect: () => void }) {
  return (
    <>
      {boxes.map(([x, y, w, h], i) => (
        <button
          key={i}
          type="button"
          className={`doc__mark${active ? ' is-active' : ''}`}
          aria-label={i === 0 ? label : `${label} (continued)`}
          tabIndex={i === 0 ? 0 : -1}
          style={{ left: `${x * 100}%`, top: `${y * 100}%`, width: `${w * 100}%`, height: `${h * 100}%` }}
          onClick={onSelect}
        />
      ))}
    </>
  );
}

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

/* ------------------------------------------------------------------ 1907 title */

function Title() {
  const ref = useRef<HTMLDivElement>(null);
  const year = useRef<HTMLDivElement>(null);
  useJourney((t) => {
    const el = ref.current;
    if (el) {
      const o = 1 - smoothstep(0.08, 0.42, t);
      el.style.opacity = String(o);
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible';
      el.style.pointerEvents = o > 0.6 ? 'auto' : 'none';
    }
    // zoom straight through the year
    if (year.current) year.current.style.transform = `scale(${(1 + t * 3.2).toFixed(4)})`;
  });
  return (
    <section ref={ref} className="intro" aria-labelledby="intro-title">
      <div className="intro__inner">
        <div ref={year} className="intro__year" aria-hidden="true">
          1907
        </div>
        <p className="intro__eyebrow">Medical Terminology · Eponym #26</p>
        <h1 id="intro-title" className="intro__title">
          Whipple’s Disease
        </h1>
        <p className="intro__sub">A zoom from the first case in 1907 down to the germ that causes it.</p>
        <button type="button" className="begin-btn intro__begin" onClick={() => useStory.getState().next()}>
          Start the zoom
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
            <path d="M8 3v10M4 9l4 4 4-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
        <p className="intro__meta">Say it “WIP-ulz” · also written “Whipple disease”</p>
      </div>
      <p className="sr-only">{creditLine()}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ Whipple */

function Doctor() {
  const ref = useRef<HTMLDivElement>(null);
  useJourney((t) => flyThrough(ref.current, t, STOP_INDEX.doctor));
  return (
    <div ref={ref} className="archive-stage fly">
      <figure className="print portrait" style={{ margin: 0 }}>
        <img
          src="/archive/whipple-portrait-1934.webp"
          width={280}
          height={396}
          alt="Black-and-white portrait photograph of George Hoyt Whipple in a suit, 1934."
        />
        <figcaption className="print__caption">George Hoyt Whipple (1878–1976). Photo 1934, public domain.</figcaption>
      </figure>
    </div>
  );
}

/* ------------------------------------------------------------------ the case */

const CASE_NOTES: Record<keyof typeof SUMMARY_MARKS, { title: string; modern: string; body: ReactNode }> = {
  weight: {
    title: '“gradual loss of weight and strength”',
    modern: 'Today: weight loss',
    body: (
      <>
        The body was not absorbing enough nutrients. <Cites ids={[5, 1]} />
      </>
    ),
  },
  fat: {
    title: '“stools consisting chiefly of neutral fat”',
    modern: 'Today: fatty diarrhea',
    body: (
      <>
        Fat passed straight through — a sign of <TermButton termKey="malabsorption">malabsorption</TermButton>.{' '}
        <Cites ids={[5, 12]} />
      </>
    ),
  },
  arthritis: {
    title: '“a peculiar multiple arthritis”',
    modern: 'Today: joint pain (arthralgia)',
    body: (
      <>
        Still one of the four main symptoms — and often the first. <Cites ids={[5, 2]} />
      </>
    ),
  },
  villi: {
    title: '“enlarged villi due to deposits … of neutral fats”',
    modern: 'Today: damaged villi',
    body: (
      <>
        The tiny absorbing projections were swollen and packed with fat. <Cites ids={[5]} />
      </>
    ),
  },
};

function Case() {
  const ref = useRef<HTMLDivElement>(null);
  const note = useStory((s) => s.historyNote) as keyof typeof SUMMARY_MARKS | null;
  const setNote = useStory((s) => s.setHistoryNote);
  useJourney((t) => flyThrough(ref.current, t, STOP_INDEX.case));
  const active = note && CASE_NOTES[note] ? CASE_NOTES[note] : null;
  return (
    <div ref={ref} className="archive-stage fly">
      <figure className="print doc" style={{ margin: 0 }}>
        <img
          className="doc__title"
          src="/archive/whipple1907-title.webp"
          width={1500}
          height={239}
          alt="Headline of the 1907 article: A hitherto undescribed disease characterized anatomically by deposits of fat and fatty acids in the intestinal and mesenteric lymphatic tissues. By G. H. Whipple, M.D., Instructor in Pathology, Johns Hopkins University."
        />
        <div className="doc__figure">
          <img
            src="/archive/whipple1907-summary.webp"
            width={1100}
            height={442}
            alt="Opening paragraph of Whipple's 1907 report describing gradual loss of weight and strength, fatty stools, a peculiar multiple arthritis, and enlarged villi with fat deposits."
          />
          {(Object.keys(SUMMARY_MARKS) as (keyof typeof SUMMARY_MARKS)[]).map((k) => (
            <Marks
              key={k}
              boxes={SUMMARY_MARKS[k]}
              label={`Phrase: ${CASE_NOTES[k].title.replace(/[“”]/g, '')}`}
              active={note === k}
              onSelect={() => setNote(note === k ? null : k)}
            />
          ))}
        </div>
        <figcaption className="print__caption">Bulletin of the Johns Hopkins Hospital, September 1907, p. 382 — public domain.</figcaption>
        {active && (
          <Note title={active.title} style={{ left: 0, top: 'calc(100% + 14px)', width: 'min(420px, 100%)' }}>
            <span className="note__modern">{active.modern}</span>
            <span style={{ display: 'block', marginTop: 6 }}>{active.body}</span>
          </Note>
        )}
      </figure>
    </div>
  );
}

/* ------------------------------------------------------------------ the name */

function Naming() {
  const ref = useRef<HTMLDivElement>(null);
  const plate = useRef<HTMLElement>(null);
  const note = useStory((s) => s.historyNote);
  const setNote = useStory((s) => s.setHistoryNote);
  useJourney((t) => {
    const k = STOP_INDEX.name;
    const el = ref.current;
    if (!el) return;
    const d = t - k;
    // arriving: like the other pages. leaving: we zoom into the 1907 photomicrograph itself.
    const opacity = d < 0 ? 1 - smoothstep(0.28, 0.52, -d) : 1 - smoothstep(0.12, 0.4, d);
    el.style.opacity = String(opacity);
    el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
    el.style.pointerEvents = opacity > 0.6 ? 'auto' : 'none';
    el.style.transform = `scale(${(d < 0 ? 1 + d * 0.22 : 1 + d * 2.2).toFixed(4)})`;
    if (plate.current) plate.current.style.transform = `scale(${(d > 0 ? 1 + d * 2.5 : 1).toFixed(4)})`;
  });
  return (
    <div ref={ref} className="archive-stage fly">
      <div className="naming-stage">
        <figure className="print doc" style={{ margin: 0, width: '100%' }}>
          <div className="doc__figure">
            <img
              src="/archive/whipple1907-naming.webp"
              width={1100}
              height={353}
              alt="Paragraph from page 391 of Whipple's 1907 article, where he writes that no suitable name can be applied until the cause is determined, and suggests the term Intestinal Lipodystrophy."
            />
            <Marks
              boxes={NAMING_MARKS.noName}
              label="Phrase: no suitable name can be applied until the cause is determined"
              active={note === 'noName'}
              onSelect={() => setNote(note === 'noName' ? null : 'noName')}
            />
            <Marks
              boxes={NAMING_MARKS.term}
              label="Phrase: Intestinal Lipodystrophy"
              active={note === 'term'}
              onSelect={() => setNote(note === 'term' ? null : 'term')}
            />
          </div>
          <figcaption className="print__caption">Whipple, 1907, p. 391 — public domain.</figcaption>
          {note === 'noName' && (
            <Note title="A placeholder name" style={{ left: 0, top: 'calc(100% + 14px)' }}>
              “Etiological factor” means the cause. Whipple knew his name was temporary until the cause was found.{' '}
              <Cites ids={[5]} />
            </Note>
          )}
          {note === 'term' && (
            <Note title="Intestinal lipodystrophy" style={{ left: 0, top: 'calc(100% + 14px)' }}>
              lip(o)- fat + dys- abnormal + -trophy growth: “abnormal fat” in the intestine.{' '}
              <TermButton termKey="lipodystrophy">More</TermButton> <Cites ids={[13, 5]} />
            </Note>
          )}
        </figure>
        <figure ref={plate} className="print plate" style={{ margin: 0 }}>
          <img
            src="/archive/whipple1907-fig9.webp"
            width={900}
            height={690}
            alt="1907 black-and-white photomicrograph of a silver-stained lymph node, with a vacuole marked a containing a rod-shaped organism."
          />
          <figcaption className="print__caption">
            Fig. 9 (1907): a vacuole “containing rod-shaped organism (?)”. The question mark is Whipple’s.{' '}
            <Cites ids={[5]} />
          </figcaption>
        </figure>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ plate label (hinge) */

export function PlateLabel() {
  return (
    <div className="plate-label" aria-hidden="true" style={{ opacity: 0 }}>
      <div className="plate-label__kicker">Plate I</div>
      <div className="plate-label__title">The organs of digestion</div>
    </div>
  );
}

/* ------------------------------------------------------------------ layer */

export function HistoryLayer() {
  return (
    <div className="history">
      <Title />
      <Doctor />
      <Case />
      <Naming />
    </div>
  );
}
