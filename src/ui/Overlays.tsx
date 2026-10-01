import { useEffect, useRef } from 'react';
import { creditLine, names, SUBMISSION, periodLabel } from '../app/config';
import { useStory } from '../app/store';
import { MEDIA_CREDITS, SOURCES } from '../content/citations';
import { GLOSSARY } from '../content/glossary';
import { Reference } from './Reference';
import { Cites } from './RichText';

function CloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" className="icon-btn overlay__close" aria-label={label} onClick={onClick}>
      <svg viewBox="0 0 16 16" aria-hidden="true">
        <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    </button>
  );
}

function useDialogFocus(open: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.focus();
    return () => prev?.focus?.();
  }, [open]);
  return ref;
}

export function SourcesOverlay() {
  const open = useStory((s) => s.sourcesOpen);
  const focus = useStory((s) => s.sourceFocus);
  const close = useStory((s) => s.closeOverlays);
  const ref = useDialogFocus(open);

  useEffect(() => {
    if (!open || focus == null) return;
    const el = document.getElementById(`ref-${focus}`);
    el?.scrollIntoView({ block: 'center' });
  }, [open, focus]);

  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onClick={close}>
      <div
        ref={ref}
        className="overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sources-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClick={close} label="Close sources" />
        <h2 id="sources-title">Sources</h2>
        <p className="lede">
          APA references for the facts used throughout the infographic. Numbered citations match the markers beside each fact.
        </p>

        <h3>References</h3>
        <ol className="ref-list">
          {SOURCES.map((s) => (
            <li key={s.id} id={`ref-${s.id}`} className={`ref${focus === s.id ? ' is-focus' : ''}`}>
              <span className="ref__n">{s.id}</span>
              <span className="ref__text">
                <Reference s={s} />
              </span>
            </li>
          ))}
        </ol>

        <h3>Visual credits</h3>
        <ul className="credit-list">
          {MEDIA_CREDITS.map((c) => (
            <li key={c.what}>
              <b>{c.what}.</b> {c.creator}. {c.license}.
              {c.url && (
                <>
                  {' '}
                  <a href={c.url} target="_blank" rel="noreferrer" style={{ color: 'inherit' }}>
                    Source
                  </a>
                </>
              )}
              {c.note && <span>{c.note}</span>}
            </li>
          ))}
        </ul>

        <div className="student-card">
          <div>
            <b style={{ color: 'var(--ivory)' }}>{names()}</b>
          </div>
          <div>
            {SUBMISSION.course}, {periodLabel()}, eponym {SUBMISSION.assignedEponym}
          </div>
        </div>
      </div>
    </div>
  );
}

export function GlossaryOverlay() {
  const open = useStory((s) => s.glossaryOpen);
  const close = useStory((s) => s.closeOverlays);
  const ref = useDialogFocus(open);
  if (!open) return null;
  return (
    <div className="overlay" role="presentation" onClick={close}>
      <div
        ref={ref}
        className="overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <CloseButton onClick={close} label="Close medical terms" />
        <h2 id="terms-title">Medical terms</h2>
        <p className="lede">Pronunciation guides are respellings; word parts come from MedlinePlus.</p>
        <ul className="gloss-list">
          {GLOSSARY.map((t) => (
            <li key={t.key} className="gloss">
              <span className="gloss__term">{t.term}</span>
              {t.say && <span className="gloss__say">{t.say}</span>}
              {t.parts && (
                <p style={{ color: 'var(--muted)', fontSize: 13 }}>
                  {t.parts.map((p) => `${p.part} means ${p.meaning}`).join('. ')}.
                </p>
              )}
              <p>
                {t.definition} <Cites ids={t.cites} />
              </p>
            </li>
          ))}
        </ul>
        <p className="student-card">{creditLine()}</p>
      </div>
    </div>
  );
}
