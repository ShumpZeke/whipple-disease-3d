import { Cites, TermButton } from './RichText';

/*
 * The two cards of the history part: Max Wilms's life (at "Dr. Max Wilms") and the word parts of
 * nephroblastoma (at "Why it has his name"). In the 3D exhibit they hang in the study next to him;
 * without 3D they are shown over the still picture.
 */

const LIFE: { year: string; text: string; cites: number[] }[] = [
  { year: '1867', text: 'Born in Germany', cites: [10] },
  { year: '1899', text: 'Wrote a book about this kidney tumor, at age 32', cites: [9] },
  { year: '1904', text: 'Became a professor', cites: [11] },
  { year: '1918', text: 'Died during World War I, from an infection he caught while operating', cites: [9] },
];

const PARTS = [
  { part: 'nephro', meaning: 'kidney' },
  { part: 'blast', meaning: 'bud, a young cell' },
  { part: 'oma', meaning: 'tumor' },
];

export function ProfileCard({ className = '' }: { className?: string }) {
  return (
    <article className={`print profile ${className}`} aria-label="Profile of Max Wilms">
      <figure className="profile__photo">
        <img
          src="/archive/wilms-portrait.webp"
          width={560}
          height={821}
          alt="Black-and-white portrait photograph of Max Wilms in a dark suit and bow tie, seated with an open book."
        />
        <figcaption>Wellcome Collection, CC BY 4.0</figcaption>
      </figure>
      <div className="profile__body">
        <p className="profile__kicker">The tumor is named after</p>
        <h2 className="profile__name">Max Wilms</h2>
        <p className="profile__life">1867 to 1918, German surgeon</p>
        <ol className="profile__timeline">
          {LIFE.map((l) => (
            <li key={l.year}>
              <b>{l.year}</b>
              <span>
                {l.text} <Cites ids={l.cites} />
              </span>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}

export function WordPartsCard({ className = '' }: { className?: string }) {
  return (
    <article className={`print wordparts ${className}`} aria-label="The word parts of nephroblastoma">
      <p className="wordparts__kicker">Its medical name</p>
      <h2 className="wordparts__word">
        {PARTS.map((p) => (
          <span key={p.part}>{p.part}</span>
        ))}
      </h2>
      <ol className="wordparts__parts">
        {PARTS.map((p) => (
          <li key={p.part}>
            <b>{p.part}</b>
            <span>{p.meaning}</span>
          </li>
        ))}
      </ol>
      <p className="wordparts__say">
        Say it <TermButton termKey="nephroblastoma">NEF-roh-blas-TOH-muh</TermButton> <Cites ids={[15, 1]} />
      </p>
    </article>
  );
}
