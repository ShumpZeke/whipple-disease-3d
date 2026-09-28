import { useEffect } from 'react';
import { creditLine } from '../app/config';
import { TERM_BY_KEY } from '../content/glossary';
import { QUESTIONS } from '../content/quiz';
import { FACTS, STOPS } from '../content/story';
import { plainText } from './RichText';

/**
 * Printable presenter guide (open with ?guide): what is on screen at each stop, what to say, and
 * the key term — plus the quiz answers. Made to be printed or kept on a phone while presenting.
 */
export function Guide() {
  useEffect(() => {
    document.documentElement.classList.add('guide-mode');
    document.title = 'Presenter guide — Whipple’s Disease';
    return () => document.documentElement.classList.remove('guide-mode');
  }, []);
  return (
    <main className="guide">
      <header className="guide__head">
        <p className="guide__kicker">Presenter guide</p>
        <h1>Whipple’s Disease</h1>
        <p className="guide__credit">{creditLine()}</p>
        <button type="button" className="guide__print" onClick={() => window.print()}>
          Print this guide
        </button>
      </header>

      <section className="guide__how">
        <h2>How to present it</h2>
        <ul>
          <li>
            Open the exhibit and press <b>F</b> (or the full-screen button, top right) so it fills the board.
          </li>
          <li>
            Move with the big <b>‹ ›</b> buttons (bottom right), a clicker, the arrow keys, or by swiping up and down.
          </li>
          <li>Drag the 3D picture to turn it. Tap any underlined word to show its definition.</li>
          <li>
            There are {STOPS.length} stops. Spend about 20–30 seconds on each: read the headline, then say the lines
            below in your own words.
          </li>
        </ul>
      </section>

      <ol className="guide__stops">
        {STOPS.map((s, i) => {
          const t = s.term ? TERM_BY_KEY.get(s.term) : undefined;
          return (
            <li key={s.id} className="guide__stop">
              <div className="guide__num">{i + 1}</div>
              <div>
                <p className="guide__eyebrow">{s.eyebrow}</p>
                <h3>{plainText(s.title)}</h3>
                <p className="guide__say">
                  <b>Say:</b> {s.say}
                </p>
                {t && (
                  <p className="guide__term">
                    <b>{s.termLabel ?? 'Key term'}:</b> {t.term.replace(/\s*\(.*\)$/, '')}
                    {t.say && <> (say “{t.say}”)</>} —{' '}
                    {t.parts?.length ? <>{t.parts.map((p) => `${p.part} ${p.meaning}`).join(' + ')} = </> : null}
                    {t.short}
                  </p>
                )}
                {s.hint && (
                  <p className="guide__do">
                    <b>Do:</b> {s.hint}
                  </p>
                )}
                {s.id === 'quiz' && (
                  <div className="guide__answers">
                    <b>Answers:</b>
                    <ol>
                      {QUESTIONS.map((q) => (
                        <li key={q.id}>
                          {q.prompt} → <b>{q.kind === 'organ' ? 'the small intestine' : q.options.find((o) => o.correct)?.text}</b>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      <section className="guide__facts">
        <h2>If you remember only four things</h2>
        <ol>
          {FACTS.map((f) => (
            <li key={f.label}>
              <b>{f.label}:</b> {plainText(f.text)}
            </li>
          ))}
        </ol>
        <p>Named after George Hoyt Whipple, who first described it in 1907 — not Allen O. Whipple (a surgeon).</p>
      </section>
    </main>
  );
}
