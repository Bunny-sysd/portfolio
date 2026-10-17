import { PROJECTS, projectById } from './projects.js';
import { decodeText } from './widgets/decode.js';
import { renderFlow } from './widgets/flow.js';

const STEP_PX = 110;     // wheel travel per carousel step
const STEP_GAP_MS = 320; // min time between steps, so one flick moves one card
const CLOSE_PX = 260;    // wheel travel that closes a project ("scroll to close")
const LEAVE_PX = 220;    // wheel travel that crosses home ⇄ work

// The DOM side of the views: which section is live, the carousel caption, the
// detail panel, filters, and every input that moves between them (wheel, keys,
// swipe, canvas clicks). The scene reads `state` each frame; nothing here
// touches WebGL. All copy comes from projects.js.
export function createViews(doc, { router, reduced, pick, openDossier, onCaption, onStep }) {
  const root = doc.documentElement;
  const $ = (s) => doc.querySelector(s);
  const views = { home: $('#view-home'), work: $('#view-work'), detail: $('#view-detail'), contact: $('#view-contact') };
  const state = { view: 'home', base: 'home', spin: 0, index: 0, filter: null, visible: new Set(PROJECTS.map((p) => p.id)), openId: null, pulse: 0 };

  const order = () => PROJECTS.filter((p) => state.visible.has(p.id));
  const current = () => order()[state.index] || order()[0];

  // Screen-reader index of every project (the canvas cards are decorative).
  const index = $('.work-index');
  PROJECTS.forEach((p) => {
    const li = doc.createElement('li');
    const a = doc.createElement('a');
    a.href = `#/work/${p.id}`; a.textContent = `${p.title} — ${p.kind}`;
    li.append(a); index.append(li);
  });

  function renderCaption() {
    const list = order(), p = current();
    if (!p) return;
    $('.caption__index').textContent = `${String(state.index + 1).padStart(2, '0')} / ${String(list.length).padStart(2, '0')}`;
    $('.caption__title').textContent = p.title;
    $('.caption__kind').textContent = p.kind;
    $('.caption__open').href = `#/work/${p.id}`;
    decodeText([$('.caption__title'), $('.caption__kind')], { reduced: reduced(), duration: 520 });
    onCaption?.(p);
  }

  // Phone layout: the detail view's three panels as tabs (card / how it
  // works / details). CSS only applies them under 768px; desktop shows all.
  const setTab = (tab) => {
    root.dataset.dtab = tab;
    doc.querySelectorAll('.dtabs [data-tab]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.tab === tab)));
  };
  doc.querySelectorAll('.dtabs [data-tab]').forEach((b) => b.addEventListener('click', () => setTab(b.dataset.tab)));
  setTab('card');

  let stopFlow = () => {};
  function renderDetail(p) {
    stopFlow();
    setTab('card');
    stopFlow = renderFlow($('.flow'), p.flow, { reduced, id: p.id });
    $('.detail__title').textContent = p.title;
    $('.detail__meta').textContent = `${p.kind} / ${p.meta}`;
    $('.detail__blurb').textContent = p.blurb;
    const stats = $('.detail__stats');
    stats.replaceChildren(...p.stats.map((s) => Object.assign(doc.createElement('li'), { textContent: s })));
    const links = $('.detail__links');
    // Only projects with a full dossier <dialog> get the "Open full dossier"
    // button (Jarvis and the homelab are private builds with no dialog).
    const hasDossier = !!doc.getElementById(`case-${p.id}`);
    const lead = [];
    if (hasDossier) {
      const dossier = doc.createElement('button');
      dossier.type = 'button'; dossier.className = 'detail__dossier'; dossier.textContent = 'Open full dossier';
      dossier.addEventListener('click', () => openDossier(p.id, dossier));
      const first = doc.createElement('li');
      first.append(dossier);
      lead.push(first);
    }
    links.replaceChildren(
      ...lead,
      ...p.links.map((l) => {
        const li = doc.createElement('li');
        const a = Object.assign(doc.createElement('a'), { href: l.href, textContent: `${l.label} ↗`, target: '_blank', rel: 'noopener noreferrer' });
        li.append(a); return li;
      }),
    );
    decodeText([$('.detail__title'), $('.detail__meta')], { reduced: reduced(), delay: 250, duration: 700 });
  }

  function setView(view) {
    Object.entries(views).forEach(([k, el]) => {
      const live = k === view;
      el.classList.toggle('is-active', live);
      el.toggleAttribute('inert', !live);
      el.setAttribute('aria-hidden', String(!live));
    });
    root.dataset.view = view;
    const contactLink = $('[data-nav="contact"]');
    contactLink.textContent = view === 'contact' ? 'Close ✕' : 'Contact';
    contactLink.href = view === 'contact' ? (state.base === 'detail' && state.openId ? `#/work/${state.openId}` : state.base === 'home' ? '#/' : '#/work') : '#/contact';
  }

  function apply(route, prev) {
    const was = state.view;
    if (route.view === 'contact') {
      state.base = was === 'contact' ? state.base : (was || 'home');
    } else {
      state.base = route.view;
    }
    if (route.view === 'detail') {
      const p = projectById(route.id);
      // A filtered-out project still opens: clear the filter so it's in the ring.
      if (!state.visible.has(p.id)) setFilter(null);
      state.index = order().indexOf(p);
      state.spin = nearestSpin(state.index);
      state.openId = p.id;
      renderDetail(p);
      if (route.dossier) openDossier(p.id, null);
    } else if (route.view !== 'contact') {
      state.openId = null;
    }
    state.view = route.view;
    if (route.view === 'work' && was !== 'work') renderCaption();
    if (was !== route.view) state.pulse = 1;
    setView(route.view);
    // Move focus into the new view for keyboard and screen-reader users, but
    // not on first load (the page should open at the top, unfocused).
    if (prev) views[route.view]?.focus({ preventScroll: true });
  }

  // Spin values are continuous: pick the representation of `i` nearest the
  // current spin so the ring always turns the short way.
  function nearestSpin(i) {
    const n = Math.max(1, order().length);
    const base = Math.round((state.spin - i) / n) * n;
    return base + i;
  }

  function step(dir) {
    const n = order().length;
    if (!n) return;
    state.index = (state.index + dir + n) % n;
    state.spin += dir;
    renderCaption();
    onStep?.();
  }

  function setFilter(tag) {
    state.filter = state.filter === tag ? null : tag;
    state.visible = new Set(PROJECTS.filter((p) => !state.filter || p.tags.includes(state.filter)).map((p) => p.id));
    doc.querySelectorAll('[data-filter]').forEach((b) => {
      const on = b.dataset.filter === state.filter;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    state.index = 0;
    state.spin = Math.round(state.spin);
    state.spin = nearestSpin(0);
    state.pulse = 1;
    renderCaption();
  }

  // ── input ──────────────────────────────────────────────────────────────
  const wheel = { acc: 0, last: 0, stepAt: 0 };
  addEventListener('wheel', (e) => {
    if (doc.querySelector('dialog[open]') || e.target.closest?.('.term, .view--contact')) return;
    const now = performance.now();
    const dy = e.deltaY * (e.deltaMode === 1 ? 16 : 1);
    if (now - wheel.last > 250) wheel.acc = 0;
    wheel.last = now;
    wheel.acc += dy;
    const v = state.view;
    if (v === 'home' && wheel.acc > LEAVE_PX) { wheel.acc = 0; router.go({ view: 'work' }); }
    else if (v === 'work') {
      if (Math.abs(wheel.acc) >= STEP_PX && now - wheel.stepAt > STEP_GAP_MS) {
        const dir = Math.sign(wheel.acc);
        wheel.acc = 0; wheel.stepAt = now;
        if (dir < 0 && state.index === 0) router.go({ view: 'home' }); else step(dir);
      }
    } else if (v === 'detail' && Math.abs(wheel.acc) > CLOSE_PX) { wheel.acc = 0; router.go({ view: 'work' }); }
  }, { passive: true });

  addEventListener('keydown', (e) => {
    if (doc.querySelector('dialog[open]') || e.target.closest?.('input, textarea')) return;
    const v = state.view;
    if (e.key === 'Escape') {
      if (v === 'detail') router.go({ view: 'work' });
      else if (v === 'contact') $('[data-nav="contact"]').click();
    } else if (v === 'work' && (e.key === 'ArrowRight' || e.key === 'ArrowDown')) { step(1); e.preventDefault(); }
    else if (v === 'work' && (e.key === 'ArrowLeft' || e.key === 'ArrowUp')) { step(-1); e.preventDefault(); }
    else if (v === 'work' && e.key === 'Enter' && e.target === views.work) router.go({ view: 'detail', id: current().id });
    else if (v === 'home' && (e.key === 'ArrowDown' || e.key === 'PageDown')) { router.go({ view: 'work' }); e.preventDefault(); }
  });

  const touch = { x: 0, y: 0, on: false };
  addEventListener('touchstart', (e) => { const t = e.touches[0]; touch.x = t.clientX; touch.y = t.clientY; touch.on = !e.target.closest('input, textarea, .term, .view--contact, dialog, .detail, .flow, .dtabs'); }, { passive: true });
  addEventListener('touchend', (e) => {
    if (!touch.on) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    const v = state.view;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 50) return;
    if (v === 'home' && dy < -50) router.go({ view: 'work' });
    else if (v === 'work' && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
    else if (v === 'work' && dy > 60 && state.index === 0) router.go({ view: 'home' });
    else if (v === 'detail' && Math.abs(dy) > 60) router.go({ view: 'work' });
  }, { passive: true });

  // Clicking a card: the front one opens, a side one spins to the front.
  doc.getElementById('scene').parentElement.addEventListener('click', (e) => {
    if (e.target.closest('a, button, input, textarea, form, dialog, .caption, .filters, .detail, .flow, .dtabs')) return;
    // In a project, the live card is the way into its full dossier.
    if (state.view === 'detail') {
      if (pick?.(e.clientX, e.clientY) === state.openId) {
        const at = { getBoundingClientRect: () => ({ left: e.clientX, top: e.clientY, width: 0, height: 0 }) };
        openDossier(state.openId, at);
      }
      return;
    }
    if (state.view !== 'work') return;
    const id = pick?.(e.clientX, e.clientY);
    if (!id) return;
    if (id === current().id) router.go({ view: 'detail', id });
    else { const i = order().findIndex((p) => p.id === id); const n = order().length; let d = i - state.index; if (d > n / 2) d -= n; if (d < -n / 2) d += n; step(d); }
  });
  doc.addEventListener('pointermove', (e) => {
    if (state.view === 'detail') { root.classList.toggle('is-pointing', pick?.(e.clientX, e.clientY) === state.openId); return; }
    if (state.view !== 'work') { root.classList.remove('is-pointing'); return; }
    root.classList.toggle('is-pointing', !!pick?.(e.clientX, e.clientY));
  }, { passive: true });

  doc.querySelectorAll('[data-step]').forEach((b) => b.addEventListener('click', () => step(Number(b.dataset.step))));
  doc.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => setFilter(b.dataset.filter)));

  return { state, apply };
}
