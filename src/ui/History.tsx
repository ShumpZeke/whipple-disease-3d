import { useRef, type CSSProperties, type ReactNode } from 'react';
import { periodLabel, SUBMISSION } from '../app/config';
import { scrollToStop, smoothstep } from '../app/journey';
import { useStory } from '../app/store';
import { NAMING_MARKS, SUMMARY_MARKS, type Box } from '../content/archive';
import { SECTIONS, STOP_INDEX, STOPS, type World } from '../content/story';
import { Cites, RichText, TermButton } from './RichText';
import { useJourney } from './useJourney';

/* ------------------------------------------------------------------ backdrops */

const DEEP: World[] = ['tissue', 'villi', 'micro', 'diagnosis'];

/**
 * Backdrops cross-fade with the scroll: the home screen → a warm archive tone (history) →
 * paper (the engraved plate) → studio graphite (anatomy) or deep plum (tissue and cells).
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

/* ------------------------------------------------------------------ home screen */

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
      <div className="cover__text">
        <p className="cover__eyebrow">Medical Terminology · Eponym #26</p>
        <h1 id="cover-title" className="cover__title">
          Whipple’s Disease
        </h1>
        <p className="cover__say">
          say “WIP-ulz dih-ZEEZ” · modern spelling: <b>Whipple disease</b> <Cites ids={[1, 3]} />
        </p>
        <p className="cover__def">
          <RichText text={STOPS[0].text} />
        </p>
        <p className="cover__by">
          By <b>{SUBMISSION.studentName}</b> · {SUBMISSION.course} · {periodLabel()}
        </p>
        <button type="button" className="pill pill--primary cover__start" onClick={() => scrollToStop(1)}>
          Start
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
            <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <nav className="cover__toc" aria-label="What’s inside">
          <p className="cover__toc-title">What’s inside</p>
          <ol>
            {SECTIONS.map((sec, i) => (
              <li key={sec.title} className={`cat-${sec.cat}`}>
                <button type="button" onClick={() => scrollToStop(sec.stop)}>
                  <span className="cover__n">{i + 1}</span>
                  <span className="cover__sec">
                    <b>{sec.title}</b>
                    <small>{sec.sub}</small>
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </div>
      <figure className="cover__art">
        <img
          src="/cover/digestive.webp"
          width={688}
          height={1300}
          alt="3D model of the digestive system: liver, stomach, small intestine and large intestine."
        />
        <figcaption>The digestive system, where Whipple’s disease strikes</figcaption>
      </figure>
    </section>
  );
}

/* ------------------------------------------------------------------ who was Whipple */

const LIFE = [
  { year: '1878', text: 'Born in Ashland, New Hampshire, USA' },
  { year: '1905', text: 'Became a doctor (M.D.) at Johns Hopkins and joined its pathology department' },
  { year: '1907', text: 'First to describe this disease' },
  { year: '1934', text: 'Shared the Nobel Prize in Medicine for his work on anemia' },
];

/** A profile card: the 1934 portrait and the four dates to know. */
function Profile() {
  const ref = useRef<HTMLDivElement>(null);
  useJourney((t) => flyThrough(ref.current, t, STOP_INDEX.doctor));
  return (
    <div ref={ref} className="archive-stage fly">
      <article className="print profile" aria-label="Profile of George Hoyt Whipple">
        <figure className="profile__photo">
          <img
            src="/archive/whipple-portrait-1934.webp"
            width={280}
            height={396}
            alt="Black-and-white portrait photograph of George Hoyt Whipple in a suit, 1934."
          />
          <figcaption>Photo 1934 · public domain</figcaption>
        </figure>
        <div className="profile__body">
          <p className="profile__kicker">The disease is named after</p>
          <h2 className="profile__name">George Hoyt Whipple</h2>
          <p className="profile__life">1878–1976 · American pathologist</p>
          <ol className="profile__timeline">
            {LIFE.map((l) => (
              <li key={l.year}>
                <b>{l.year}</b>
                <span>{l.text}</span>
              </li>
            ))}
          </ol>
          <p className="profile__src">
            Sources <Cites ids={[7, 5, 6]} />
          </p>
        </div>
      </article>
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
      <Cover />
      <Profile />
      <Case />
      <Naming />
    </div>
  );
}
