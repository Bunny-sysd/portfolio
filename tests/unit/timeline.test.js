import { describe, it, expect } from 'vitest';
import {
  CHAPTERS, CLOUD_LAYER_P, hexToRgb, paletteAt, beatOpacity, heroOpacity,
  contactOpacity, altitudeAt, ALTITUDE_TOP, ALTITUDE_BOTTOM, cityReveal, clamp01, smoothstep
} from '../../src/timeline.js';

const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

describe('palette', () => {
  it('hits the exact stops at the ends', () => {
    expect(paletteAt(0).zenith).toEqual(hexToRgb('#2a1b3d'));
    expect(paletteAt(0).horizon).toEqual(hexToRgb('#f6b27a'));
    expect(paletteAt(1).zenith).toEqual(hexToRgb('#02040a'));
    expect(paletteAt(1).horizon).toEqual(hexToRgb('#0b1a33'));
  });
  it('gets darker as you descend', () => {
    expect(lum(paletteAt(0.8).horizon)).toBeLessThan(lum(paletteAt(0.1).horizon));
  });
  it('clamps out-of-range progress', () => {
    expect(paletteAt(-1)).toEqual(paletteAt(0));
    expect(paletteAt(2)).toEqual(paletteAt(1));
  });
});

describe('beats', () => {
  it('is fully visible on its beat and gone far from it', () => {
    expect(beatOpacity(0.33, 0.33)).toBe(1);
    expect(beatOpacity(0.53, 0.33)).toBe(0);
    expect(beatOpacity(0.30, 0.33)).toBeCloseTo(beatOpacity(0.36, 0.33), 6);
  });
  it('never shows two chapters strongly at once', () => {
    for (let p = 0; p <= 1; p += 0.001) {
      const strong = CHAPTERS.filter((c) => beatOpacity(p, c.at) > 0.5).length;
      expect(strong).toBeLessThanOrEqual(1);
    }
  });
  it('hero leaves before chapter 1 and contact arrives after chapter 5', () => {
    expect(heroOpacity(0)).toBe(1);
    expect(heroOpacity(CHAPTERS[0].at - 0.07)).toBe(0);
    expect(contactOpacity(CHAPTERS.at(-1).at + 0.07)).toBe(0);
    expect(contactOpacity(1)).toBe(1);
  });
});

describe('descent', () => {
  it('starts high, ends low, always going down', () => {
    expect(altitudeAt(0)).toBe(ALTITUDE_TOP);
    expect(altitudeAt(1)).toBe(ALTITUDE_BOTTOM);
    let prev = Infinity;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const y = altitudeAt(Math.min(p, 1));
      expect(y).toBeLessThanOrEqual(prev);
      prev = y;
    }
  });
  it('passes each cloud layer between chapters, never on a chapter beat', () => {
    for (const lp of CLOUD_LAYER_P) {
      for (const c of CHAPTERS) expect(beatOpacity(lp, c.at)).toBeLessThan(0.6);
    }
  });
  it('reveals the city only near the end', () => {
    expect(cityReveal(0.3)).toBe(0);
    expect(cityReveal(1)).toBe(1);
  });
});
