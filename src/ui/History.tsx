import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { creditLine } from '../app/config';
import { useStory } from '../app/store';
import { NAMING_MARKS, SUMMARY_MARKS, type Box } from '../content/archive';
import { STEPS } from '../content/story';
import { Cites, TermButton } from './RichText';

/* ------------------------------------------------------------------ backdrops */

export function Backdrops() {
  const step = useStory((s) => s.step);
  const reduced = useStory((s) => s.reducedMotion);
  const b = STEPS[step].backdrop;
  const id = STEPS[step].id;
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoOk, setVideoOk] = useState(true);
  const labOn = b === 'lab';

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (labOn && !reduced) v.play().catch(() => setVideoOk(false));
    else v.pause();
  }, [labOn, reduced]);

  return (
    <>
      <div className={`backdrop backdrop--dark${b === 'dark' ? ' is-on' : ''}`} />
      <div className={`backdrop backdrop--lab${labOn ? ' is-on' : ''}`} aria-hidden="true">
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
            preload={step <= 2 ? 'auto' : 'none'}
            onError={() => setVideoOk(false)}
          />
        )}
      </div>
      {labOn && <p className="lab-credit">Background: AI-generated reconstruction (Google Vids) · not a historical photo</p>}
      <div className={`backdrop backdrop--studio${b === 'studio' ? ' is-on' : ''}`} />
      <div className={`backdrop backdrop--deep${b === 'deep' ? ' is-on' : ''}`} />
      {/* The paper stays up at the start of the 1907 → today transition; HingePaper wipes it away. */}
      <div className={`backdrop backdrop--paper hinge-paper${id === 'modern' ? ' is-on' : ''}`} />
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

function Marks({
  boxes,
  label,
  active,
  onSelect,
}: {
  boxes: Box[];
  label: string;
  active: boolean;
  onSelect: () => void;
}) {
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

/* ------------------------------------------------------------------ 0 · intro */

export function Intro() {
  const next = useStory((s) => s.next);
  return (
    <section className="intro" aria-labelledby="intro-title">
      <div className="intro__inner">
        <div className="intro__year" aria-hidden="true">
          1907
        </div>
        <p className="intro__eyebrow">Medical Terminology · Eponym #26</p>
        <h1 id="intro-title" className="intro__title">
          Whipple’s Disease
        </h1>
        <p className="intro__sub">
          A young pathologist, a puzzling autopsy, and a bacterium that stayed hidden for 85 years.
        </p>
        <div className="intro__begin">
          <button type="button" className="begin-btn" onClick={next} autoFocus>
            Begin
            <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
              <path d="M3 8h10M9 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <p className="intro__meta">
          Also written “Whipple disease” · say “WIP-ul” · use ← → or the arrows to move through the story
        </p>
      </div>
      <p className="sr-only">{creditLine()}</p>
    </section>
  );
}

/* ------------------------------------------------------------------ 1 · Whipple */

const WHIPPLE_NOTES = [
  {
    id: 'path',
    label: 'Pathologist',
    x: 86,
    y: 18,
    body: (
      <>
        <TermButton termKey="pathology">Pathology</TermButton> = path(o)- “disease” + -logy “study of.” Pathologists
        examine tissues and organs to find what caused an illness. <Cites ids={[13, 16]} />
      </>
    ),
  },
  {
    id: 'hopkins',
    label: 'Training',
    x: 14,
    y: 56,
    body: (
      <>
        Born 1878 in Ashland, New Hampshire. Yale (1900), then an M.D. from Johns Hopkins (1905), where he taught
        pathology until 1914. <Cites ids={[7]} />
      </>
    ),
  },
  {
    id: 'nobel',
    label: 'Nobel Prize',
    x: 82,
    y: 74,
    body: (
      <>
        This photo is from 1934, when Whipple shared the Nobel Prize in Physiology or Medicine for work showing liver in
        the diet helps treat anemia. <Cites ids={[7]} />
      </>
    ),
  },
];

export function WhippleScene() {
  const note = useStory((s) => s.historyNote);
  const setNote = useStory((s) => s.setHistoryNote);
  const active = WHIPPLE_NOTES.find((n) => n.id === note);
  return (
    <div className="archive-stage">
      <figure className="print portrait" style={{ margin: 0 }}>
        <img
          src="/archive/whipple-portrait-1934.webp"
          width={280}
          height={396}
          alt="Black-and-white portrait photograph of George Hoyt Whipple in a suit, 1934."
        />
        <figcaption className="print__caption">George Hoyt Whipple (1878–1976). Photo 1934, public domain.</figcaption>
        {WHIPPLE_NOTES.map((n, i) => (
          <button
            key={n.id}
            type="button"
            className={`pin${note === n.id ? ' is-active' : ''}`}
            style={{ left: `calc(${n.x}% - 15px)`, top: `calc(${n.y}% - 15px)` }}
            aria-label={`Note ${i + 1}: ${n.label}`}
            aria-expanded={note === n.id}
            onClick={() => setNote(note === n.id ? null : n.id)}
          >
            {i + 1}
          </button>
        ))}
        {active && (
          <Note
            title={active.label}
            style={{
              left: active.x > 50 ? 'auto' : '104%',
              right: active.x > 50 ? '104%' : 'auto',
              top: `calc(${active.y}% - 30px)`,
            }}
          >
            <span>{active.body}</span>
          </Note>
        )}
      </figure>
    </div>
  );
}

/* ------------------------------------------------------------------ 2 · the case */

const CASE_NOTES: Record<keyof typeof SUMMARY_MARKS, { title: string; modern: string; body: ReactNode }> = {
  weight: {
    title: '“gradual loss of weight and strength”',
    modern: 'Today: weight loss',
    body: (
      <>
        The body was not absorbing enough nutrients from food. <Cites ids={[5, 1]} />
      </>
    ),
  },
  fat: {
    title: '“stools consisting chiefly of neutral fat”',
    modern: 'Today: fatty diarrhea',
    body: (
      <>
        Fat passed straight through without being absorbed — a sign of{' '}
        <TermButton termKey="malabsorption">malabsorption</TermButton>. <Cites ids={[5, 12]} />
      </>
    ),
  },
  arthritis: {
    title: '“a peculiar multiple arthritis”',
    modern: 'Today: joint pain (arthralgia)',
    body: (
      <>
        Pain in many joints — still one of the four main symptoms, and often the first. <Cites ids={[5, 2]} />
      </>
    ),
  },
  villi: {
    title: '“enlarged villi due to deposits … of neutral fats”',
    modern: 'Today: damaged villi',
    body: (
      <>
        The tiny absorbing projections of the lining were swollen and packed with fat. <Cites ids={[5]} />
      </>
    ),
  },
};

export function CaseScene() {
  const note = useStory((s) => s.historyNote) as keyof typeof SUMMARY_MARKS | null;
  const setNote = useStory((s) => s.setHistoryNote);
  const active = note && CASE_NOTES[note] ? CASE_NOTES[note] : null;
  return (
    <div className="archive-stage">
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
        <figcaption className="print__caption">
          Bulletin of the Johns Hopkins Hospital, September 1907, p. 382 — public domain.
        </figcaption>
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

/* ------------------------------------------------------------------ 3 · naming */

export function NamingScene() {
  const note = useStory((s) => s.historyNote);
  const setNote = useStory((s) => s.setHistoryNote);
  return (
    <div className="archive-stage">
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
        <figure className="print plate" style={{ margin: 0 }}>
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

/* ------------------------------------------------------------------ 4 · correction */

export function CorrectionScene() {
  return (
    <div className="archive-stage">
      <article className="erratum" aria-labelledby="erratum-title">
        <div className="erratum__head">
          <strong id="erratum-title">Erratum</strong>
          <span>Class eponym list, item #26</span>
        </div>
        <div className="erratum__row">
          <span className="erratum__label">Listed</span>
          <span>
            Whipple’s disease — <s>Allen Whipple</s>
          </span>
        </div>
        <div className="erratum__row">
          <span className="erratum__label">Verified</span>
          <span>
            <b>George Hoyt Whipple</b> (1878–1976), pathologist at Johns Hopkins, first described the disease in 1907.{' '}
            <Cites ids={[5, 6, 7]} />
          </span>
        </div>
        <div className="erratum__row">
          <span className="erratum__label">The other Whipple</span>
          <span>
            <b>Allen Oldfather Whipple</b> (1881–1963), a surgeon at Columbia, gave his name to the Whipple procedure — a
            pancreas operation first reported in 1935. <Cites ids={[8, 15]} />
          </span>
        </div>
        <p className="erratum__note">Same surname, different doctors, different specialties.</p>
      </article>
    </div>
  );
}

/* ------------------------------------------------------------------ router */

export function HistoryLayer() {
  const step = useStory((s) => s.step);
  const id = STEPS[step].id;
  return (
    <div className="history">
      {id === 'intro' && <Intro />}
      {id === 'whipple' && <WhippleScene />}
      {id === 'case' && <CaseScene />}
      {id === 'naming' && <NamingScene />}
      {id === 'correction' && <CorrectionScene />}
    </div>
  );
}
