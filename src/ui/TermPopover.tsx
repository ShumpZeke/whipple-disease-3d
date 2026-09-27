import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useStory } from '../app/store';
import { TERM_BY_KEY } from '../content/glossary';
import { Cites } from './RichText';

export function TermPopover() {
  const term = useStory((s) => s.term);
  const closeTerm = useStory((s) => s.closeTerm);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const t = term ? TERM_BY_KEY.get(term.key) : undefined;

  useLayoutEffect(() => {
    if (!term || !ref.current) return;
    const el = ref.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const { rect } = term;
    const margin = 12;
    let left = rect.left + rect.width / 2 - w / 2;
    left = Math.max(16, Math.min(window.innerWidth - w - 16, left));
    let top = rect.top - h - margin;
    if (top < 16) top = rect.top + rect.height + margin;
    top = Math.min(top, window.innerHeight - h - 16);
    setPos({ left, top });
  }, [term]);

  useEffect(() => {
    if (!term) return;
    const onDown = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('.term')) closeTerm();
      }
    };
    window.addEventListener('pointerdown', onDown);
    ref.current?.focus();
    return () => window.removeEventListener('pointerdown', onDown);
  }, [term, closeTerm]);

  if (!term || !t) return null;
  return (
    <div
      ref={ref}
      className="popover"
      role="dialog"
      aria-label={`${t.term}: definition`}
      tabIndex={-1}
      style={pos ? { left: pos.left, top: pos.top } : { left: -9999, top: -9999 }}
    >
      <button type="button" className="popover__close" aria-label="Close definition" onClick={closeTerm}>
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
          <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" />
        </svg>
      </button>
      <p className="popover__term">{t.key === 'tropheryma' ? <i>{t.term}</i> : t.term}</p>
      {t.say && (
        <p className="popover__say">
          Say it: {t.say}
          {t.sayNote && <small>{t.sayNote}</small>}
        </p>
      )}
      {t.parts && (
        <ul className="popover__parts" aria-label="Word parts">
          {t.parts.map((p) => (
            <li key={p.part}>
              <b>{p.part}</b> {p.meaning}
            </li>
          ))}
        </ul>
      )}
      <p className="popover__def">
        {t.definition} <Cites ids={t.cites} />
      </p>
    </div>
  );
}
