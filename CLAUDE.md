# Aaron Alva Portfolio — CLAUDE.md

Single-page portfolio (`bunny-sysd.github.io/portfolio`) built around a scroll-driven WebGL/Three.js scene. Design reference: activetheory.net.

## Stack

- Vite 5 + React 18 (`src/`) — the React island mounts **nothing**. All four mount targets (`react-hero-section`, `react-operational-specs`, `react-sys-armament`, `react-mutagen-card`) are absent from `index.html`, so `HeroSection.jsx`/`ActiveObjectives.jsx`/`SysArmament.jsx`/`MutagenCard.jsx` never render. `InteractiveBackground.jsx`/`OperationalSpecs.jsx` aren't even imported by `main.jsx`. ~1,250 lines of dead code.
- Three.js **r128** + GSAP **3.12.2** + **CustomEase**, loaded via CDN `<script>` tags — not npm packages, not ES modules. GSAP is genuinely used in `three-bg.js` (deep-dive open/close transition, a per-card cinematic "shot" timeline) — driven manually via `.time()`/`gsap.to()`, **not** native `ScrollTrigger` scroll detection, since the page has no real DOM scroll to attach to (`overflow: hidden !important` on `html, body`).
- `public/app.js` and `public/three-bg.js` are plain classic scripts carrying almost all real functionality. They are **not** part of the Vite module graph.
- Tailwind styles the (currently unmounted) React islands; `style.css` (loaded directly, not through Vite) styles everything else.
- `playwright` is installed **and working** — browsers are present (`chromium` installed this session) and have been used extensively for real-browser verification (screenshots, console/network inspection, scroll/hover simulation).
- Chrome DevTools MCP has been connected and used successfully in this session (real Chrome, console + network inspection). It can develop a stuck browser-profile lock across session boundaries (`chrome-devtools-mcp` spawns its own background Chrome process, separate from the user's visible tabs) — if `list_pages`/`navigate_page` error with "browser is already running," don't try to kill Chrome processes to fix it (too many ambiguous `chrome.exe` processes to safely pick the right one) — just fall back to Playwright, which is equally capable here.

## File layout — read before touching app.js / three-bg.js

- `index.html` (repo root) is the only HTML entry point. It references `three-bg.js`, `app.js`, and `style.css` with relative, unprefixed, version-querystring paths (e.g. `<script src="three-bg.js?v=10.0">`). **Bump the version query string on every edit to these files** — a stale cache once produced a false bug report this session.
- Byte-identical copies of `app.js`/`three-bg.js` exist at repo root **and** in `public/` — confirmed intentional (root copies serve `file://` direct-open; `public/` is what Vite dev/build actually serves). Keep both in sync on every edit (`Compare-Object`/`diff` after copying) — this project has caused real bugs before when they drifted.
- `docs/` is the gitignored build output — GitHub Actions builds and deploys it on push to `main`. Don't hand-edit it.
- `.agents/mcp_config.json` is gitignored and contains a live-looking API key/secret. Never `git add -f` it or echo its contents.

## 3D engine (`public/three-bg.js`, ~2,760 lines as of this session's work)

- Entry IIFE: `initActiveTheoryHelicalEngine()`.
- Main container is `tubeRigGroup` (a child group of `rootGroup`) — spine, claw head, and cards all live under it, moved by one shared scroll-driven transform. This was recovered from a local-only `current-code` git branch that had diverged from `main` and ported back in.
- **Real spherical/orbital camera**: `camera.position` is computed every frame from spherical coordinates around a moving `heroAnchor` (azimuth/elevation blended from pointer position + idle drift + scroll-derived descent), with a genuine `camera.lookAt()` call. Not a simple Z/Y lerp.
- **Cinematic GSAP layer** (this session): `CustomEase`-authored eases (`cinematicSilk`, `cinematicFlow`, `cinematicArrive`); the deep-dive open/close transition is a real `gsap.to()` tween (not a fixed-rate lerp); a per-card `cinematicTimeline` adds small additive camera/lookAt offsets as each card centers, scrubbed via `cinematicTimeline.time(scrollProgress)`. All of this is additive on top of the existing orbit math — the orbit itself, the wheel/drag input pipeline, the velocity model, and the snap-to-station logic are untouched by it.
- **Scroll snap-to-card**: once wheel/drag velocity settles, `targetScroll` eases onto the nearest integer station (one per card) rather than resting at an arbitrary position between two cards.
- **Hover parallax is damped**, not raw: pointer coordinates are smoothed (`smoothMouse`) and each card's hover state is eased through a `hoverWeight` (not a boolean flip) before being applied to rotation — fixes a real bug where fast cursor movement visibly warped a card mid-hover.
- The claw is a real multi-piece mechanical assembly (`clawHeadGroup`, `clawFingerGeos`, knuckle meshes).
- `isMobile` is computed once via UA sniff + width check and gates particle counts, drag sensitivity, orbit radius, FOV, and other per-frame constants — **not** just CSS breakpoints. Note: the `resize` handler updates FOV live but does not re-derive the other `isMobile`-gated constants, so those stay frozen at load-time viewport width even across a breakpoint-crossing resize. Pre-existing behavior, not something to silently "fix" without deciding to.
- Cards are drawn via Canvas 2D (`generateCardTexture()`, ~1024×1380 canvas) into a `THREE.CanvasTexture` on a plane mesh — **not** DOM elements. CSS (`backdrop-filter` etc.) cannot apply to them directly.

## `public/app.js`

- The duplicate contact-handler bug (two blocks binding `contactTransmitBtn` to two different `mailto:` addresses) is **fixed** — the dead handler (referenced a `contactCipherBlock` element that doesn't exist in current markup) was removed; the surviving one mails `aaronalva@yahoo.com`, matching what's shown elsewhere on the site.
- A dead `initGSAP()` block (targeting `.section-title`/`.bento-project-card`/`.bento-skill-box` with `ScrollTrigger` + the default window scroller) has been removed — those classes don't exist anywhere in `index.html` (leftover from an earlier bento-grid design later replaced by the 6-card cylinder). A wider family of `.bento-*`-scoped dead code still exists elsewhere in `app.js` — noted, not yet cleaned up.

## Content/copy

Mutagen and Vigil project copy has been corrected to match their real repos (`bunny-sysd/mutagen`, `bunny-sysd/vigil-hunter`) — real CLI commands, real pipeline phases, a dead GitHub link fixed. The skill-proficiency radar chart (implied numeric self-scoring) was replaced with a plain competency tag list. Several interactive widgets are still simulated/mocked rather than showing real tool output (fuzz-cycle simulator, CVSS calculator, candlestick chart, CTF puzzle, operator CLI explorer) — flagged for a future pass to replace with real artifacts, not yet done.

## Verified facts to use verbatim in copy (don't paraphrase/estimate)

- GIAC GFACT certified, issued 1 September 2026, scored 94. Credly: `https://www.credly.com/badges/e6b7f224-b57d-4224-9f7a-cabe2b3fb257`
- TryHackMe: Top 1%, 91 rooms completed
- Hack The Box: handle `maxthemadman`, Apprentice tier, Level 25

## Commands

- `npm run dev` — Vite dev server (`127.0.0.1:5173`)
- `npm run build` — outputs to `docs/`
- No test/lint script is defined in `package.json`.

## Working notes

- `prefers-reduced-motion: reduce` has masked real bugs twice this session (an animation-cycle sync bug, a typewriter reveal) because the code disabled the whole feature under that setting instead of just the decorative motion. Always test both settings, not just default.
- Active plans: `C:\Users\Azure12\.claude\plans\keen-chasing-blum.md` (front door / real-artifacts / minimalist-retheme restructure) and `C:\Users\Azure12\.claude\plans\pure-orbiting-sun.md` (cinematic scroll choreography — completed).
