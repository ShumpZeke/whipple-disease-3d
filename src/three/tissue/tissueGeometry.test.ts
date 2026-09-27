import { describe, expect, it } from 'vitest';
import { cutFaces, innerRadius, makeFolds, SEG, villiInstances } from './tissueGeometry';

describe('intestinal segment geometry', () => {
  const folds = makeFolds();
  it('keeps the lining inside the submucosa and never collapses the lumen', () => {
    for (let x = -SEG.length / 2; x <= SEG.length / 2; x += 0.05) {
      for (let t = 0; t < Math.PI * 2; t += 0.2) {
        const r = innerRadius(x, t, folds);
        expect(r).toBeLessThanOrEqual(SEG.rMucosaBase + 1e-9);
        expect(r).toBeGreaterThan(0.35);
      }
    }
  });
  it('builds cut faces with a layer id per vertex', () => {
    const g = cutFaces(folds);
    const layer = g.getAttribute('layer');
    expect(layer.count).toBe(g.getAttribute('position').count);
    const ids = new Set(Array.from(layer.array as Float32Array));
    expect([...ids].sort()).toEqual([0, 1, 2, 3, 4]);
  });
  it('places the requested number of villi on the lining', () => {
    expect(villiInstances(folds, 250)).toHaveLength(250);
  });
});
