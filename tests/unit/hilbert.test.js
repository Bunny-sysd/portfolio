import { describe, it, expect } from 'vitest';
import { d2xy, xy2d, toIPv4, toPrivateIPv4 } from '../../src/hilbert.js';

describe('hilbert', () => {
  it('round-trips every cell of a small curve', () => {
    for (let d = 0; d < 256; d++) {
      const [x, y] = d2xy(16, d);
      expect(xy2d(16, x, y)).toBe(d);
    }
  });
  it('is continuous: consecutive indices are adjacent cells', () => {
    for (let d = 1; d < 4096; d++) {
      const [a, b] = d2xy(64, d - 1), [c, e] = d2xy(64, d);
      expect(Math.abs(a - c) + Math.abs(b - e)).toBe(1);
    }
  });
  it('keeps the cursor readout inside private 10.0.0.0/8', () => {
    for (let i = 0; i < 500; i++) expect(toPrivateIPv4(Math.random(), Math.random())).toMatch(/^10\.\d+\.\d+\.\d+$/);
    expect(toPrivateIPv4(0, 0)).toBe('10.0.0.0');
    expect(toPrivateIPv4(0.99999, 0)).toBe('10.255.255.255');
  });
  it('maps the plane onto the IPv4 space', () => {
    expect(toIPv4(0, 0)).toBe('0.0.0.0');
    expect(toIPv4(0.999999, 0)).toBe('255.255.255.255');
    expect(toIPv4(0.5, 0.5)).toMatch(/^\d+\.\d+\.\d+\.\d+$/);
  });
});
