import { creditLine } from '../app/config';
import { useStory } from '../app/store';
import { MEDIA_CREDITS, SOURCES } from '../content/citations';
import { GLOSSARY } from '../content/glossary';
import { Reference } from './Reference';

/**
 * The end of the page: after the summary, the exhibit scrolls on into its reference list, the
 * medical terms and the media credits — like the credits at the end of a film.
 */
export function EndSources() {
  const restart = useStory((s) => s.restart);
  return (
    <section id="sources" className="endnotes" aria-labelledby="endnotes-title">
      <div className="endnotes__inner">
        <header className="endnotes__head">
          <p className="endnotes__kicker">Wilms tumor</p>
          <h2 id="endnotes-title">References</h2>
          <p className="endnotes__lede">
            Every fact in this exhibit comes from these references. The small numbers beside each fact, like [1], point to
            this list.
          </p>
        </header>

        <ol className="endnotes__refs">
          {SOURCES.map((s) => (
            <li key={s.id} value={s.id}>
              <Reference s={s} />
            </li>
          ))}
        </ol>

        <div className="endnotes__cols">
          <section aria-labelledby="endnotes-terms">
            <h3 id="endnotes-terms">Medical terms</h3>
            <dl className="endnotes__terms">
              {GLOSSARY.map((t) => (
                <div key={t.key}>
                  <dt>
                    {t.term}
                    {t.say && <span className="endnotes__say"> ({t.say})</span>}
                  </dt>
                  <dd>
                    {t.short.charAt(0).toUpperCase() + t.short.slice(1)}.
                    {t.parts?.length ? ` ${t.parts.map((p) => `${p.part} means ${p.meaning}`).join(', ')}.` : null}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
          <section aria-labelledby="endnotes-media">
            <h3 id="endnotes-media">Images, 3D models and media</h3>
            <ul className="endnotes__credits">
              {MEDIA_CREDITS.map((c) => (
                <li key={c.what}>
                  <b>{c.what}.</b> {c.creator}. {c.license}.{c.note ? ` ${c.note}` : ''}
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className="endnotes__foot">
          <p className="endnotes__credit">{creditLine()}</p>
          <p className="endnotes__small">Made for a Medical Terminology eponym project. For learning only, not medical advice.</p>
          <div className="caption__links">
            <button type="button" className="text-link" onClick={restart}>
              Start again
            </button>
            <a className="text-link" href="?guide" target="_blank" rel="noreferrer">
              Presenter guide
            </a>
          </div>
        </footer>
      </div>
    </section>
  );
}
