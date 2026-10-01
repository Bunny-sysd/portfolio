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
| 6 | Active Theory-level 3D upgrade (see Part 6 below) | ⛔ Superseded by Part 7 (see below) — the scroll-cylinder engine this part upgraded was retired, not finished |
| 7 | Cinematic descent rebuild (see Part 7 below) | ✅ Done, committed on branch `cinematic-descent` (old engine retired in the Task 8 cleanup) |

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

## Part 6 — Active Theory-level 3D upgrade — **superseded by Part 7**

> **Superseded.** This part upgraded the scroll-cylinder engine
> (`app.js`/`three-bg.js`, CDN-loaded Three.js r128 + GSAP). That whole
> engine — root and `public/` copies alike — was retired in the Task 8
> cleanup of the cinematic-descent rebuild (Part 7, below) and no longer
> exists in the working tree (recoverable from git history on `main` if ever
> needed). Everything below is kept as historical record of work that did
> land before the rebuild superseded it; none of it should be used as a
> guide for current work — read Part 7 and `CLAUDE.md` instead. Notably,
> item 1 in the "next steps" list below (the mobile card-framing bug) is
> **resolved** by the rebuild: the new design has no cylinder/cards to frame
> at all, so that whole class of bug doesn't apply to the current scene.

Goal: push the opt-in 3D experience toward activetheory.net quality. Safe to
be bold here because the front door already gives recruiters everything in
seconds. Ideas were ranked by payoff/effort; done so far:

- ✅ **Two-way front door.** OVERVIEW link in the header, a mobile-menu row,
  and a command-palette entry all reopen it (`window.openFrontDoor`), closing
  any open drawer/menu first. (Also fixed: the palette's six project entries
  did nothing — no handler for their `card` action.)
- ✅ **Post-processing** (`three-bg.js`, "8b" block): selective bloom + a
  film pass (corner-only chromatic aberration, vignette, grain). Cards are
  excluded from bloom by zeroing their color/emissive during the bloom pass
  so their text never smears. Composite reads UnrealBloomPass's glow-only
  buffer — reading the composer output instead draws the scene twice.
  Skipped on "low" GPU tier; the FPS watchdog drops it on slow machines.
- ✅ **Mutagen signature scene** (`mutagenScene` in `three-bg.js`): a halo of
  C/fuzzing code fragments around the Mutagen card that keep scrambling;
  periodically an on-screen fragment faults (red SIGSEGV + shockwave) then
  turns mint PATCHED — Mutagen's real loop. Only visible near scroll
  station 2; hidden while a drawer is open.

Next, in recommended order:
1. **Mobile card framing (real bug, pre-existing).** On phones the resting
   camera leaves each project card mostly off the left edge of the screen
   (verified identical on the code from before this part started).
2. Signature scenes for the other projects, same pattern as Mutagen: Vigil
   (a scan sweeping a node network, findings lighting up), Proving Grounds
   (a machine's layers being peeled open), SignalHub (live data streams).
3. Camera flights between projects instead of rotating the cylinder.
4. Three.js upgrade off r128 (biggest risk — whole engine targets r128).

Testing note: headless Playwright defaults to a software GPU (SwiftShader),
which the engine's tier detection treats as "low" — so post-processing is
skipped and screenshots lie. Launch with
`args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu']`
to render on the real GPU.

---

## Part 7 — Cinematic descent rebuild (branch `cinematic-descent`)

Full ground-up rebuild of the 3D experience, replacing the scroll-cylinder
engine (Part 6) entirely rather than continuing to upgrade it. Spec and plan:

- `specs/2026-09-30-cinematic-descent-design.md` — the design spec.
- `specs/2026-09-30-cinematic-descent-plan.md` — the implementation plan
  (8 tasks; this rebuild's own portable status/roadmap, analogous to this
  file but scoped to the branch).

Shape of the rebuild, for anyone orienting from this file instead of the
spec/plan directly:

- Scroll is now **real native page scroll** (no `overflow: hidden` trick),
  optionally smoothed by [Lenis](https://github.com/darkroomengineering/lenis)
  and skipped entirely under `prefers-reduced-motion: reduce`.
- The 3D scene is npm-package Three.js (`three` ^0.186), imported as real ES
  modules from `src/scene/`, not CDN `<script>` tags — a sky/cloud/city
  descent scrubbed by scroll progress, not a rotating card cylinder.
- `src/timeline.js` is the single source of truth for every progress-driven
  value (chapter positions, palette, opacity curves, camera altitude), so
  the DOM chapter text and the 3D scene can never disagree about where a
  given scroll position is in the story.
- DOM chapter text ("beats") crossfades over the scene via CSS custom
  properties, not canvas-drawn cards.
- Old-site case-study widgets (`phase-flow`, `commands` typewriter,
  `ctf-tabs`) were ported into real `<dialog>` elements with deep-link hash
  routing, rather than left as dead/simulated code.
- Full test coverage: `tests/unit/*.test.js` (`npm test`, vitest) for pure
  logic (`timeline.js`, `tier.js`, etc.) and `tests/e2e/*.mjs` (`npm run e2e`,
  Playwright against a running dev server) for content, scene rendering,
  case-study interaction, and fallback behavior (no-WebGL, reduced motion).
- **The old engine is retired**, not archived in-tree: `app.js`,
  `three-bg.js`, `public/app.js`, `public/three-bg.js`, and `style.css` were
  deleted in the Task 8 cleanup once nothing in `index.html` or `src/`
  referenced them. They remain in git history on `main` if ever needed.
- The Part 6 mobile card-framing bug (resting camera left each project card
  mostly off the left edge of the screen on phones) is **resolved** by this
  rebuild — there's no card cylinder left for that bug to apply to.

See `CLAUDE.md` for the current architecture reference (stack, file layout,
fallbacks) now that it has been rewritten for this design.

---

## Standing gotchas (cinematic-descent build)

> The gotchas that used to live here (root/`public/` file duplication,
> `?v=X.Y` cache-busting query strings, fully synthetic `scrollProgress`
> scroll, Canvas2D-drawn cards) applied to the retired `app.js`/`three-bg.js`
> cylinder engine deleted in the Task 8 cleanup. They no longer apply to
> anything in the working tree — `app.js`, `three-bg.js`, and their `public/`
> copies are gone, recoverable only from git history on `main`. Replaced
> below with the real gotchas for the current `src/`-based architecture.

- **`src/timeline.js` is the single source of truth** for beat positions
  (`CHAPTERS`), the sky palette (`paletteAt`), opacity curves, and camera
  altitude (`altitudeAt`). Never hardcode a progress value or a color
  keyframe anywhere else — both the DOM chapter text (`chapters.js`) and the
  3D scene modules read from here, and they'll drift out of sync with each
  other the moment a second copy of a number exists.
- **Playwright needs real-GPU launch args to mean anything.** Headless
  Chromium's default software GPU (SwiftShader) gets classified `low` by
  `src/tier.js`'s `detectTier()`, which skips post-processing — a screenshot
  or scene assertion taken without `lib.mjs`'s `GPU_ARGS`
  (`--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu`) is testing a
  degraded scene and can produce a false pass or fail. `fallbacks.mjs`'s
  no-WebGL case is the one deliberate exception — it launches with
  `--disable-webgl --disable-3d-apis` on purpose.
- **`prefers-reduced-motion: reduce` must keep content fully working** —
  only decorative motion (camera idle drift, cloud drift, Lenis smoothing)
  stops; scroll-driven state changes and all content must still reveal
  correctly. This has masked real bugs twice in this project's history by
  disabling a whole feature instead of just its decorative part — always
  test both settings when touching anything animated.
- **`npm test` (vitest 5) needs Node ≥22.12 locally.** CI (GitHub Actions,
  Node 20) only runs `npm run build` — a unit-test regression will not fail
  CI by itself, so run `npm test` locally before trusting a change.
- **Never commit `.superpowers/` or `test-results/`** — both are gitignored
  on purpose (session/plan scratch and Playwright screenshot/report output,
  respectively). Double-check `git status --short` after any `git add -A`.
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
