// Skills, kept broad on purpose: domains, not technique lists. Each says how
// deep it goes in plain words (`level`: hands-on = practised or built
// regularly; familiar = working knowledge) — never a numeric score — where
// it's practised, and what's caught Aaron's interest lately. Wording comes
// from Aaron (2026-10-17) and the verified facts in CLAUDE.md; nothing here
// names a target, an address or a specific exploit chain.
export const SKILLS = [
  {
    domain: 'Web application security',
    level: 'hands-on',
    where: 'PortSwigger Web Security Academy labs',
    lately: ['Web LLM attacks', 'Web cache attacks'],
  },
  {
    domain: 'Offensive security labs',
    level: 'hands-on',
    where: 'TryHackMe (Top 1%, 100+ rooms) · Hack The Box (maxthemadman, Apprentice, Level 25)',
    lately: [],
  },
  {
    domain: 'Security tooling & AI',
    level: 'hands-on',
    where: 'Building Mutagen (AI fuzzer) and Vigil (threat-hunting CLI) in Python',
    lately: [],
  },
  {
    domain: 'Cloud',
    level: 'familiar',
    where: 'Setting up environments in Google Cloud and Azure',
    lately: [],
  },
  {
    domain: 'Linux, Windows & Active Directory',
    level: 'familiar',
    where: 'Lab practice on TryHackMe and Hack The Box',
    lately: [],
  },
  {
    domain: 'Foundations',
    level: 'hands-on',
    where: 'GIAC GFACT, scored 94 — architecture, networking, Linux, Python',
    lately: [],
  },
];

// The dossier's skills map, rendered from SKILLS (text only, via textContent).
export function renderSkills(root) {
  const doc = root.ownerDocument;
  const cards = SKILLS.map((s) => {
    const card = doc.createElement('div');
    card.className = 'skill-card';
    const head = doc.createElement('div');
    head.className = 'skill-card__head';
    const name = Object.assign(doc.createElement('div'), { className: 'skill-card__domain', textContent: s.domain });
    const lvl = Object.assign(doc.createElement('span'), { className: `skill-card__level is-${s.level}`, textContent: s.level === 'hands-on' ? 'Hands-on' : 'Familiar' });
    head.append(name, lvl);
    const where = Object.assign(doc.createElement('p'), { className: 'skill-card__where', textContent: s.where });
    card.append(head, where);
    if (s.lately.length) {
      const row = Object.assign(doc.createElement('p'), { className: 'skill-card__lately' });
      row.append(Object.assign(doc.createElement('span'), { className: 'skill-card__lately-k', textContent: 'Lately into' }));
      s.lately.forEach((t) => row.append(Object.assign(doc.createElement('span'), { className: 'skill-tag-pill', textContent: t })));
      card.append(row);
    }
    return card;
  });
  root.replaceChildren(...cards);
}
