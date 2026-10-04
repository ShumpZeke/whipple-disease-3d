import { creditLine } from '../app/config';
import { scrollToStop } from '../app/journey';
import { useStory } from '../app/store';
import { SOURCES_PAGE } from '../content/story';

/*
 * The summary: the whole story as ONE drawing. A single line runs from who gets it, through the
 * cause and the first sign, into the kidney with its tumor in the middle, and out to how it is
 * found, treated and how it ends. Nothing sits in a box; every number is drawn, and each small
 * number opens its reference. Drawn on a 1600 × 900 canvas that scales to the screen.
 */

/** Small reference numbers after a line of text; each one opens that reference. */
function Refs({ ids }: { ids: number[] }) {
  const open = useStory((s) => s.openSources);
  return (
    <>
      {ids.map((id, i) => (
        <tspan
          key={id}
          className="sum__ref"
          dx={i ? 0 : 8}
          dy={i ? 0 : -9}
          role="button"
          tabIndex={0}
          aria-label={`Reference ${id}`}
          onClick={() => open(id)}
          onKeyDown={(e) => e.key === 'Enter' && open(id)}
        >
          {i ? `,${id}` : id}
        </tspan>
      ))}
    </>
  );
}

/** A stop along the line: its number and name. */
function Station({ x, y, n, name }: { x: number; y: number; n: string; name: string }) {
  return (
    <text x={x} y={y} className="sum__kicker">
      <tspan className="sum__n">{n}</tspan> {name}
    </text>
  );
}

const L = 96; // left column
const R = 1096; // right column
const RL = R - 36; // the line down the right column
const AGE = 34; // pixels per year on the age line
const DOT = 17; // spacing of the 100 dots

export function Summary() {
  const restart = useStory((s) => s.restart);
  return (
    <svg className="sum" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid meet" role="img" aria-labelledby="sum-title sum-desc">
      <desc id="sum-desc">
        Wilms tumor in one picture: it affects children aged 2 to 5, about 600 a year in the United States; young kidney cells keep dividing, 9 in 10
        times by chance; the first sign is a painless lump in the belly; an ultrasound finds it; surgery removes the kidney and chemotherapy follows;
        93 of 100 children are alive five years later.
      </desc>
      <defs>
        <radialGradient id="sum-kidney" cx="0.62" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#c8604c" />
          <stop offset="0.6" stopColor="#9b3b31" />
          <stop offset="1" stopColor="#6d2622" />
        </radialGradient>
        <radialGradient id="sum-tumor" cx="0.4" cy="0.3" r="0.9">
          <stop offset="0" stopColor="#e3c3ae" />
          <stop offset="1" stopColor="#a67f6c" />
        </radialGradient>
        <marker id="sum-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" className="sum__arrowhead" />
        </marker>
      </defs>

      {/* ---------------------------------------------------------------- title */}
      <text id="sum-title" x={L} y="112" className="sum__title">
        Wilms tumor, in short
      </text>
      <text x={L} y="154" className="sum__sub">
        Nephroblastoma: the most common kidney cancer in children, named after Max Wilms (1899)
        <Refs ids={[1, 3, 9]} />
      </text>

      {/* ---------------------------------------------------------------- the one line through it all */}
      <path className="sum__line" d="M60 236 V796 Q60 846 110 846 H470 C650 846 730 720 838 612" markerEnd="url(#sum-arrow)" />
      <path className="sum__line" d={`M872 292 C920 200 1010 190 ${RL} 236 V820`} markerEnd="url(#sum-arrow)" />
      {[
        [60, 250],
        [60, 470],
        [60, 722],
        [RL, 250],
        [RL, 470],
        [RL, 660],
      ].map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="8" className="sum__node" />
      ))}

      {/* ---------------------------------------------------------------- 01 who */}
      <Station x={L} y={256} n="01" name="Who" />
      <text x={L} y="296" className="sum__head">
        Kids aged 2 to 5
      </text>
      <line x1={L} y1="336" x2={L + AGE * 10} y2="336" className="sum__axis" />
      <line x1={L + AGE * 2} y1="336" x2={L + AGE * 5} y2="336" className="sum__band" />
      {[0, 2, 5, 10].map((a) => (
        <g key={a}>
          <line x1={L + AGE * a} y1="328" x2={L + AGE * a} y2="344" className="sum__axis" />
          <text x={L + AGE * a} y="368" className="sum__tick">
            {a}
          </text>
        </g>
      ))}
      <text x={L + AGE * 10 + 16} y="368" className="sum__tick sum__tick--start">
        years old
      </text>
      <text x={L} y="404" className="sum__body">
        about 600 children a year in the U.S.
        <Refs ids={[1, 4]} />
      </text>

      {/* ---------------------------------------------------------------- 02 cause */}
      <Station x={L} y={476} n="02" name="Cause" />
      <text x={L} y="516" className="sum__head">
        Young kidney cells keep dividing
      </text>
      {/* one cell becomes two, four, a clump */}
      <g className="sum__cells">
        <circle cx={L + 16} cy="560" r="15" />
        <circle cx={L + 86} cy="560" r="13" />
        <circle cx={L + 110} cy="560" r="13" />
        {[0, 1, 2, 3].map((i) => (
          <circle key={i} cx={L + 176 + (i % 2) * 22} cy={549 + Math.floor(i / 2) * 22} r="11" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <circle key={i} cx={L + 268 + (i % 3) * 19} cy={541 + Math.floor(i / 3) * 19} r="9.5" />
        ))}
      </g>
      {[42, 134, 222].map((dx) => (
        <path key={dx} d={`M${L + dx} 560 h22`} className="sum__step" markerEnd="url(#sum-arrow)" />
      ))}
      <rect x={L} y="604" width="306" height="12" className="sum__bar" />
      <rect x={L + 306} y="604" width="34" height="12" className="sum__bar sum__bar--rest" />
      <text x={L} y="644" className="sum__body">
        9 in 10 by chance, not inherited
        <Refs ids={[8]} />
      </text>

      {/* ---------------------------------------------------------------- 03 signs */}
      <Station x={L} y={728} n="03" name="First sign" />
      <text x={L} y="768" className="sum__head">
        A painless lump in the belly
      </text>
      <text x={L} y="804" className="sum__body">
        sometimes blood in the urine (hematuria)
        <Refs ids={[5, 2]} />
      </text>

      {/* ---------------------------------------------------------------- the kidney, in the middle */}
      <path d="M776 452 C700 470 664 560 690 700" className="sum__ureter" />
      <path d="M694 428 H770" className="sum__vessel sum__vessel--a" />
      <path d="M694 462 H770" className="sum__vessel sum__vessel--v" />
      <path
        d="M846 286 C950 286 972 400 950 486 C928 588 866 626 806 614 C752 603 742 552 772 512 C798 476 798 430 772 390 C742 338 772 286 846 286 Z"
        fill="url(#sum-kidney)"
        className="sum__kidney"
      />
      <path
        d="M878 508 C912 496 952 520 960 556 C968 596 940 630 900 632 C860 634 828 606 830 568 C832 538 850 516 878 508 Z"
        fill="url(#sum-tumor)"
        className="sum__tumor"
      />
      <path d="M690 318 L792 340" className="sum__leader" />
      <text x="682" y="312" className="sum__label sum__label--end">
        starts in one kidney
      </text>
      <path d="M900 636 V664" className="sum__leader" />
      <text x="900" y="690" className="sum__label sum__label--mid">
        the tumor
      </text>

      {/* ---------------------------------------------------------------- 04 find */}
      <Station x={R} y={256} n="04" name="Find it" />
      <text x={R} y="296" className="sum__head">
        Ultrasound first
      </text>
      <text x={R} y="332" className="sum__body">
        then CT or MRI for detail
        <Refs ids={[6]} />
      </text>
      {/* the probe's fan, with the lump in it */}
      <g className="sum__fan" transform={`translate(${R - 1140} 0)`}>
        <path d="M1180 362 L1126 438 A94 94 0 0 0 1234 438 Z" />
        <path d="M1150 404 A52 52 0 0 0 1210 404" />
        <path d="M1138 422 A72 72 0 0 0 1222 422" />
        <circle cx="1184" cy="420" r="11" className="sum__fan-lump" />
      </g>

      {/* ---------------------------------------------------------------- 05 treat */}
      <Station x={R} y={476} n="05" name="Treat it" />
      <text x={R} y="516" className="sum__head">
        Surgery removes the kidney
      </text>
      <text x={R} y="552" className="sum__body">
        a nephrectomy, then chemotherapy
        <Refs ids={[1, 7]} />
      </text>

      {/* ---------------------------------------------------------------- 06 outcome */}
      <Station x={R} y={666} n="06" name="Outcome" />
      <g>
        {Array.from({ length: 100 }, (_, i) => (
          <circle key={i} cx={R + 7 + (i % 10) * DOT} cy={692 + Math.floor(i / 10) * DOT} r="6" className={i < 93 ? 'sum__dot' : 'sum__dot sum__dot--off'} />
        ))}
      </g>
      <text x={R + 196} y="768" className="sum__big">
        93
      </text>
      <text x={R + 196} y="806" className="sum__body">
        of 100 children
      </text>
      <text x={R + 196} y="836" className="sum__body">
        alive 5 years later
        <Refs ids={[2]} />
      </text>

      {/* ---------------------------------------------------------------- where next */}
      <foreignObject x={R} y="84" width="380" height="44">
        <div className="sum__links">
          <button type="button" className="text-link" onClick={() => scrollToStop(SOURCES_PAGE)}>
            References
          </button>
          <button type="button" className="text-link" onClick={restart}>
            Start again
          </button>
        </div>
      </foreignObject>
      <text x="800" y="884" className="sum__credit">
        {creditLine()}
      </text>
    </svg>
  );
}
