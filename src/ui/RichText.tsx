import { Fragment, type ReactNode } from 'react';
import { useStory } from '../app/store';
import { TERM_BY_KEY } from '../content/glossary';

const TOKEN = /\{t:([a-z-]+)(?:\|([^}]+))?\}|\{c:([\d,\s]+)\}|\*([^*]+)\*/g;

export function Cites({ ids }: { ids: number[] }) {
  const openSources = useStory((s) => s.openSources);
  return (
    <>
      {ids.map((id) => (
        <button
          key={id}
          type="button"
          className="cite"
          aria-label={`Source ${id}`}
          onClick={(e) => {
            e.stopPropagation();
            openSources(id);
          }}
        >
          [{id}]
        </button>
      ))}
    </>
  );
}

export function TermButton({ termKey, children }: { termKey: string; children: ReactNode }) {
  const openTerm = useStory((s) => s.openTerm);
  return (
    <button
      type="button"
      className="term"
      data-term={termKey}
      aria-haspopup="dialog"
      onClick={(e) => {
        e.stopPropagation();
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
        openTerm({ key: termKey, rect: { left: r.left, top: r.top, width: r.width, height: r.height } });
      }}
    >
      {children}
    </button>
  );
}

/** Parse caption markup: {t:key|label} terms, {c:1,2} citations, *italic*. */
export function RichText({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  let k = 0;
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(<Fragment key={k++}>{text.slice(last, m.index)}</Fragment>);
    if (m[1]) {
      const term = TERM_BY_KEY.get(m[1]);
      const label = m[2] ?? term?.term.split(' (')[0].split(' —')[0].toLowerCase() ?? m[1];
      out.push(
        <TermButton key={k++} termKey={m[1]}>
          {label}
        </TermButton>,
      );
    } else if (m[3]) {
      const ids = m[3]
        .split(',')
        .map((s) => Number(s.trim()))
        .filter((n) => Number.isFinite(n));
      out.push(<Cites key={k++} ids={ids} />);
    } else if (m[4]) {
      out.push(<em key={k++}>{renderInner(m[4])}</em>);
    }
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(<Fragment key={k++}>{text.slice(last)}</Fragment>);
  return <>{out}</>;
}

/** Italic spans may contain a term token: *{t:tropheryma|Tropheryma whipplei}* */
function renderInner(s: string): ReactNode {
  const m = /^\{t:([a-z-]+)(?:\|([^}]+))?\}$/.exec(s);
  if (m) return <TermButton termKey={m[1]}>{m[2] ?? m[1]}</TermButton>;
  return s;
}

/** Strip markup to plain text (for aria labels and tests). */
export function plainText(text: string) {
  return text
    .replace(/\{t:[a-z-]+\|([^}]+)\}/g, '$1')
    .replace(/\{t:([a-z-]+)\}/g, (_, k: string) => TERM_BY_KEY.get(k)?.term.toLowerCase() ?? k)
    .replace(/\{c:[\d,\s]+\}/g, '')
    .replace(/\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
