import type { CSSProperties } from 'react';
import { FIGURES, type Figure, type Stat } from '../content/figures';
import type { StopId } from '../content/story';
import { Cites } from './RichText';

/*
 * Compact infographic visuals. They only appear when a number or sequence is easier to understand
 * visually than as another sentence.
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

/** Ages 0 to 12: most cases are found in early childhood, with the average around 3 to 4. */
function Ages() {
  const x = (age: number) => `${(age / 12) * 100}%`;
  return (
    <div className="fig-ages" role="img" aria-label="Wilms tumor is usually found in young children. The average age is about 3 to 4.">
      <div className="fig-ages__track">
        <span className="fig-ages__band is-strong" style={{ left: x(2), width: x(3) }} />
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
          <i className="is-strong" />
          common ages: 2 to 5
        </span>
        <span>
          <i className="is-avg" />
          average: 3 to 4
        </span>
      </p>
    </div>
  );
}

function Bars({ rows, max }: { rows: { label: string; value: number; shown: string }[]; max: number }) {
  return (
    <ul className="fig-bars">
      {rows.map((r) => (
        <li key={r.label}>
          <span className="fig-bars__label">{r.label}</span>
          <span className="fig-bars__track" aria-hidden="true">
            <span className="fig-bars__fill" style={{ width: `${Math.max(1, (r.value / max) * 100)}%` }} />
          </span>
          <span className="fig-bars__value">{r.shown}</span>
        </li>
      ))}
    </ul>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 36" aria-hidden="true">
      <circle cx="12" cy="6" r="4" />
      <path d="M7.2 13.2c0-2 1.7-3.7 3.7-3.7h2.2c2 0 3.7 1.7 3.7 3.7v8.2h-2.7V34h-4.2V21.4H7.2z" />
    </svg>
  );
}

function People({ active, total, label }: { active: number; total: number; label: string }) {
  return (
    <div className="fig-people" role="img" aria-label={label}>
      <span className="fig-people__icons" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <i key={i} className={i < active ? 'is-on' : ''}>
            <PersonIcon />
          </i>
        ))}
      </span>
      <span className="fig-people__label">{label}</span>
    </div>
  );
}

function Donut({ value, label, remainder }: { value: number; label: string; remainder: string }) {
  const style = { '--p': `${value}%` } as CSSProperties;
  return (
    <div className="fig-donut-wrap" role="img" aria-label={`${value}% ${label}; ${100 - value}% ${remainder}`}>
      <span className="fig-donut" style={style}>
        <span>
          <b>{value}%</b>
          <small>not inherited</small>
        </span>
      </span>
      <p className="fig-donut__key">
        <span>
          <i className="is-main" />
          {label}
        </span>
        <span>
          <i />
          {100 - value}% {remainder}
        </span>
      </p>
    </div>
  );
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="fig-steps">
      {items.map((item, i) => (
        <li key={item}>
          <span>{String(i + 1).padStart(2, '0')}</span>
          <b>{item}</b>
        </li>
      ))}
    </ol>
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
    case 'bars':
      return (
        <div className="fig">
          <Head title={f.title} cites={f.cites} />
          <Bars rows={f.rows.map((r) => ({ ...r, shown: `${r.value}%` }))} max={100} />
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
    case 'donut':
      return (
        <div className="fig">
          <Head title={f.title} cites={f.cites} />
          <Donut value={f.value} label={f.label} remainder={f.remainder} />
        </div>
      );
    case 'people':
      return (
        <div className="fig">
          <Head title={f.title} cites={f.cites} />
          <People active={f.active} total={f.total} label={f.label} />
        </div>
      );
    case 'steps':
      return (
        <div className="fig">
          <Head title={f.title} cites={f.cites} />
          <Steps items={f.items} />
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

/** The one relevant figure for a stop, if that stop benefits from a visual. */
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
