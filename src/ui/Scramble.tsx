import { useEffect, useState } from 'react';
import { useStory } from '../app/store';
import { plainText, RichText } from './RichText';

const GLYPHS = '-=+/\\|_<>*#%&0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/**
 * Text that “decodes” into place: each letter flickers through random glyphs and settles, left
 * to right. Screen readers get the real text straight away; with reduced motion there is no flicker.
 */
export function Scramble({ text, duration = 650 }: { text: string; duration?: number }) {
  const reduced = useStory((s) => s.reducedMotion);
  const plain = plainText(text);
  const [shown, setShown] = useState<string | null>(reduced ? null : scramble(plain, 0));

  useEffect(() => {
    if (reduced) {
      setShown(null);
      return;
    }
    let raf = 0;
    let last = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const k = (now - start) / duration;
      if (k >= 1) {
        setShown(null);
        return;
      }
      // about 30 updates a second is plenty for the flicker
      if (now - last > 33) {
        last = now;
        setShown(scramble(plain, k));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [plain, duration, reduced]);

  if (shown === null) return <RichText text={text} />;
  return (
    <>
      <span className="sr-only">{plain}</span>
      <span aria-hidden="true">{shown}</span>
    </>
  );
}

/** Letters before `k` (0…1) are settled; the rest are random glyphs (spaces stay spaces). */
function scramble(s: string, k: number) {
  const settled = Math.floor(s.length * k * 1.15);
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    out += i < settled || c === ' ' ? c : GLYPHS[(Math.random() * GLYPHS.length) | 0];
  }
  return out;
}
