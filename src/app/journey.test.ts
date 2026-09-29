import { describe, expect, it } from 'vitest';
import { LAST_STOP, STOPS, STOP_INDEX } from '../content/story';
import { frameState, HINGE, nearestStop, stopPresence } from './journey';

describe('scroll position → frame', () => {
  it('rests exactly on a stop at whole numbers', () => {
    for (let i = 0; i < LAST_STOP; i++) {
      const fs = frameState(i);
      expect(fs.i).toBe(i);
      expect(fs.f).toBe(0);
      expect(fs.world).toBe(STOPS[i].world);
    }
    expect(frameState(LAST_STOP).world).toBe(STOPS[LAST_STOP].world);
  });

  it('clamps outside the page', () => {
    expect(frameState(-3).i).toBe(0);
    expect(frameState(99).f).toBe(1);
    expect(nearestStop(-1)).toBe(0);
    expect(nearestStop(99)).toBe(LAST_STOP);
  });

  it('stays in the study until the hinge, where the drawing becomes the 3D organs', () => {
    expect(HINGE).toBe(STOP_INDEX.name);
    for (let t = 0; t < HINGE + 0.5; t += 0.25) expect(frameState(t).world).toBe('none');
    expect(frameState(HINGE + 0.5).world).toBe('anatomy');
  });

  it('shows each caption only near its stop', () => {
    expect(stopPresence(5, 5)).toBe(1);
    expect(stopPresence(5.5, 5)).toBe(0);
    expect(stopPresence(5.5, 6)).toBe(0);
    expect(stopPresence(5.2, 5)).toBeGreaterThan(0.5);
  });
});
