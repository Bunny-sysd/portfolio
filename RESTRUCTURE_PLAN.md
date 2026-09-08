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
   scholarship), TryHackMe Top 1% (100+ rooms), HTB `maxthemadman`
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
| 5 | Deep dead-code sweep (old pre-cylinder design + unmounted React tree) | ✅ Done, committed |

**All commits so far are local only — nothing has been pushed to the
`bunny-sysd/portfolio` remote.** Do not push without explicit go-ahead each
time.

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
  Mutagen + Vigil repo links, an explicit "Explore My 3D Portfolio" button
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

## Part 5 — Deep dead-code sweep

Part 3 only removed code tied to the simulated widgets it set out to cut.
While inventorying it, a much larger pattern turned up: a whole earlier
"design generation" — pre-cylinder, pre-synthetic-scroll, from before the
current orbital-camera/drawer system existed — was still sitting in `app.js`
and `style.css`, fully superseded but never deleted. This part removed it.

**Method:** for every CSS class in `style.css`, checked whether it has any
matching element in the live `index.html` (checking `app.js`/`three-bg.js`
too, for classes only ever added dynamically via `classList`). Zero matches
anywhere = provably dead — no visitor's browser can ever apply that rule.
Cross-checked section by section rather than trusting the automated scan
blindly: a few classes looked "dead" only because they were referenced
inside an otherwise-live combined CSS selector or JS selector-list string
(e.g. `.cmd-prompt`, `.cmd-trigger-btn`, `.cmd-badge` each had one real
consumer buried inside a section that otherwise was entirely dead) — those
specific rules were preserved while their dead neighbors were cut.

**Removed from `app.js`** (six IIFEs, each confirmed to target zero live
DOM elements, and confirmed unreachable — e.g. `initActiveNav` listened for
native `scroll` events that can never fire since the page has
`overflow: hidden !important`):
`initActiveNav`, `initMobileMenu` (superseded by the current
`mobileMenuModal` system), `initSmoothScroll`, `initReveal`, `initCounters`,
`initTilt`, and `initCinematicHUDController` (targeted a `hudZoneName`/
`hudVelocity`/`.zone-jump-btn` HUD that doesn't exist in the current markup,
and called a `window.warpToZone` that's never defined anywhere). Also
trimmed two harmless-but-fully-dead class fragments out of otherwise-live
selector-list strings in `initCursor` and the global click-SFX listener
(`.bento-project-card`, `.cert-card`, `.radar-tab`, etc. — remnants of the
same old design, matching zero elements, but sitting inside code that is
itself live and stays).

**Removed from `style.css`** (~1,974 lines, verified section-by-section
against `index.html`/`app.js`): the entire old pre-cylinder page design —
hero terminal/boot console, dynamic terminal command chips, the old floating
pill nav (superseded by the current `.at-header`/`.at-nav-link` system), the
old About/Certs bento layout and badge-matrix/knowledge-badges sections
(superseded by the front door's credential cards), the "active targeting
node matrix" and old Archify pipeline-flow diagram (superseded by the
current phase-flow node/pulse diagram), a floating terminal tooltip, a
project-detail DOM modal system, the fullscreen "hardware fault" RAM-repair
minigame (matches the deleted `initGemmaFaultGame`), a VM sandbox packet
animation, a tensor-weights grid, the Vigil eye-scanner and SignalHub radar
widgets (match Part 3's JS removals), the interactive branching modal
sandbox system, and the cinematic HUD/fast-travel dock (matches the removed
`initCinematicHUDController`). `.target-btn`, `.cmd-trigger-btn`,
`.cmd-badge`, and `.dd-console` were individually preserved throughout since
each still has a real consumer.

Verified via Playwright after every change: `node --check` on both JS files,
brace-balance check on `style.css`, then a full-site sweep — front door,
main orbit view, command palette, all 6 drawers, mobile menu, mobile
viewport — with zero console/page errors and no visual regressions.

### Follow-up pass — the rest of it

Two items from the first pass got finished in a second round the same day:

- **The "ELEVATED GLASSMORPHIC CARDS" mixed block.** `.glass-panel` was
  declared twice — once as a plain base rule, once inside a later,
  `!important`-flagged compound selector shared with four dead classes
  (`.about-main`, `.cert-card`, `.parent-node`, `.bento-project-card`). The
  `!important` declaration is the one that actually wins the cascade for
  every real `.glass-panel` element (the front door's credential cards), so
  it had to be preserved, not deleted with its dead neighbors — split the
  selector, kept `.glass-panel`/`.glass-panel:hover`, cut the rest (the old
  bento project-card visual system: mutagen/stock/vm/pentestai preview
  panels, an old plain-email contact section, `.footer`/`.footer-inner`
  which turned out to be dead too — the page currently has no footer
  element at all).
- **A second, finer sweep** (extract every class in `style.css`, check
  each against `index.html`/`app.js`/`three-bg.js`) found ~28 more isolated
  dead rules the first pass missed — mostly leftover theme-switcher remnants
  (`.mobile-theme-row/-label/-dots`, `.cmd-theme-swatch`, matching Part 1's
  switcher removal), an old duplicate contact-form terminal-chrome mockup
  (`.contact-term-header/-dot/-title/-body/-line`, `.contact-cipher-block`),
  an old floating pill nav and its mobile-menu variant, and old generic
  `.section-*` wrapper classes. One real (if inert) bug turned up along the
  way: a mobile media query targeted `.at-theory-drawer`, a class that
  hasn't existed since the component was renamed to `.at-drawer` — harmless
  only because `.at-drawer`'s base rule already sets `width/height:
  100vw/100vh` unconditionally, so the missing mobile override was a no-op,
  not an active bug.
- **The unmounted React tree in `src/` — fully removed, not just left
  documented.** This wasn't just dead code sitting in a folder: `index.html`
  had `<script type="module" src="src/main.jsx">`, so every visitor's
  browser was actually downloading and executing React, ReactDOM,
  framer-motion, and lucide-react for zero visual output (none of
  `main.jsx`'s 4 mount targets exist in the page). Confirmed
  `InteractiveBackground.jsx`/`OperationalSpecs.jsx` were additionally
  never imported by anything, `gsap`/`tailwind-merge`/`clsx`/
  `@emotion/is-prop-valid` were unused by any src file, and `@react-three/*`
  + npm `three` were used only by the now-deleted `InteractiveBackground.jsx`
  (the real Three.js on the page is the CDN-loaded r128 build in
  `three-bg.js`, unrelated). Removed: `src/`, `tailwind.config.js`,
  `postcss.config.js`, the `react()` plugin from `vite.config.js`, and 13
  packages from `package.json` (`npm install` afterward removed 212
  packages from `node_modules`). Verified both `npm run build` and
  `npm run dev` still work cleanly, then a full Playwright sweep — zero
  console errors, nothing visually changed (correctly, since nothing ever
  rendered from that tree).

Nothing identified as worth doing is left outstanding from Part 5.

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
