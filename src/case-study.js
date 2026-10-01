import { CASE_IDS, caseIdFromHash } from './case-ids.js';
import { runPhaseFlowsIn } from './widgets/phase-flow.js';
import { revealCommandBlocks } from './widgets/commands.js';
import { wireCtfTabs } from './widgets/ctf-tabs.js';

const DIVE_MS = 380;  // camera plunges into the cloud before the dossier opens
const CLOSE_MS = 420; // matches the case-out animation in case-study.css
const FADE_MS = 300;  // reduced-motion close: a plain fade, no iris
const DIALOG_W = 1120; // dialog.case max width in case-study.css

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
      const stopCommands = revealCommandBlocks(dialog);
      const stopFlows = runPhaseFlowsIn(dialog);
      stopWidgets = () => { stopCommands(); stopFlows(); };
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
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(dialog); });
  });

  document.querySelectorAll('[data-case]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.case, btn));
  });
  wireCtfTabs(document);

  // Deep links work on first load and on in-page hash changes (links, back/forward).
  const openFromHash = () => { const id = caseIdFromHash(location.hash); if (id) open(id); };
  addEventListener('hashchange', openFromHash);
  openFromHash();
  return { open };
}
