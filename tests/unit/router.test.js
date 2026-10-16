import { describe, it, expect } from 'vitest';
import { parseRoute, hrefFor } from '../../src/router.js';

describe('parseRoute', () => {
  it('maps the hash routes to views', () => {
    expect(parseRoute('')).toEqual({ view: 'home' });
    expect(parseRoute('#/')).toEqual({ view: 'home' });
    expect(parseRoute('#/work')).toEqual({ view: 'work' });
    expect(parseRoute('#/contact')).toEqual({ view: 'contact' });
    expect(parseRoute('#/work/mutagen')).toEqual({ view: 'detail', id: 'mutagen' });
  });
  it('falls back to the work index for an unknown project', () => {
    expect(parseRoute('#/work/nope')).toEqual({ view: 'work' });
  });
  it('keeps old #<case-id> links working: detail with the dossier open', () => {
    expect(parseRoute('#vigil')).toEqual({ view: 'detail', id: 'vigil', dossier: true });
    expect(parseRoute('#proving-grounds')).toEqual({ view: 'detail', id: 'proving-grounds', dossier: true });
  });
  it('treats anything else as home', () => {
    expect(parseRoute('#top')).toEqual({ view: 'home' });
    expect(parseRoute('#/<script>')).toEqual({ view: 'home' });
  });
});

describe('hrefFor', () => {
  it('round-trips through parseRoute', () => {
    for (const r of [{ view: 'home' }, { view: 'work' }, { view: 'contact' }, { view: 'detail', id: 'signalhub' }]) {
      expect(parseRoute(hrefFor(r))).toEqual(r);
    }
  });
});
