import { describe, it, expect } from 'vitest';
import { deckCenters, mistAt } from '../../src/scene/volume.js';
import { CHAPTERS, CLOUD_LAYER_P, altitudeAt } from '../../src/timeline.js';

describe('cloud decks', () => {
  it('stack top to bottom, one per layer beat', () => {
    const d = deckCenters();
    expect(d).toHaveLength(CLOUD_LAYER_P.length);
    for (let i = 1; i < d.length; i++) expect(d[i]).toBeLessThan(d[i - 1]);
  });

  it('fill the screen with mist exactly when the camera passes a deck', () => {
    for (const p of CLOUD_LAYER_P) expect(mistAt(altitudeAt(p))).toBeCloseTo(1, 5);
  });

  it('leave every chapter beat, the hero and the landing in clear air', () => {
    for (const c of CHAPTERS) expect(mistAt(altitudeAt(c.at))).toBe(0);
    expect(mistAt(altitudeAt(0))).toBe(0);
    expect(mistAt(altitudeAt(1))).toBe(0);
  });
});
