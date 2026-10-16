import { CASE_IDS, caseIdFromHash } from './case-ids.js';
import { runPhaseFlowsIn } from './widgets/phase-flow.js';
import { revealCommandBlocks } from './widgets/commands.js';
import { decodeText } from './widgets/decode.js';

const DIVE_MS = 380;  // camera plunges into the cloud before the dossier opens
const CLOSE_MS = 420; // matches the case-out animation in case-study.css
const FADE_MS = 300;  // reduced-motion close: a plain fade, no iris
const DIALOG_W = 1120; // dialog.case max width in case-study.css
const PULL_PX = 260;   // upward wheel travel past the top that closes the dossier
const REST_MS = 250;   // must rest at the top this long before a pull counts

// Opening a case study is a shot, not a popup: the descent text falls away,
// the camera dives into the cloud (onDive drives the scene), and the dossier
// irises open from the button that was pressed. Closing plays it backwards.
// Under reduced motion it's a plain quick fade with no dive or delay.
export function initCaseStudies({ scroll, onDive = () => {} }) {
  const root = document.documentElement;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dialogs = new Map(CASE_IDS.map((id) => [id, document.getElementById(`case-${id}`)]));
  let stopWidgets = () => {};
  let pending = 0;

  function open(id, origin) {
    const dialog = dialogs.get(id);
    if (!dialog || dialog.open || pending) return;
    // Iris origin = the pressed button, in the dialog's own box (clip-path
    // coordinates; the dialog is centred, at most DIALOG_W wide); radius =
    // distance to the box's farthest corner, so the reveal spends its whole
    // duration on screen.
    const r = origin?.getBoundingClientRect();
    const w = Math.min(DIALOG_W, innerWidth), h = innerHeight;
    const left = (innerWidth - w) / 2;
    const ox = Math.min(w, Math.max(0, (r ? r.left + r.width / 2 : innerWidth / 2) - left));
    const oy = r ? r.top + r.height / 2 : h / 2;
    dialog.style.setProperty('--ox', `${ox}px`);
    dialog.style.setProperty('--oy', `${oy}px`);
    dialog.style.setProperty('--or', `${Math.ceil(Math.hypot(Math.max(ox, w - ox), Math.max(oy, h - oy)))}px`);
    scroll.stop();
    onDive(true);
    root.classList.add('case-diving');
    const show = () => {
      pending = 0;
      dialog.classList.remove('is-closing');
      dialog.showModal();
      dialog.scrollTop = 0;
      dialog.style.setProperty('--pull', '0');
      const stopCommands = revealCommandBlocks(dialog);
      const stopFlows = runPhaseFlowsIn(dialog);
      const stopDecode = decodeText(dialog.querySelectorAll('.case__head .eyebrow, .case__head h2'), { reduced: reduced(), delay: 450, duration: 1000 });
      stopWidgets = () => { stopCommands(); stopFlows(); stopDecode(); };
      history.replaceState(null, '', `#${id}`);
    };
    // A deep link on load has nothing to dive from: open straight away.
    if (reduced() || !origin) show(); else pending = setTimeout(show, DIVE_MS);
  }

  function close(dialog) {
    if (!dialog.open || dialog.classList.contains('is-closing')) return;
    dialog.classList.add('is-closing');
    onDive(false);
    root.classList.remove('case-diving');
    setTimeout(() => dialog.close(), reduced() ? FADE_MS : CLOSE_MS);
  }

  dialogs.forEach((dialog) => {
    // Escape: animate out instead of the browser's instant close. If the
    // browser refuses to let it be cancelled, the 'close' handler still tidies up.
    dialog.addEventListener('cancel', (e) => { e.preventDefault(); close(dialog); });
    dialog.addEventListener('close', () => {
      dialog.classList.remove('is-closing');
      onDive(false);
      root.classList.remove('case-diving');
      stopWidgets();
      stopWidgets = () => {};
      scroll.start();
      history.replaceState(null, '', location.pathname + location.search);
    });
    dialog.querySelector('[data-close]').addEventListener('click', () => close(dialog));
    // Scroll to close: keep pulling up past the top and the dossier closes,
    // with a hint bar that fills as you pull. Only counts once the dossier has
    // rested at the top, so momentum from scrolling up to the top never
    // closes it by accident; scrolling down or pausing lets the pull go.
    const hint = document.createElement('p');
    hint.className = 'case__pull';
    hint.setAttribute('aria-hidden', 'true');
    hint.innerHTML = '<span>Scroll up to close</span><i></i>';
    dialog.prepend(hint);
    const pull = { px: 0, topSince: 0, last: 0 };
    const setPull = (px) => { pull.px = px; dialog.style.setProperty('--pull', Math.min(1, px / PULL_PX).toFixed(3)); };
    dialog.addEventListener('scroll', () => { pull.topSince = dialog.scrollTop <= 0 ? performance.now() : 0; if (pull.px) setPull(0); }, { passive: true });
    dialog.addEventListener('wheel', (e) => {
      const now = performance.now();
      if (dialog.scrollTop > 0 || dialog.classList.contains('is-closing')) return;
      if (!pull.topSince) pull.topSince = now;
      if (e.deltaY >= 0 || now - pull.topSince < REST_MS) { if (pull.px) setPull(0); return; }
      if (now - pull.last > 400) setPull(0);
      pull.last = now;
      setPull(pull.px - e.deltaY * (e.deltaMode === 1 ? 16 : 1));
      if (pull.px >= PULL_PX) { setPull(0); close(dialog); }
    }, { passive: true });
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(dialog); });
  });

  document.querySelectorAll('[data-case]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.case, btn));
  });

  // Deep links work on first load and on in-page hash changes (links, back/forward).
  const openFromHash = () => { const id = caseIdFromHash(location.hash); if (id) open(id); };
  addEventListener('hashchange', openFromHash);
  openFromHash();
  return { open };
}
