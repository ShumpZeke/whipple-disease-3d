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

  it('stays on the history pages until the hinge, which develops the 3D model', () => {
    for (let t = 0; t < HINGE; t += 0.25) {
      expect(frameState(t).world).toBe('none');
      expect(frameState(t).cut).toBe(false);
    }
    expect(HINGE).toBe(STOP_INDEX.name);
    expect(frameState(HINGE + 0.1).world).toBe('none');
    expect(frameState(HINGE + 0.5).world).toBe('anatomy');
    expect(frameState(HINGE + 0.5).hinge).toBe(true);
    expect(frameState(HINGE + 0.5).cut).toBe(false);
  });

  it('zooms through a veil between different scenes, switching worlds at its peak', () => {
    for (let i = HINGE + 1; i < LAST_STOP; i++) {
      const cut = STOPS[i].scene !== STOPS[i + 1].scene;
      expect(frameState(i + 0.3).cut, `${STOPS[i].id}>${STOPS[i + 1].id}`).toBe(cut);
      if (!cut) continue;
      expect(frameState(i + 0.49).world).toBe(STOPS[i].world);
      expect(frameState(i + 0.51).world).toBe(STOPS[i + 1].world);
      expect(frameState(i + 0.2).veil).toBe(0);
      expect(frameState(i + 0.8).veil).toBe(0);
      expect(frameState(i + 0.5).veil).toBeCloseTo(1, 5);
    }
  });

  it('dives in on the way down to the cells and the DNA, and pulls back out afterwards', () => {
    const dir = (a: string) => frameState(STOP_INDEX[a as keyof typeof STOP_INDEX] + 0.5).dir;
    for (const a of ['kidneys', 'inside', 'nephron', 'cause', 'signs', 'ultrasound']) expect(dir(a), a).toBe('in');
    for (const a of ['genes', 'scans']) expect(dir(a), a).toBe('out');
  });

  it('shows each caption only near its stop', () => {
    expect(stopPresence(5, 5)).toBe(1);
    expect(stopPresence(5.5, 5)).toBe(0);
    expect(stopPresence(5.5, 6)).toBe(0);
    expect(stopPresence(5.2, 5)).toBeGreaterThan(0.5);
  });
});
