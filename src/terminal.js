import { PROJECTS, projectById } from './projects.js';
import { sha256Hex } from './widgets/sigil.js';

// The "ask me anything" box, as a terminal: a handful of commands answered
// from the site's own verified data — nothing is sent anywhere. Input is only
// ever written back as text (textContent), never parsed as HTML; links come
// solely from the project data, not from what was typed.
const CERTS = [
  ['GIAC GFACT', 'Certified · Scored 94 · issued 1 September 2026', 'https://www.credly.com/badges/e6b7f224-b57d-4224-9f7a-cabe2b3fb257'],
  ['TryHackMe', 'Top 1% · 100+ rooms completed', 'https://tryhackme.com/p/354221973'],
  ['Hack The Box', 'maxthemadman · Apprentice tier · Level 25', 'https://app.hackthebox.com/users/3735054'],
];

export function createTerminal(form, { go }) {
  const out = form.querySelector('.term__out');
  const input = form.querySelector('.term__in');
  const history = [];
  let cursor = 0;
  // Hidden in the markup, so without this script it can't fall back to a
  // native form submit; shown once the handlers below are attached.
  form.hidden = false;

  const line = (text, cls) => {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = text;
    out.append(p);
    return p;
  };
  const link = (label, href) => {
    const p = document.createElement('p');
    const a = document.createElement('a');
    a.href = href; a.textContent = label;
    if (/^https?:/.test(href)) { a.target = '_blank'; a.rel = 'noopener noreferrer'; }
    p.append(a);
    out.append(p);
  };
  const ids = PROJECTS.map((p) => p.id).join('  ');

  const COMMANDS = {
    help: () => {
      line('commands:');
      line('  whoami            who is this');
      line('  ls | projects     list projects');
      line('  cat <project>     project summary');
      line('  open <project>    fly to a project');
      line('  hash <project>    sha256 of its title (its sigil)');
      line('  certs             verified credentials');
      line('  contact           get in touch');
      line('  clear             clear the screen');
    },
    whoami: () => line('Aaron Alva — Grade 11 cybersecurity researcher & systems developer, Canada.'),
    ls: () => line(ids),
    projects: () => line(ids),
    certs: () => CERTS.forEach(([name, detail, href]) => link(`${name} — ${detail}`, href)),
    cat: (arg) => {
      const p = projectById(arg);
      if (!p) return line(`cat: ${arg || '(none)'}: no such project — try ls`, 'is-err');
      line(`${p.title} — ${p.kind}`);
      line(p.blurb);
      p.links.forEach((l) => link(`${l.label} ↗`, l.href));
    },
    open: (arg) => {
      const p = projectById(arg);
      if (!p) return line(`open: ${arg || '(none)'}: no such project — try ls`, 'is-err');
      line(`opening ${p.id}…`);
      go({ view: 'detail', id: p.id });
    },
    contact: () => { link('aaron.lawrence.alva@gmail.com', 'mailto:aaron.lawrence.alva@gmail.com'); go({ view: 'contact' }); },
    hash: (arg) => {
      const p = projectById(arg);
      if (!p) return line(`hash: ${arg || '(none)'}: no such project — try ls`, 'is-err');
      const row = line(`sha256("${p.title}") = …`);
      sha256Hex(p.title).then((hex) => { row.textContent = hex ? `sha256("${p.title}") = ${hex}` : 'hash: needs a secure context (https)'; });
    },
    clear: () => out.replaceChildren(),
    sudo: () => line('sudo: permission denied — nice try.', 'is-err'),
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value.trim().slice(0, 120);
    input.value = '';
    if (!raw) return;
    history.push(raw); cursor = history.length;
    line(`$ ${raw}`, 'is-cmd');
    const [cmd, ...rest] = raw.split(/\s+/);
    const fn = Object.hasOwn(COMMANDS, cmd.toLowerCase()) ? COMMANDS[cmd.toLowerCase()] : null;
    if (fn) fn(rest.join(' ').toLowerCase());
    else line(`${cmd}: command not found — try help`, 'is-err');
    // Keep the log short; it's a box, not a scrollback.
    while (out.childElementCount > 14) out.firstElementChild.remove();
    form.classList.add('is-open');
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp' && cursor > 0) { input.value = history[--cursor]; e.preventDefault(); }
    else if (e.key === 'ArrowDown' && cursor < history.length) { input.value = history[++cursor] ?? ''; e.preventDefault(); }
    else if (e.key === 'Escape') { input.blur(); }
    e.stopPropagation(); // arrow keys here are for history, not the carousel
  });
  input.addEventListener('focus', () => form.classList.add('is-open'));
  input.addEventListener('blur', () => { if (!out.childElementCount) form.classList.remove('is-open'); document.documentElement.classList.remove('term-summoned'); });
  return { run: (cmd) => { input.value = cmd; form.requestSubmit(); }, focus: () => input.focus() };
}
