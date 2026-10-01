function runPhaseFlow(wrap) {
  const nodeEls = Array.from(wrap.querySelectorAll('.phase-node'));
  const connectorEls = Array.from(wrap.querySelectorAll('.phase-connector'));
  const pulseEls = connectorEls.map((c) => c.querySelector('.phase-pulse'));
  const readout = wrap.querySelector('[data-phase-readout]');
  const labels = nodeEls.map((n) => n.querySelector('.phase-node-label')?.textContent.trim() || '');
  const count = nodeEls.length;
  if (!readout || count < 1) return () => {};

  const setActive = (i) => {
    nodeEls.forEach((n, idx) => n.classList.toggle('is-active', idx === i));
    readout.textContent = `PHASE ${i + 1}/${count} · ${labels[i].toUpperCase()}`;
  };
  setActive(0);
  if (count < 2) return () => {};

  // Reduced motion still cycles through every phase (it's content); only the
  // sliding dot is skipped.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DWELL_MS = 2100;
  const TRAVEL_MS = 900;
  const timeouts = [];
  let current = 0;

  const travelPulse = (i) => {
    if (reduceMotion) return;
    const pulse = pulseEls[i];
    if (!pulse) return;
    pulse.style.transitionDuration = '0s';
    pulse.style.left = '0%';
    pulse.classList.add('is-traveling');
    void pulse.offsetWidth;
    pulse.style.transitionDuration = '';
    requestAnimationFrame(() => { pulse.style.left = '100%'; });
  };

  const step = () => {
    timeouts.push(setTimeout(() => {
      if (current < count - 1) travelPulse(current);
      timeouts.push(setTimeout(() => {
        current = (current + 1) % count;
        setActive(current);
        pulseEls.forEach((p) => { if (p) { p.classList.remove('is-traveling'); p.style.left = '0%'; } });
        step();
      }, TRAVEL_MS));
    }, DWELL_MS));
  };
  step();
  return () => timeouts.forEach(clearTimeout);
}

export function runPhaseFlowsIn(root) {
  const stops = Array.from(root.querySelectorAll('.phase-flow-wrap')).map(runPhaseFlow);
  return () => stops.forEach((stop) => stop());
}
