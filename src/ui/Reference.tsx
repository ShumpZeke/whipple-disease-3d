import type { Source } from '../content/citations';

/** One reference in APA 7 style (the title or journal in italics where APA puts them). */
export function Reference({ s }: { s: Source }) {
  const link = (
    <a href={s.url} target="_blank" rel="noreferrer">
      {s.url}
    </a>
  );
  const head = (
    <>
      {s.authors} ({s.year}).{' '}
    </>
  );
  // a title that ends in a question mark takes no extra full stop
  const stop = /[?!]$/.test(s.title) ? ' ' : '. ';
  switch (s.type) {
    case 'journal':
      return (
        <>
          {head}
          {s.title}. <i>{`${s.container}, ${s.volume}`}</i>({s.issue}), {s.pages}. {link}
        </>
      );
    case 'entry':
      return (
        <>
          {head}
          {s.title}. In <i>{s.container}</i>. {s.publisher}. {link}
        </>
      );
    default:
      return (
        <>
          {head}
          <i>{s.title}</i>
          {stop}
          {s.container ? `${s.container}. ` : null}
          {link}
        </>
      );
  }
}
