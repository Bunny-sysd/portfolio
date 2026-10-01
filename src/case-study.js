import { CASE_IDS, caseIdFromHash } from './case-ids.js';
import { runPhaseFlowsIn } from './widgets/phase-flow.js';
import { revealCommandBlocks } from './widgets/commands.js';
import { wireCtfTabs } from './widgets/ctf-tabs.js';

export function initCaseStudies({ scroll }) {
  const dialogs = new Map(CASE_IDS.map((id) => [id, document.getElementById(`case-${id}`)]));
  let stopWidgets = () => {};

  function open(id) {
    const dialog = dialogs.get(id);
    if (!dialog || dialog.open) return;
    scroll.stop();
    dialog.showModal();
    dialog.scrollTop = 0;
    const stopCommands = revealCommandBlocks(dialog);
    const stopFlows = runPhaseFlowsIn(dialog);
    stopWidgets = () => { stopCommands(); stopFlows(); };
    history.replaceState(null, '', `#${id}`);
  }

  dialogs.forEach((dialog) => {
    dialog.addEventListener('close', () => {
      stopWidgets();
      stopWidgets = () => {};
      scroll.start();
      history.replaceState(null, '', location.pathname + location.search);
    });
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  });

  document.querySelectorAll('[data-case]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.case));
  });
  wireCtfTabs(document);

  // Deep links work on first load and on in-page hash changes (links, back/forward).
  const openFromHash = () => { const id = caseIdFromHash(location.hash); if (id) open(id); };
  addEventListener('hashchange', openFromHash);
  openFromHash();
  return { open };
}
