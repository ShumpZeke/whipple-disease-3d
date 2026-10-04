import { FIGURES } from '../content/figures';
import type { StopId } from '../content/story';

/*
 * A stop's key facts, drawn the same way everywhere: three big figures in a row, each over a short
 * label (the summary draws its one number as 100 dots). Their source numbers sit with the
 * sentences beside them, so the figures themselves stay clean.
 */
export function StopFacts({ id }: { id: StopId }) {
  const f = FIGURES[id];
  if (!f) return null;
  if (f.kind === 'dots')
    return (
      <div className="facts facts--dots" role="img" aria-label={`${f.value} ${f.label}`}>
        <span className="facts__dots" aria-hidden="true">
          {Array.from({ length: 100 }, (_, i) => (
            <i key={i} className={i < f.value ? 'is-on' : ''} />
          ))}
        </span>
        <span className="fact">
          <b className="fact__value">{f.value}</b>
          <span className="fact__label">{f.label}</span>
        </span>
      </div>
    );
  return (
    <ul className="facts">
      {f.items.map((x) => (
        <li key={x.value} className="fact">
          <b className="fact__value">{x.value}</b>
          <span className="fact__label">{x.label}</span>
        </li>
      ))}
    </ul>
  );
}
