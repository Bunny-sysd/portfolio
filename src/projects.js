// The work carousel's cards, in orbit order. Copy is taken verbatim from the
// verified chapter text (see CLAUDE.md "Content/copy"): no invented dates,
// stats or claims — `meta` is category and stack, not a year/client line.
// `dossier` opens the full case-study <dialog> of the same id.
export const FILTERS = ['tools', 'research', 'ctf', 'certs'];

export const PROJECTS = [
  {
    id: 'mutagen',
    title: 'Mutagen',
    kind: 'Agentic AI & vulnerability fuzzing',
    meta: 'Python / Ghidra / LLM agents',
    tags: ['tools', 'research'],
    blurb: 'Mutagen is an agentic AI fuzzer built in Python that reads source code (or a compiled binary via Ghidra decompilation), finds vulnerabilities, generates exploits, patches the bugs, and proves the fix works — fully autonomously.',
    stats: ['5-phase pipeline', '8 CWE classes', '3 scan profiles', '130+ unit tests'],
    links: [{ label: 'Source on GitHub', href: 'https://github.com/bunny-sysd/mutagen' }],
    // How it works, for the detail view's flow diagram (from the README).
    flow: [
      ['Analyze', 'The LLM reads the target source — or a binary decompiled with Ghidra — and flags candidate vulnerabilities.'],
      ['Compile', 'Builds the target with a crash handler injected, so every failure is captured and attributed.'],
      ['Fuzz', 'Fires AI-generated payloads; failed attempts feed back and the agent retries with adjusted inputs.'],
      ['Patch & Exploit', 'On a confirmed crash, drafts a secure C patch and a Python proof-of-concept.'],
      ['Verify', 'Re-runs the campaign against the patched build to prove the bug is gone.'],
    ],
    hue: 0.48,
  },
  {
    id: 'vigil',
    title: 'Vigil',
    kind: 'Threat intelligence & CLI automation',
    meta: 'Python / NVD API v2 / SARIF',
    tags: ['tools'],
    blurb: 'Vigil is a human-in-the-loop threat hunting CLI built in Python — the human decides, Vigil informs.',
    stats: ['8 formats auto-detected', 'NVD API v2 live feed', 'SARIF v2.1 output'],
    links: [{ label: 'Source on GitHub', href: 'https://github.com/Bunny-sysd/vigil-hunter' }],
    flow: [
      ['Analyze', 'vigil analyze ingests the scan, maps services to CPE 2.3 and correlates them live against NVD and OSV.dev.'],
      ['Compass', 'vigil compass ranks tactical next steps for the current phase — recon, initial access or privesc. You choose.'],
      ['Report', 'Exports SARIF v2.1, HTML or Markdown; vigil diff and vigil session track the engagement over time.'],
    ],
    hue: 0.58,
  },
  {
    id: 'signalhub',
    title: 'SignalHub',
    kind: 'AI stock dashboard',
    meta: 'Web app / AI scoring / Firebase',
    tags: ['tools'],
    blurb: 'SignalHub ships as APEX Intelligence, an AI stock dashboard: a market snapshot and Fear & Greed gauge, AI-scored Buy / Watch / Avoid picks, a screener and watchlist, a scenario engine for target prices, and an AI assistant. Simulated data by default; live prices with a free API key.',
    stats: ['AI-scored picks', 'Screener & watchlist', 'Scenario engine'],
    links: [{ label: 'Live app (APEX Intelligence)', href: 'https://signalhub-e79ba.web.app' }],
    flow: [
      ['Market', 'Snapshot, movers, sectors and a Fear & Greed gauge — simulated by default, live with your own API key.'],
      ['Score', 'Every stock gets an AI score and a Buy, Watch or Avoid signal; the screener filters on them.'],
      ['Decide', 'Watchlist, what-if scenarios for target prices, and an assistant panel for market questions.'],
    ],
    hue: 0.12,
  },
  {
    id: 'proving-grounds',
    title: 'Proving Grounds',
    kind: 'Offensive security practice',
    meta: 'TryHackMe / Hack The Box',
    tags: ['ctf'],
    blurb: 'Top 1% on TryHackMe with 100+ rooms completed, and an Apprentice-tier, Level 25 player on Hack The Box as maxthemadman.',
    stats: ['Top 1% TryHackMe', '100+ rooms', 'HTB Apprentice · L25'],
    links: [
      { label: 'TryHackMe profile', href: 'https://tryhackme.com/p/354221973' },
      { label: 'Hack The Box profile', href: 'https://app.hackthebox.com/users/3735054' },
    ],
    flow: [
      ['TryHackMe', 'Top 1% · 100+ rooms completed.'],
      ['Hack The Box', 'maxthemadman · Apprentice tier · Level 25.'],
      ['Focus', 'Linux privilege escalation, Active Directory attack paths and web exploitation.'],
    ],
    hue: 0.95,
  },
  {
    id: 'who',
    title: 'Researcher',
    kind: 'Profile & certification',
    meta: 'GIAC GFACT / Grade 11 / Canada',
    tags: ['research', 'certs'],
    blurb: 'I am a Grade 11 cybersecurity researcher and systems developer specializing in autonomous vulnerability discovery, agentic AI fuzzing architectures, and low-level Linux systems security.',
    stats: ['GIAC GFACT · Scored 94'],
    links: [{ label: 'GFACT on Credly', href: 'https://www.credly.com/badges/e6b7f224-b57d-4224-9f7a-cabe2b3fb257' }],
    flow: [
      ['Scholarship', 'Full national scholarship through CyberStart Canada.'],
      ['GIAC GFACT', 'Certified · scored 94 · issued 1 September 2026.'],
      ['Build', 'Mutagen and Vigil — open source on GitHub.'],
    ],
    hue: 0.72,
  },
];

export const projectById = (id) => PROJECTS.find((p) => p.id === id) || null;
