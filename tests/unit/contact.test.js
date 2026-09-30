import { describe, it, expect } from 'vitest';
import { buildMailto, CONTACT_EMAIL } from '../../src/contact.js';
import { caseIdFromHash } from '../../src/case-ids.js';

describe('buildMailto', () => {
  it('addresses the real inbox and encodes subject/body', () => {
    const url = buildMailto('Alex', 'Hi there & welcome');
    expect(url.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBe(true);
    expect(CONTACT_EMAIL).toBe('aaron.lawrence.alva@gmail.com');
    expect(decodeURIComponent(url)).toContain('[Portfolio] Message from Alex');
    expect(decodeURIComponent(url)).toContain('Hi there & welcome');
  });
  it('falls back to Anonymous', () => {
    expect(decodeURIComponent(buildMailto('   ', 'x'))).toContain('from Anonymous');
  });
});

describe('caseIdFromHash', () => {
  it('accepts known ids only', () => {
    expect(caseIdFromHash('#mutagen')).toBe('mutagen');
    expect(caseIdFromHash('#proving-grounds')).toBe('proving-grounds');
    expect(caseIdFromHash('#nope')).toBe(null);
    expect(caseIdFromHash('')).toBe(null);
  });
});
