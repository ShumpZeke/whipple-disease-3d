import { FIGURES, type Figure, type Stat } from '../content/figures';
import type { StopId } from '../content/story';
import { Cites } from './RichText';

/*
 * The infographic's charts: small, flat and quiet, in the exhibit's own type (a mono label, a big
 * number, thin lines and one accent colour). Each draws exactly the numbers in figures.ts.
 */

function Head({ title, cites }: { title: string; cites?: number[] }) {
  return (
    <p className="fig__head">
      <span>{title}</span>
      {cites && <Cites ids={cites} />}
    </p>
  );
}

export function StatRow({ items, className = '' }: { items: Stat[]; className?: string }) {
  return (
    <ul className={`fig-stats ${className}`}>
      {items.map((s) => (
        <li key={s.label}>
          <b className="fig__num">{s.value}</b>
          <span className="fig__label">
            {s.label} <Cites ids={s.cites} />
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Ages 0 to 12: two in three are found before age 5, nearly all before 10; the average is 3 to 4. */
function Ages() {
  const x = (age: number) => `${(age / 12) * 100}%`;
  return (
    <div className="fig-ages" role="img" aria-label="Two in three children are diagnosed before age 5 and nearly all before age 10. The average age is 3 to 4.">
      <div className="fig-ages__track">
        <span className="fig-ages__band is-strong" style={{ left: 0, width: x(5) }} />
        <span className="fig-ages__band" style={{ left: x(5), width: x(5) }} />
        <span className="fig-ages__avg" style={{ left: x(3.5) }} />
      </div>
      <div className="fig-ages__ticks" aria-hidden="true">
        {[0, 2, 4, 6, 8, 10, 12].map((a) => (
          <span key={a} style={{ left: x(a) }}>
            {a}
          </span>
        ))}
      </div>
      <p className="fig-ages__key">
        <span>
          <i className="is-strong" />2 in 3 before age 5
        </span>
        <span>
          <i />
          nearly all before 10
        </span>
        <span>
          <i className="is-avg" />
          average 3 to 4
        </span>
      </p>
    </div>
  );
}

function Bars({ rows, max = 100, unit = '%' }: { rows: { label: string; value: number; shown?: string }[]; max?: number; unit?: string }) {
  return (
    <ul className="fig-bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="fig-bars__label">{r.label}</span>
          <span className="fig-bars__track" aria-hidden="true">
            <span className="fig-bars__fill" style={{ width: `${Math.max(0.8, (r.value / max) * 100)}%` }} />
          </span>
          <span className="fig-bars__value">{r.shown ?? `${r.value}${unit}`}</span>
        </li>
      ))}
    </ul>
  );
}

function Dots({ value }: { value: number }) {
  return (
    <span className="fig-dots" aria-hidden="true">
      {Array.from({ length: 100 }, (_, i) => (
        <i key={i} className={i < value ? 'is-on' : ''} />
      ))}
    </span>
  );
}

function One({ f }: { f: Figure }) {
  switch (f.kind) {
    case 'stats':
      return (
        <div className="fig">
          <Head title={f.title} />
          <StatRow items={f.items} />
        </div>
      );
    case 'ages':
      return (
        <div className="fig">
          <Head title={f.title} cites={f.cites} />
          <Ages />
        </div>
      );
    case 'compare':
      return (
        <div className="fig">
          <Head title={f.title} cites={f.cites} />
          <Bars rows={f.rows} max={Math.max(...f.rows.map((r) => r.value))} />
        </div>
      );
    case 'big':
      return (
        <div className="fig fig--big">
          <b className="fig__num">{f.value}</b>
          <span className="fig__label">
            {f.label} <Cites ids={f.cites} />
          </span>
        </div>
      );
    case 'split':
      return (
        <div className="fig">
          <Head title={f.title} cites={f.cites} />
          <div className="fig-split" role="img" aria-label={`${f.value}% ${f.a.toLowerCase()}, ${100 - f.value}% ${f.b.toLowerCase()}`}>
            <span className="fig-split__a" style={{ width: `${f.value}%` }} />
            <span className="fig-split__b" style={{ width: `${100 - f.value}%` }} />
          </div>
          <p className="fig-ages__key">
            <span>
              <i className="is-strong" />
              {f.value}% {f.a.toLowerCase()}
            </span>
            <span>
              <i />
              {100 - f.value}% {f.b.toLowerCase()}
            </span>
          </p>
        </div>
      );
    case 'bars':
      return (
        <div className="fig">
          <Head title={f.title} cites={f.cites} />
          <Bars rows={f.rows} />
        </div>
      );
    case 'dots':
      return (
        <div className="fig fig--dots" role="img" aria-label={`${f.value} out of 100 ${f.label}`}>
          <Dots value={f.value} />
          <span>
            <Head title={f.title} />
            <b className="fig__num">{f.value}</b>
            <span className="fig__label">
              {f.label} <Cites ids={f.cites} />
            </span>
          </span>
        </div>
      );
    case 'meta':
      return (
        <dl className="fig-meta">
          {f.rows.map((r, i) => (
            <div key={r.label}>
              <dt>{r.label}</dt>
              <dd>
                {r.value} {i === f.rows.length - 1 && <Cites ids={f.cites} />}
              </dd>
            </div>
          ))}
        </dl>
      );
  }
}

/** The figures for a stop, under its words. */
export function StopFigures({ id }: { id: StopId }) {
  const list = FIGURES[id];
  if (!list) return null;
  return (
    <div className="figs">
      {list.map((f, i) => (
        <One key={i} f={f} />
      ))}
    </div>
  );
}
