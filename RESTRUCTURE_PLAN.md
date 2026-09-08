# Portfolio Restructure Plan — Status & Roadmap

This file is the single source of truth for the ongoing restructure of Aaron
Alva's portfolio site. It's checked into git on purpose: the two plan files
this work started from (`keen-chasing-blum.md`, `pure-orbiting-sun.md`) live
outside the repo in a user-local Claude Code folder, so a fresh session — or
anyone else opening this repo — can't see them. This file is the portable
version. **Keep it updated as work progresses**, and read it first in any new
session before assuming prior context.

Companion doc: `CLAUDE.md` (repo root) — architecture/file-layout facts that
don't change often. This file is the plan/progress tracker; `CLAUDE.md` is
the reference manual.

---

## Why this restructure is happening

The site was originally built like a creative-studio portfolio
(activetheory.net as the visual reference) for someone applying to
**cybersecurity** roles. That mismatch had two consequences:

1. **The strongest assets were gated** behind learning to operate a
   scroll-driven 3D cylinder: GIAC GFACT certified (94, Grade 11, national
   scholarship), TryHackMe Top 1% (91 rooms), HTB `maxthemadman`
   Apprentice/L25, and two real working tools (`bunny-sysd/mutagen`,
   `bunny-sysd/vigil-hunter`).
2. **Simulated artifacts undercut real ones** — a fuzz-cycle simulator with
   hardcoded logs, a CVSS calculator, a fake market chart, an in-browser CTF
   puzzle, invented ASan traces with made-up memory addresses. On a security
   portfolio, fake tool output sitting next to real tool output makes the
   real work harder to trust.

Decisions taken with Aaron: **keep the 3D scene** (he's always wanted a
cinematic, scroll-driven site and specifically asked to lean into that), but
**add an instant credentials-first landing page** in front of it, **cut every
simulated widget**, and **retheme away from neon-terminal-green** (the most
common cliché in security portfolios — reads "enthusiast," not
"practitioner").

---

## Status at a glance

| Part | What | Status |
|---|---|---|
| 0 | Recover orbital camera, fix hover/scroll bugs, correct project copy | ✅ Done, committed |
| 1 | Minimalist retheme (palette, remove 4-theme switcher, typography, bracket-stripping) | ✅ Done, committed |
| Extra | Cinematic GSAP scroll choreography (CustomEase, per-card "shots", real deep-dive tween) | ✅ Done, committed |
| 2 | Front door (credentials-first landing, shows every visit) | ✅ Done, committed |
| 3 | Cut all simulated/mocked widgets + dead-code sweep | ✅ Done, committed |
| 4 | Real tool-run artifacts (SARIF, asciinema, real patch diff, writeup) | ⛔ Blocked on Aaron |
| 5 | Optional further cleanup (see below) | Not started, low priority |

Latest commit as of writing: `6a50724` — "remove all simulated/mocked
interactive widgets and dead code". **All commits so far are local only —
nothing has been pushed to the `bunny-sysd/portfolio` remote.** Do not push
without explicit go-ahead each time.

---

## Completed work — detail

### Part 0 — Recovery & bug fixes
- Orbital camera + `tubeRigGroup` engine recovered from an unpushed local
  branch (`current-code`) via git reflog archaeology and ported into `main`.
- Hover jitter fixed: raw `mouse.x/y` was feeding directly into card
  rotation with no damping. Added `smoothMouse` (frame-damped pointer) +
  per-card `hoverWeight` (eased, not boolean).
- Scroll snap-to-card added: once wheel/drag velocity settles below a
  threshold, `targetScroll` eases onto the nearest integer card station.
- Contact form's duplicate-handler bug fixed (two blocks bound to the same
  button ID, mailing two different addresses — dead one removed).
- Mutagen/Vigil project copy corrected to match the real GitHub repos
  (real CLI commands, real 5-phase pipeline) instead of fabricated ones.
- Skill radar chart (implied numeric self-scoring, "unprofessional") replaced
  with a plain competency tag list.
- Phase/pulse node diagram and IDE-style typewriter code reveal added,
  replacing a static congested command block. Root-caused two
  `prefers-reduced-motion` bugs where the whole feature was disabled instead
  of just decorative sub-motion.

### Part 1 — Minimalist retheme
- New `:root` tokens: `text #F8FAFC`, `dim rgba(255,255,255,.55)`,
  `accent #7DD3FC` (muted cyan), `surface rgba(10,10,15,.75)`.
- Removed the 4-theme switcher entirely — CSS blocks, `.theme-dot-btn`
  clusters (desktop + mobile), `data-theme-set` handlers, the "CRT PHOSPHOR
  THEMES" command-palette group, and the WebGL-side `themePalettes` /
  `getCurrentThemeKey()` system in `three-bg.js` (collapsed to one fixed
  `currentColors` object).
- Swept hardcoded neon colors project-wide (`#00ff66`, `#00e5ff`, `#00cc66`,
  `#00ffcc` and their `rgba(...)` forms, both space and no-space variants —
  the no-space sweep initially missed 55 space-variant occurrences, caught
  via a follow-up screenshot check) to the new muted palette. Left one
  legitimate `0xe5a82e` (brass/gold metal material) alone.
- Softened all 6 project card accent colors to pastels.
- Typography audit: flipped ~18 non-metadata `font-family: var(--font-mono)`
  rules to sans, keeping mono for timestamps/status text/code panels.
- Stripped `[BRACKET]`-style terminal formatting from headings/nav/prose
  across static HTML, JS string literals, and canvas-drawn card text.

### Cinematic GSAP layer (`pure-orbiting-sun.md`, fully executed)
- `gsap.registerPlugin(CustomEase)`; three named eases: `cinematicSilk`,
  `cinematicFlow`, `cinematicArrive`.
- Deep-dive open/close transition rebuilt as a real `gsap.to()` tween
  (was a fixed-rate per-frame lerp) — `cinematicArrive` on open (0.85s),
  `cinematicSilk` on close (0.65s).
- Added a paused `cinematicTimeline` with per-card additive camera/lookAt
  offset "shots", scrubbed via `.time(scrollProgress)` — purely additive on
  top of the existing hand-rolled orbit math, which is untouched.
- Removed a dead `initGSAP()` block in `app.js` that set up native
  `ScrollTrigger` against DOM elements that don't exist in the live page
  (leftover from an earlier bento-grid design) — it could never fire because
  the page has no real DOM scroll (`overflow: hidden !important`).

### Part 2 — Front door
- New `#frontDoor` overlay inserted right after `<body>`: name, one-line
  positioning, location (Canada — not more specific, matching what's already
  public elsewhere), 3 real credential cards (GFACT/THM/HTB, real links),
  Mutagen + Vigil repo links, an explicit "Enter the Experience" button
  (**no auto-resolve, no timer** — visitor must click, or press ESC to skip),
  contact email.
- Shows on **every** visit — no localStorage/persistence by design.
- Input lock: added a `front-door-active` body class, wired into all three
  existing `three-bg.js` input guards (wheel, pointerdown, click-raycast)
  plus the global `1`–`6`/arrow-key handler in `app.js` — the latter had
  **zero** overlay guard before this, a genuine pre-existing gap found while
  building this, not something introduced by it.
- Verified via Playwright "break-in attempt" script: wheel scroll + number-key
  press + click while the front door is showing, confirming via
  `document.body.classList` state (not just visual coverage) that nothing
  gets through.

### Part 3 — Cut simulated widgets + dead-code sweep
Removed, with zero remaining references verified by grep after each cut:
- Fuzz-cycle simulator (Mutagen drawer)
- CVSS v3.1 calculator (Vigil drawer)
- Market candlestick chart (SignalHub drawer — parent panel/overview text
  survives, flows straight into the phase diagram)
- In-browser CTF cipher puzzle (Proving Grounds drawer)
- Operator CLI explorer (was already fully orphaned, no HTML target)
- ~12 more fully orphaned JS IIFEs found during inventory, each verified
  to have zero matching DOM/zero external callers: badge matrix, skills
  canvases, bento widgets, claw game, project modals, active-node matrix,
  clickable certs, Gemma fault game (+ its only helper,
  `playSystemAlarmBeep`), bento spotlight tracker, Vigil eye tracker,
  SignalHub radar, Mutagen sandbox controller.
- 2 more newly-discovered dead widgets found nested inside a shared
  "Active Theory 3D Cylinder Controller" mega-IIFE while removing the
  planned ones: a Wireshark PCAP packet-row selector, a SANS GFACT quiz.
- All exclusive CSS for the above (`.fuzzer-*`, `.btn-trigger-fuzz`,
  `.cvss-*`), while explicitly preserving `.target-btn` and `.dd-console` —
  both have surviving real consumers (the CTF machine-writeup tabs in
  Proving Grounds; Vigil's sample execution-trace console).

Net: `app.js` went from 3053 → 1309 lines (root + `public/` copies kept
byte-identical throughout); `style.css` −133 lines; `index.html` −93 net
lines. Verified via Playwright: all 4 affected drawers open cleanly, zero
console/page errors, no orphaned gaps, both shared classes render correctly
for their survivors.

---

## Part 4 — Real artifacts (blocked on Aaron)

Nothing to build yet — this needs Aaron to actually run his tools and hand
over the output. By effort-to-value, once unblocked:

1. `mutagen --target targets/01_buffer_overflow.c` — a real run through all
   five phases
2. `vigil analyze <scan> --format sarif --output results.sarif` — commit the
   **real** SARIF file, link it, excerpt it in the drawer
3. `vigil compass <scan> --phase initial_access` — Vigil's actual
   differentiator; nothing on the site demonstrates this today
4. Real screenshot of the deployed SignalHub app
5. asciinema recording of a full Mutagen run
6. A real Mutagen-produced patch diff, replacing the current "ILLUSTRATIVE
   EXAMPLE"-labeled case study (that label is honest and can stay until
   this lands)
7. **One written case-study/writeup** — an HTB/THM box walkthrough, or "how
   Mutagen's 5-phase pipeline works and what broke building it." For
   pentest/security hiring this outperforms any visual polish on the site.

Reuse the existing `.ide-panel` and `.command-block` components for real
output rather than building new display components.

---

## Part 5 — Optional further cleanup (not started, low priority)

Noted during Part 3 inventory but out of scope unless asked:
- CSS-only orphans: `.fault-active-overlay`, `.hardware-fault-screen`,
  `.interactive-modal-overlay`
- `body.mobile-menu-open` — referenced with no matching CSS anywhere
- The unmounted React tree in `src/` (~1,250 lines: `HeroSection.jsx`,
  `ActiveObjectives.jsx`, `SysArmament.jsx`, `MutagenCard.jsx`,
  `InteractiveBackground.jsx`, `OperationalSpecs.jsx` — none render, none
  are even imported by `main.jsx` for the last two)

---

## Standing gotchas (read before editing `app.js` / `three-bg.js`)

- **Root + `public/` duplication is real and intentional.** `app.js` and
  `three-bg.js` exist byte-identical at repo root and in `public/` (root
  serves `file://` direct-open; `public/` is what Vite dev/build serves).
  Edit one, copy to the other, `diff` to confirm — every time.
- **Cache-busting**: `index.html` references these files with `?v=X.Y`
  query strings. Bump the version on every edit to the referenced file, or
  a stale browser cache can produce a false bug report (happened once
  already this project).
- **`prefers-reduced-motion: reduce` has masked two real bugs** by disabling
  an entire feature instead of just its decorative motion. Always test both
  settings when touching anything animated.
- **Scroll is entirely synthetic.** `overflow: hidden !important` on
  `html, body` means there's no real DOM scroll — wheel/drag accumulate into
  a `scrollProgress` integer (0–6) consumed per-frame. Native `ScrollTrigger`
  scroll-detection cannot attach to this page; GSAP is used as a manually
  scrubbed timeline engine instead (`.time(scrollProgress)`), not with its
  own scroll listener.
- **Cards are Canvas2D, not DOM** (`generateCardTexture()` →
  `THREE.CanvasTexture` on a plane mesh) — CSS cannot style them directly;
  color/font changes for cards must be made in the JS texture-drawing code.
- Chrome DevTools MCP has a history of developing a stuck browser-profile
  lock across session boundaries. Playwright (installed, `chromium` browser
  present) is the reliable fallback — has been used throughout for all
  real-browser verification this project.

---

## How to resume work in a new session

1. Read this file, then `CLAUDE.md`.
2. `git log --oneline -10` to confirm what's actually landed vs. what this
   file claims — this file can drift out of date; git is ground truth for
   what's committed.
3. `git status` to see if there's uncommitted work in progress.
4. Confirm the dev server is up: `curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5173/`
   — restart with `npm run dev` if not (it has died across session
   boundaries before).
5. Pick up at the next unchecked item in the Status table above.

**Remember:** commits are pre-approved as local checkpoints throughout this
work ("save your versions in git if you want, just don't commit remote") —
but pushing to the `bunny-sysd/portfolio` remote requires fresh, explicit
approval every time, regardless of what this file or past sessions did.
