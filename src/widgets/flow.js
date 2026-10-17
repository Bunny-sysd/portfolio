// "How it works": a project's architecture as a flow diagram — numbered
// nodes joined by connectors with a pulse running along them, the active
// stage's explanation underneath. It steps through on its own (one stage
// every few seconds, the pulse travelling ahead of the highlight); clicking
// or focusing a node pins it. Under reduced motion nothing moves on its own:
// the first stage shows and the nodes still switch on click.
const STEP_MS = 2600;

export function renderFlow(root, steps, { reduced }) {
  const list = root.querySelector('.flow__nodes');
  const desc = root.querySelector('.flow__desc');
  const tag = root.querySelector('.flow__tag');
  const doc = root.ownerDocument;
  root.hidden = !steps?.length;
  if (!steps?.length) return () => {};
  root.style.setProperty('--n', steps.length);

  const nodes = steps.map(([label], i) => {
    const li = doc.createElement('li');
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'flow__node';
    b.style.setProperty('--i', i);
    b.setAttribute('aria-pressed', 'false');
    const num = doc.createElement('span');
    num.className = 'flow__num';
    num.textContent = String(i + 1).padStart(2, '0');
    const name = doc.createElement('span');
    name.className = 'flow__label';
    name.textContent = label;
    b.append(num, name);
    li.append(b);
    if (i < steps.length - 1) {
      const wire = doc.createElement('span');
      wire.className = 'flow__wire';
      wire.setAttribute('aria-hidden', 'true');
      wire.append(doc.createElement('i'));
      li.append(wire);
    }
    return { li, b };
  });
  list.replaceChildren(...nodes.map((n) => n.li));

  let active = 0, timer = 0, pinned = false;
  const show = (i) => {
    active = i;
    nodes.forEach(({ li, b }, k) => {
      b.setAttribute('aria-pressed', String(k === i));
      li.classList.toggle('is-done', k < i);
      li.classList.toggle('is-active', k === i);
    });
    tag.textContent = `${String(i + 1).padStart(2, '0')} / ${String(steps.length).padStart(2, '0')} · ${steps[i][0]}`;
    desc.textContent = steps[i][1];
    // Restart the line-in animation on the text.
    desc.classList.remove('is-in'); void desc.offsetWidth; desc.classList.add('is-in');
  };
  nodes.forEach(({ b }, i) => {
    const pin = () => { pinned = true; clearInterval(timer); show(i); };
    b.addEventListener('click', pin);
    b.addEventListener('focus', pin);
  });
  show(0);
  root.classList.remove('is-in'); void root.offsetWidth; root.classList.add('is-in');
  if (!reduced()) timer = setInterval(() => { if (!pinned) show((active + 1) % steps.length); }, STEP_MS);
  return () => clearInterval(timer);
}
