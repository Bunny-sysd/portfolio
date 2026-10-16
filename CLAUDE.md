# Aaron Alva Portfolio — CLAUDE.md

Single-page portfolio (`bunny-sysd.github.io/portfolio`) structured after activetheory.net (studied hands-on and with REA — see `RESTRUCTURE_PLAN.md` Part 9; **its structure and interaction patterns, never its code, shaders, models, font or copy**): one fixed WebGL stage with views that swap in place — home (a GPU particle core + credentials), a work carousel of glass cards orbiting the core, project detail (the card flies to the camera), and a frosted contact overlay — plus a terminal box as the cyber feature. Built on branch `at-structure`; the previous cloud-descent site (branches `cinematic-descent`/`at-polish`) is recoverable from git.

## Stack

- Vite **6** + **vitest 5**, a real ES module build — **npm-package Three.js (`three` ^0.186) imported from `src/`, not CDN scripts.** `vite.config.js`: `base: './'`, `build.outDir: 'docs'`, `test.include: ['tests/unit/**/*.test.js']`. No Lenis any more (removed with the scroll film).
- **The page doesn't scroll.** `body { overflow: hidden }`; views are fixed layers toggled by `is-active`/`inert`. Wheel, keys and swipes are read by `views.js` and turned into route changes or carousel steps (home ⇄ work at ~220 px of wheel, one carousel step per ~110 px with a 320 ms gap, ~260 px closes a project — "scroll to close").
- **Hash routing** (`router.js`): `#/`, `#/work`, `#/work/<id>`, `#/contact`. Hash, not path, because GitHub Pages with a relative base can't serve nested paths without a 404 trick. Legacy `#<case-id>` links map to that project's detail with its dossier open. Back/Forward work.
- `src/projects.js` is the single source of truth for project copy, tags and links — verbatim from the verified text; **no invented years/clients** (the AT-style meta line is category / stack instead).
- `src/tier.js` gates quality once at load into `low`/`mid`/`high` (`renderScale` 0.75 / 1 / 1.25 — the particles and card screens are crisp detail; and whether post FX runs).
- `playwright` drives all real-browser verification (`tests/e2e/*.mjs`), with real-GPU flags (`lib.mjs` `GPU_ARGS`); the no-WebGL case deliberately uses `--disable-webgl --disable-3d-apis`.
- Chrome DevTools MCP can develop a stuck profile lock across sessions ("browser is already running") — don't kill Chrome processes, fall back to Playwright.
- REA (morluto/rea) is installed only as a skill in `~/.agents/skills`, not as a Claude Code MCP server; its CLI (`npx -y rea-agents@6.5.0 analyze-javascript-application <dir> --json`) works without registration.

## File layout

- `index.html` — the only entry point: chrome (nav pill + credentials ticker), the four `<section class="view">`s, the terminal form, and the five case-study `<dialog>`s (unchanged dossiers). `<script type="module" src="/src/main.js">`.
- `src/`:
  - `main.js` — wiring and the single rAF loop: stage → world → post; router → views; terminal; dossiers (`initCaseStudies` with a no-op scroll). Precompiles **both** the scene (`renderer.compileAsync`, against the composer target) **and** the post chain (`post.precompile()`) before the first draw; drawing straight away linked shaders synchronously (~300 ms freeze). FPS watchdog: lower resolution → drop post (`data-quality`). Context loss toggles `no-webgl`. Dev-only handles: `window.__stage`, `__world`, `__fluidEnergy`.
  - `router.js`, `projects.js`, `views.js` (DOM side of the views: caption/detail rendering with `decodeText`, filters, all input, canvas-click picking, focus moves into the new view), `terminal.js` (commands answered from site data only; input is only ever written back via `textContent`; links come from data, never from input), `case-study.js`/`case-ids.js` (dossier dialogs; the router now owns their hashes), `contact.js` (mailto builder).
  - `scene/`: `stage.js` (renderer bootstrap + WebGL probe; `renderer.debug.checkShaderErrors` is **on only in dev** — reading info logs forces a sync GPU wait), `world.js` (scene graph + camera marks per view, eased base position with pointer parallax added as a pure offset — adding it to the eased position compounded to a ~12-unit drift once; portrait screens get their own marks), `core.js` (60k-point particle core, vertex-shader motion, pointer parting), `cards.js` (glass cards: refract a half-res backdrop pass via `renderBackdrop()`, double-sided, yaw = 0.3 × ring angle so side cards face the camera; the open card lerps in front of the camera, right of centre on desktop), `screens.js` (original Canvas2D motif per project), `post.js` + `fluid.js` (bloom → fluid pass → output → grain; the fluid pass does cursor fluid, the frosted nav corner, the detail/dive streak and the contact frost — full-frame here via `contactFull`, as a 12-tap jittered disc blur, since 4 fixed taps stamped ghost copies).
  - `widgets/` — `decode.js` (scramble-decode; always decodes the element's *current* text and cancels a run already in flight on that element — a cached text once showed the wrong project title), `boot.js` (load readout), plus the dossier widgets `phase-flow.js`, `commands.js`.
  - `styles/site.css` (everything outside the dossiers), `styles/case-study.css` (dossiers).
- `docs/` is gitignored build output, deployed by GitHub Actions on push to `main`.
- `.agents/mcp_config.json` is gitignored and holds a live-looking secret. Never `git add -f` it or echo it.

## Fallbacks

- **No WebGL**: `createStage()` returns `null`, `html.no-webgl`; the DOM carries the whole site over a CSS radial backdrop — the work caption with its arrows and Open button, details, contact. Same class while the context is lost.
- **No JavaScript**: home (name + three credentials) shows and reads; the rest needs JS.
- **`prefers-reduced-motion`**: no fluid splats, streak, decode, ticker or cue animation; core/card motion held still (`uTime` 0); view changes are short fades and eased values snap. Views, routing, filters and the carousel all still work. Aaron's own PC has animations off, so he sees this version by default (see memory).
- All three, plus context loss/restore, are covered by `tests/e2e/fallbacks.mjs`.

## Content/copy

Mutagen and Vigil project copy has been corrected to match their real repos (`bunny-sysd/mutagen`, `bunny-sysd/vigil-hunter`) — real CLI commands, real pipeline phases, a dead GitHub link fixed. The skill-proficiency radar chart (implied numeric self-scoring) was replaced with a plain competency tag list. The old simulated widgets (fuzz-cycle simulator, CVSS calculator, candlestick chart, CTF puzzle, operator CLI explorer) were cut in the descent rebuild. On 2026-10-02 the fabricated content flagged in review was removed: the unverified "14.2K Mutation Cycles" stat (Who dialog), the "zero-day" framing on Mutagen (its README still says "zero-day", but the portfolio now says "AI fuzzer / vulnerability fuzzing" — don't claim found zero-days without a public artifact), and the invented HTB/THM machine "writeup breakdowns" (proving-grounds). What remains simulated is the console-style sample output inside the Vigil case-study dialog (the `[POC_FOUND]` lines) — still flagged for Aaron to replace with a real terminal capture, not yet done; for anything else, the real proof is the linked repos and HTB/THM profiles.

## Verified facts to use verbatim in copy (don't paraphrase/estimate)

- GIAC GFACT certified, issued 1 September 2026, scored 94. Credly: `https://www.credly.com/badges/e6b7f224-b57d-4224-9f7a-cabe2b3fb257`
- TryHackMe: Top 1%, 100+ rooms completed
- Hack The Box: handle `maxthemadman`, Apprentice tier, Level 25

## Commands

- `npm run dev` — Vite dev server (`127.0.0.1:5173`)
- `npm run build` — outputs to `docs/`
- `npm test` — vitest over `tests/unit/` (router, tier, contact). **Needs Node ≥22.12 locally**; CI (Node 20) only builds, so run it yourself.
- `npm run e2e` — `site.mjs` (views, routing, carousel, filters, detail, contact, terminal incl. an HTML-injection check, Back, decode, fluid energy, contrast, phone swipes; both motion settings), `case-study.mjs`, `fallbacks.mjs`, against the dev server.
- `node tests/e2e/perf.mjs` — production load check (longest main-thread task < 250 ms); needs `npm run build` + `npx vite preview --port 4173`. Dev builds keep shader error checks on, so `site.mjs` only holds dev to a looser bound.
- `node tests/e2e/_gpu.mjs [WxH]` — GPU ms of the scene pass per view (dev server). At 1920×1080 high tier it's < 0.5 ms; the post chain is most of the frame.
- No lint script.

## Working notes

- `prefers-reduced-motion: reduce` has masked real bugs twice in this project's history (an animation-cycle sync bug, a typewriter reveal) because the code disabled the whole feature under that setting instead of just the decorative motion. Always test both settings, not just default.
- **Read `RESTRUCTURE_PLAN.md` (repo root) first in any new session.** It's the checked-in, portable status/roadmap tracker for this restructure — the original plan files it was built from live outside the repo in a user-local folder and aren't visible to other sessions or collaborators. Keep it updated as work lands.
