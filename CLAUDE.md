# Aaron Alva Portfolio — CLAUDE.md

Single-page portfolio (`bunny-sysd.github.io/portfolio`) built around a scroll-driven WebGL/Three.js scene. Design reference: activetheory.net.

## Stack

- Vite 5 + React 18 (`src/`) for a small set of UI "islands" only.
- Three.js **r128** + GSAP **3.12.2** (with ScrollTrigger), loaded via CDN `<script>` tags — not npm packages, not ES modules.
- `public/app.js` and `public/three-bg.js` are plain classic scripts carrying almost all real functionality: the 3D engine, scroll/card system, HUD, command palette, contact form, CTF puzzle, etc. They are **not** part of the Vite module graph.
- Tailwind (`tailwind.config.js`, `postcss.config.js`) styles the React islands; `style.css` (loaded directly, not through Vite) styles everything else.
- `package.json` also lists `playwright` as a dependency — present but browsers are **not installed** (`~/AppData/Local/ms-playwright` does not exist). Run `npx playwright install chromium` before it can drive a real browser.

## Why plain scripts, not ES modules

`.agents/AGENTS.md` documents the reason (gitignored, but worth knowing): CDN-loaded globals (`THREE`, `gsap`) load before any `type="module"` script would execute if `app.js`/`three-bg.js` were converted to modules or imported into the React tree — that ordering bug bit this project before. Keep them as root-relative `<script src="...">` tags after the CDN tags in `index.html`.

## File layout — read before touching app.js / three-bg.js

- `index.html` (repo root) is the only HTML entry point. It references `three-bg.js`, `app.js`, and `style.css` with **relative, unprefixed paths** (e.g. `<script src="three-bg.js?v=9.8">`).
- Because of that, identical copies of `app.js`, `three-bg.js` (and `style.css`, `index.html` itself is obviously singular) currently exist **both at repo root and in `public/`** — confirmed byte-identical, same mtime, as of 2026-09-07. This looks like it may support both `file://` direct-open (needs root-relative files on disk) and `npm run dev`/`vite build` (which only ever copies `public/*` into the output — `vite build` does not pick up root-level `app.js`/`three-bg.js` for the `docs/` output).
- Despite that plausible reason, this is exactly the "root-level duplicate" situation a prior round of this project says it already cleaned up once. **Don't assume which copy is canonical — ask before editing.** If you edit one, keep the other in sync (or ask whether to eliminate the duplication) until this is resolved with the user.
- `docs/` is the build output directory (`vite.config.js` → `build.outDir: 'docs'`), gitignored, not deployed from directly — GitHub Actions (`.github/workflows/deploy.yml`) runs `npm run build` and uploads `docs/` as the Pages artifact on every push to `main`. Don't hand-edit `docs/`.
- `.agents/mcp_config.json` is gitignored and currently contains a live-looking API key/secret for an MCP server. It won't be committed, but don't `git add -f` it or echo its contents anywhere.

## 3D engine (`public/three-bg.js`, ~1475 lines)

- Entry IIFE: `initActiveTheoryHelicalEngine()`.
- Main container: `rootGroup` (not `tubeRigGroup` — if you're told to look for a `tubeRigGroup`, it doesn't exist under that name; verify current naming with a grep before assuming prior-session descriptions are accurate).
- `camera` is a single `THREE.PerspectiveCamera`; as of 2026-09-07 its only per-frame movement is a Z/Y lerp toward `targetCameraZ`/`targetCameraY` (~line 1296-1297). There is no spherical/orbital camera math, no pointer-driven orbit sweep, and no `camera.lookAt()` call anywhere in the file. Treat any claim that an orbital camera is "already built" as unverified until you check this file again.
- The claw is real: `clawHeadGroup`, `clawHub`, `clawFingerGeos`, multiple knuckle meshes — a multi-piece mechanical assembly, not flat plates.
- `isMobile` is computed once via UA sniff + width check and does gate some behavior (particle counts, `glitterMat.size`, FOV).

## `public/app.js` (~3173 lines)

- Contains the contact-form handler, HUD/nav wiring, command palette, CTF cipher-puzzle checker, theme switching, etc.
- **Known bug**: two separate blocks both do `document.getElementById('contactTransmitBtn')` (around line 1762 and line 3511) and build different `mailto:` links to two different addresses (`aaron.lawrence.alva@gmail.com` vs `aaronalva@yahoo.com`). Whichever binds last wins at runtime — this needs a decision from the user on which block (and which email) is correct, then the other should be removed rather than patched in place.

## Content/copy note

`index.html` currently contains material that reads as deep low-level technical detail (a heap-buffer-overflow C case study with real code, ASan/SIGSEGV traces, a live fuzzer-cycle simulator, a 5-axis skill proficiency radar canvas, a CVSS v3.1 calculator with sliders, a live market candlestick chart, an in-browser CTF flag-decode puzzle). If you're told any of this was already simplified/removed for a general/recruiter audience, verify against the live file first — don't assume.

## Verified facts to use verbatim in copy (don't paraphrase/estimate)

- GIAC GFACT certified, issued 1 September 2026, scored 94. Credly: `https://www.credly.com/badges/e6b7f224-b57d-4224-9f7a-cabe2b3fb257`
- TryHackMe: Top 1%, 91 rooms completed
- Hack The Box: handle `maxthemadman`, Apprentice tier, Level 25

## Commands

- `npm run dev` — Vite dev server (`127.0.0.1:5173`)
- `npm run build` — outputs to `docs/`
- No test/lint script is defined in `package.json`.

## Verification tooling available in this environment

- No Chrome DevTools MCP server is connected here. The `claude-in-chrome` skill (controls the user's actual Chrome via an extension) and a local `playwright` dependency (browsers not yet installed) are the available options for real screenshot verification — pick one with the user before claiming visual/scroll behavior works.
