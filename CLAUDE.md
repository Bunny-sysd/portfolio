# Aaron Alva Portfolio — CLAUDE.md

Single-page portfolio (`bunny-sysd.github.io/portfolio`) built as a scroll-driven "descent" film: a real Three.js sky/cloud/city scene scrubbed by native page scroll, with DOM chapter text crossfading in sync. Rebuilt from an earlier scroll-cylinder design (see `RESTRUCTURE_PLAN.md` Part 6, superseded) on branch `cinematic-descent`; design reference: activetheory.net.

## Stack

- Vite **6** (bumped for vitest 5) + **vitest 5** as the test runner, used as a real ES module build — **this is npm-package Three.js (`three` ^0.186) and npm-package `lenis` for smooth scroll, imported from `src/`, not CDN scripts.** `vite.config.js` sets `build.outDir: 'docs'` and `test.include: ['tests/unit/**/*.test.js']`.
- **Native scroll drives everything.** `html, body` scroll normally (no `overflow: hidden` trick); `src/scroll.js` wraps `window.scrollY` into a 0–1 `progress()` and, when `prefers-reduced-motion` is not set, layers [Lenis](https://github.com/darkroomengineering/lenis) on top for smooth/eased scrolling (`lenis.raf()` driven from the app's own rAF loop, not Lenis's `autoRaf`). Under reduced motion, `createScroll()` never instantiates Lenis — no `lenis` class ever lands on `<html>`, and scrolling is the browser's untouched native behavior.
- `src/timeline.js` is the **single source of truth** for every progress → value mapping used by both the DOM and the 3D scene: chapter `at` positions (`CHAPTERS`), palette keyframes (`paletteAt`), opacity curves (`heroOpacity`, `beatOpacity`, `contactOpacity`), camera altitude (`altitudeAt`), and cloud-layer handoff points (`CLOUD_LAYER_P`). Scene modules and `src/chapters.js` both import from here so they can never drift out of sync with each other.
- `src/tier.js` gates render quality once at load (`detectTier()` — GPU string sniff + `deviceMemory`/`hardwareConcurrency`/width) into `low`/`mid`/`high`, each with its own DPR cap, particle/light counts, and whether post-processing runs at all (`TIER_SETTINGS`).
- `playwright` is installed and used for all real-browser verification (`tests/e2e/*.mjs`) — screenshots, console/network inspection, scroll simulation via `window.scrollTo`, pixel sampling, WCAG contrast sampling. Headless Chromium defaults to a software GPU (SwiftShader) which the tier detector reads as `low`; e2e tests launch with real-GPU flags (`lib.mjs`'s `GPU_ARGS`: `--use-angle=d3d11 --ignore-gpu-blocklist --enable-gpu`) so post-processing and tier-dependent behavior render and assert correctly — the `fallbacks.mjs` no-WebGL case is the one deliberate exception, launched with `--disable-webgl --disable-3d-apis` instead.
- Chrome DevTools MCP has been connected and used successfully in past sessions (real Chrome, console + network inspection). It can develop a stuck browser-profile lock across session boundaries (`chrome-devtools-mcp` spawns its own background Chrome process, separate from the user's visible tabs) — if `list_pages`/`navigate_page` error with "browser is already running," don't try to kill Chrome processes to fix it (too many ambiguous `chrome.exe` processes to safely pick the right one) — just fall back to Playwright, which is equally capable here.

## File layout

- `index.html` (repo root) is the only HTML entry point. It loads the module graph via a single `<script type="module" src="/src/main.js"></script>` — no version-querystring cache-busting needed; Vite handles cache invalidation through content-hashed build output.
- **The old `app.js` / `three-bg.js` / `style.css` engine (root and `public/` copies) has been retired** — deleted in the Task 8 cleanup, after confirming nothing in `index.html` or `src/` referenced them. It remains recoverable from git history on `main` if ever needed for reference. Do not resurrect the root/`public/` duplication pattern for new work; `src/` is the only place application code lives now.
- `src/` module map:
  - `main.js` — entry point; wires scroll, chapters, case studies, contact form, and the scene together, and owns the single `requestAnimationFrame` loop (scroll tick → chapter opacity → scene update → render) plus an FPS watchdog that progressively degrades (pixel ratio → drop post-processing → one cloud sheet per layer, mirrored on `<html data-quality="full|reduced|no-post|minimal">`) only after two consecutive sub-42 fps windows; a window restarts on `visibilitychange` and on any >250 ms frame gap, so tab switches and one-off stalls never count. It also handles `webglcontextlost`/`restored` on the canvas (toggles `no-webgl`, pauses the scene) and adds `scene-live` to `<html>` after the first rendered frame.
  - `scroll.js` — `createScroll()`, the native-scroll/Lenis wrapper described above.
  - `timeline.js` — single source of truth for all progress-driven values (see Stack section).
  - `chapters.js` — `createChapters(doc, { scroll })`, maps timeline functions onto each beat's DOM element as a CSS custom property (`--o`), diffed per frame to avoid redundant style writes. Toggles `is-live` (o > 0.5) on every item — CSS gives beats `pointer-events` only while live and keeps `#to-top` `visibility: hidden` until live — and a `focusin` on a beat that isn't on screen calls `scroll.scrollToProgress(beat.at)` so keyboard focus is never invisible.
  - `tier.js` — device-capability tiering (see Stack section).
  - `case-ids.js`, `case-study.js` — case-study `<dialog>` open/close, deep-link hash routing (`#mutagen` etc. opens on load and on `hashchange`), pauses/resumes scroll while a dialog is open.
  - `contact.js` — builds the `mailto:` link for the contact form (real account: `aaron.lawrence.alva@gmail.com`).
  - `scene/` — the Three.js layer: `stage.js` (renderer/scene/camera bootstrap, WebGL-support probe, returns `null` on unsupported hardware — see Fallbacks below), `sky.js`, `camera.js`, `clouds.js`, `city.js`, `post.js` (bloom + film-grain finish, tier-gated, disposed in full by the FPS watchdog, not just the composer).
  - `widgets/` — small interactive pieces ported into the case-study dialogs (`phase-flow.js`, `commands.js` typewriter reveal, `ctf-tabs.js`).
  - `styles/` — `base.css` (page chrome, fallback gradient, `.to-top`), `chapters.css` (beat layout/typography, including a `max-height: 650px` short-viewport query), `case-study.css` (dialog styling).
- `docs/` is the gitignored build output — GitHub Actions builds and deploys it on push to `main`. Don't hand-edit it.
- `.agents/mcp_config.json` is gitignored and contains a live-looking API key/secret. Never `git add -f` it or echo its contents.

## Fallbacks

- **No WebGL / WebGL disabled**: `src/scene/stage.js`'s `createStage()` pre-flight-probes a throwaway `<canvas>` for a `webgl2`/`webgl` context before ever constructing `THREE.WebGLRenderer`. This matters because THREE's own renderer registers a `webglcontextcreationerror` listener and logs via `console.error` asynchronously on failure — that fires regardless of whether the constructor's synchronous throw is caught, so skipping construction entirely (rather than just wrapping it in `try`/`catch`) is what keeps a disabled-WebGL environment console-clean. `main.js` adds a `no-webgl` class to `<html>` when `createStage()` returns `null`; `base.css` then shows a static CSS gradient sky in place of the canvas and hides `.mist` — all chapter text and the contact form remain fully functional. The same class is set while the WebGL context is lost (and removed on restore). That dusk gradient (`--dusk`) is also the body's default background until `scene-live` is set, and `#hero` defaults to `--o: 1` in CSS (with `is-live` in the markup), so the hero reads before — or without — JavaScript.
- **`prefers-reduced-motion: reduce`**: Lenis is never instantiated (native scroll only); scene modules read the same `reducedMotion()` predicate to drop decorative-only motion (idle camera drift, cloud drift, etc.) while keeping scroll-driven state changes intact. Historically, earlier in this project reduced-motion handling masked real bugs twice by disabling a whole feature instead of just its decorative part — always test both settings when touching anything animated.
- Both fallback paths, WebGL context loss/restore, and the no-JavaScript hero are covered by `tests/e2e/fallbacks.mjs`.

## Content/copy

Mutagen and Vigil project copy has been corrected to match their real repos (`bunny-sysd/mutagen`, `bunny-sysd/vigil-hunter`) — real CLI commands, real pipeline phases, a dead GitHub link fixed. The skill-proficiency radar chart (implied numeric self-scoring) was replaced with a plain competency tag list. The old simulated widgets (fuzz-cycle simulator, CVSS calculator, candlestick chart, CTF puzzle, operator CLI explorer) were cut in the descent rebuild. What remains simulated is the console-style sample output inside the Vigil and CTF case-study dialogs, plus the unverified "14.2K Mutation Cycles" stat in the Who dialog — both flagged for Aaron to replace with real artifacts (spec Part 4), not yet done.

## Verified facts to use verbatim in copy (don't paraphrase/estimate)

- GIAC GFACT certified, issued 1 September 2026, scored 94. Credly: `https://www.credly.com/badges/e6b7f224-b57d-4224-9f7a-cabe2b3fb257`
- TryHackMe: Top 1%, 100+ rooms completed
- Hack The Box: handle `maxthemadman`, Apprentice tier, Level 25

## Commands

- `npm run dev` — Vite dev server (`127.0.0.1:5173`)
- `npm run build` — outputs to `docs/`
- `npm test` — `vitest run` over `tests/unit/**/*.test.js`. **Requires Node ≥22.12 locally** (vitest 5's floor). CI (GitHub Actions, Node 20) does not run this — it only runs `npm run build`, so a unit-test regression will not fail CI by itself; run `npm test` locally before trusting a change.
- `npm run e2e` — runs all four Playwright e2e files in sequence against the dev server (`content.mjs`, `scene.mjs`, `case-study.mjs`, `fallbacks.mjs`); each file can also be run individually with `node tests/e2e/<file>.mjs`. Needs the dev server up first (`npm run dev` in a separate terminal/background process).
- No lint script is defined in `package.json`.

## Working notes

- `prefers-reduced-motion: reduce` has masked real bugs twice in this project's history (an animation-cycle sync bug, a typewriter reveal) because the code disabled the whole feature under that setting instead of just the decorative motion. Always test both settings, not just default.
- **Read `RESTRUCTURE_PLAN.md` (repo root) first in any new session.** It's the checked-in, portable status/roadmap tracker for this restructure — the original plan files it was built from live outside the repo in a user-local folder and aren't visible to other sessions or collaborators. Keep it updated as work lands.
