import { useEffect } from 'react';
import { creditLine } from '../app/config';
import { TERM_BY_KEY } from '../content/glossary';
import { answerOf, QUESTIONS } from '../content/quiz';
import { FACTS, QA, STOPS } from '../content/story';

/** The stops the talk pauses at (the camera flies through the others on its own). */
const TALK = STOPS.filter((s) => !s.pass);
import { plainText } from './RichText';

/** When to reach each stop in a one-minute talk, before the quiz (same order as TALK). */
const TIMES = ['0:00', '0:06', '0:12', '0:19', '0:26', '0:33', '0:40', '0:47', '0:54', '1:00'];

const PARTS = [
  { time: '0:00 to 0:19', name: 'History', what: 'Your eponym, Max Wilms, and why the tumor has his name' },
  { time: '0:19 to 0:47', name: 'The disease', what: 'What it is, how it starts, the first signs, how doctors find it, the treatment' },
  { time: '0:47 to 1:00', name: 'Summary', what: 'Sum it up in one sentence' },
  { time: 'After 1:00', name: 'Quick check', what: 'Five questions, classmates call out the answers, then the results and the sources' },
];

/**
 * Printable presenter guide (open with ?guide): a five-minute plan with what to say and what to
 * tap at each stop, the likely questions with answers from the sources, and the checklist.
 */
export function Guide() {
  useEffect(() => {
    document.documentElement.classList.add('guide-mode');
    document.title = 'Presenter guide, Wilms Tumor';
    // a light page, so printing does not fill the paper's margins with the exhibit's dark colour
    const scheme = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    const was = scheme?.content;
    if (scheme) scheme.content = 'light';
    return () => {
      document.documentElement.classList.remove('guide-mode');
      if (scheme && was) scheme.content = was;
    };
  }, []);
  return (
    <main className="guide">
      <header className="guide__head">
        <p className="guide__kicker">Presenter guide</p>
        <h1>Wilms Tumor</h1>
        <p className="guide__credit">{creditLine()}</p>
        <button type="button" className="guide__print" onClick={() => window.print()}>
          Print this guide
        </button>
      </header>

      <section className="guide__how">
        <h2>Before you start</h2>
        <ul>
          <li>
            Open the link on the board a minute before you start: the 3D takes a few seconds to load on a slow
            computer, and after that nothing needs to load again. Then tap <b>Full screen</b> in the top-right corner
            (or press <b>F</b>).
          </li>
          <li>
            There are no buttons to go forward. <b>Swipe up</b> on the board to zoom on to the next part and{' '}
            <b>swipe down</b> to go back. A clicker, the arrow keys or a mouse wheel do the same. It always stops on
            the next part by itself.
          </li>
          <li>
            On a slow board computer, add <b>?lite</b> to the end of the link (for example <i>…vercel.app/?lite</i>).
            Everything looks the same; it just paces the drawing for weaker hardware. Slow computers switch to it by
            themselves.
          </li>
          <li>Keep this guide on your phone or printed. Say the lines in your own words. You do not need to read the screen out.</li>
          <li>
            Speak to the class, not the board. The screen only shows a heading and a few lines, so <b>you</b> are
            the explanation.
          </li>
        </ul>
      </section>

      <section className="guide__plan">
        <h2>The one-minute plan</h2>
        <table>
          <tbody>
            {PARTS.map((p) => (
              <tr key={p.name}>
                <td className="guide__time">{p.time}</td>
                <th>{p.name}</th>
                <td>{p.what}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <h2 className="guide__h">Stop by stop</h2>
      <ol className="guide__stops">
        {TALK.map((s, i) => {
          const t = s.term ? TERM_BY_KEY.get(s.term) : undefined;
          return (
            <li key={s.id} className="guide__stop">
              <div className="guide__num">
                <span className="guide__n">{i + 1}</span>
                <small>{TIMES[i]}</small>
              </div>
              <div>
                <p className="guide__eyebrow">{s.eyebrow}</p>
                <h3>{plainText(s.title)}</h3>
                {s.demo && (
                  <p className="guide__do">
                    <b>Tap:</b> {s.demo}
                  </p>
                )}
                <p className="guide__say">
                  <b>Say:</b> {s.say}
                </p>
                {t && (
                  <p className="guide__term">
                    <b>{s.termLabel ?? 'Key term'}:</b> {t.term.replace(/\s*\(.*\)$/, '')}
                    {t.say && <> (say {t.say})</>}:{' '}
                    {t.parts?.length ? <>{t.parts.map((p) => `${p.part} ${p.meaning}`).join(' + ')} = </> : null}
                    {t.short}
                  </p>
                )}
                {s.id === 'quiz' && (
                  <div className="guide__answers">
                    <b>Answers:</b>
                    <ol>
                      {QUESTIONS.map((q) => (
                        <li key={q.id}>
                          {q.prompt} → <b>{answerOf(q)}</b>
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
        <h2>If someone asks…</h2>
        <p>Answer from your sources; say the source number if you want to show it on the list at the end.</p>
        <dl className="guide__qa">
          {QA.map((x) => (
            <div key={x.q}>
              <dt>{x.q}</dt>
              <dd>
                {x.a} <span className="guide__src">[{x.cites.join('], [')}]</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="guide__facts">
        <h2>If you remember only four things</h2>
        <ol>
          {FACTS.map((f) => (
            <li key={f.label}>
              <b>{f.label}:</b> {plainText(f.text)}
            </li>
          ))}
        </ol>
        <p>Named after Max Wilms, a German surgeon who wrote a book about it in 1899. Its medical name is nephroblastoma.</p>
      </section>

      <section className="guide__how">
        <h2>Submission checklist</h2>
        <ul className="guide__check">
          <li>Shareable link that opens without asking for access (test it in a private window)</li>
          <li>Only Wilms tumor is presented, with all the required content</li>
          <li>All interactive features work: the list of parts, swiping, underlined words, source numbers, the + marker, turning the model, the quiz</li>
          <li>Reference page included: it is at the end of the exhibit</li>
          <li>Student name and class period appear on the home screen and at the end ({creditLine()})</li>
          <li>Proofread, and practiced out loud with this guide (about 5 minutes)</li>
        </ul>
      </section>
    </main>
  );
}
