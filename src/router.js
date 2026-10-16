import { projectById } from './projects.js';
import { CASE_IDS } from './case-ids.js';

// Hash routes, so deep links work on GitHub Pages (relative base, no server
// rewrites): #/ · #/work · #/work/<id> · #/contact. Legacy #<case-id> links
// from the old site map to that project's detail with its dossier open.
export function parseRoute(hash) {
  const h = (hash || '').replace(/^#\/?/, '');
  if (CASE_IDS.includes(h)) return { view: 'detail', id: h, dossier: true };
  const [a, b] = h.split('/');
  if (a === 'work' && b && projectById(b)) return { view: 'detail', id: b };
  if (a === 'work') return { view: 'work' };
  if (a === 'contact') return { view: 'contact' };
  return { view: 'home' };
}

export const hrefFor = (route) =>
  route.view === 'detail' ? `#/work/${route.id}` : route.view === 'home' ? '#/' : `#/${route.view}`;

export function createRouter(onChange) {
  let current = parseRoute(location.hash);
  const emit = () => {
    const next = parseRoute(location.hash);
    const prev = current;
    current = next;
    onChange(next, prev);
  };
  addEventListener('hashchange', emit);
  return {
    get route() { return current; },
    go(route, { replace = false } = {}) {
      const href = hrefFor(route);
      if (location.hash === href) return;
      if (replace) { history.replaceState(null, '', href); emit(); } else location.hash = href;
    },
    start() { onChange(current, null); },
  };
}
