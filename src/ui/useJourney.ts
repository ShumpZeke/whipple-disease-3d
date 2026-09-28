import { useEffect, useRef } from 'react';
import { journey, onJourneyFrame } from '../app/journey';

/**
 * Run `apply(t)` on every scroll frame (and once on mount) without re-rendering React.
 * Use it to write styles through refs.
 */
export function useJourney(apply: (t: number) => void, deps: unknown[] = []) {
  const fn = useRef(apply);
  fn.current = apply;
  useEffect(() => {
    fn.current(journey.t);
    const off = onJourneyFrame((t) => fn.current(t));
    // one more pass after layout (refs attached, fonts settled)
    const id = requestAnimationFrame(() => fn.current(journey.t));
    return () => {
      off();
      cancelAnimationFrame(id);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
