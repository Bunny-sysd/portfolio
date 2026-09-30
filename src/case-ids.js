export const CASE_IDS = ['who', 'mutagen', 'vigil', 'signalhub', 'proving-grounds'];

export function caseIdFromHash(hash) {
  const id = (hash || '').replace(/^#/, '');
  return CASE_IDS.includes(id) ? id : null;
}
