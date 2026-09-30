# Cinematic Descent — Design

Rebuild of Aaron Alva's portfolio as a single scroll-driven "film": the
visitor starts above the clouds at dusk and descends through them, and each
layer passed reveals the next chapter, ending at a night city/network grid
where the contact form lives. Replaces the current 3D cylinder engine.

Status: design approved in brainstorming (2026-09-30). Visual decisions were
delegated to Claude by the user ("surprise me"); only this spec needs sign-off.

---

## Decisions already made (with the user)

| Question | Decision |
|---|---|
| Story | **"Going deeper."** Surface → depth mirrors security work (recon at the surface, exploitation deeper down). Never stated on the page; felt, not explained. |
| Overview page | **Merged into the first frame.** No gate, no "enter" button. Name + credentials readable at 0% scroll. "Back to overview" = scroll up, plus an always-visible top link. |
| Visuals | **Generated in code** (shaders), no external assets. One optional future slot: the opening sky could later be swapped for AI-generated (e.g. Higgsfield) footage — not built now. |
| Project detail | **Short chapter beat + "View case study"** overlay reusing existing drawer content. |
| Mood | **Dusk into night.** Warm sunset sky at the top, cooling through violet and indigo to deep navy, cyan city lights at the bottom. |
| Build | **Clean rebuild:** real native scroll, modern Three.js via Vite/npm, old engine retired. |

---

## 1. The film (scroll map)

Page height ≈ 9 viewport heights. `progress` = scroll position / max scroll, 0 → 1.

| progress | Scene | Content (DOM, over the canvas) |
|---|---|---|
| 0.00 | Above a sea of clouds, warm dusk sky, sun low on the horizon | **Hero/overview:** name, one-liner, 3 credential chips (GFACT, THM, HTB), Mutagen + Vigil links, email, "scroll" cue |
| ~0.10 | Camera sinks into the top cloud layer — brief soft white-out | none (the "entering" beat) |
| ~0.20 | Under layer 1, sky pink-violet | **Ch.1 Who** — short bio |
| ~0.33 | Violet, passing layer 2 | **Ch.2 Mutagen** |
| ~0.46 | Indigo, layer 3 | **Ch.3 Vigil** |
| ~0.59 | Deep navy, layer 4 | **Ch.4 SignalHub** |
| ~0.72 | Near-night, city lights appear far below through gaps | **Ch.5 Proving Grounds** (TryHackMe / HTB) |
| 0.85 → 1.00 | Below the clouds; glowing cyan city/network grid, camera levels out | **Landing: contact** — form, email, links |

Chapter text fades/rises in over ~0.04 progress as its beat arrives and fades
out as the next approaches, so only one chapter is readable at a time.

Content rule: all copy is carried over **verbatim** from the current
`index.html` (verified facts in `CLAUDE.md` — GFACT 94, THM Top 1% 100+ rooms,
HTB maxthemadman Apprentice L25, aaron.lawrence.alva@gmail.com). No new claims.

## 2. Visual system

- **Palette:** a vertical gradient keyed to `progress`. Stops (sky zenith →
  horizon): top `#2a1b3d → #f6b27a`, mid `#3b2a5c → #b56a8f`, deep
  `#0d1530 → #283a6b`, bottom `#02040a → #0b1a33`. City light accent `#7DD3FC`
  (the site's existing accent), warm window glints `#FCD34D` sparingly.
- **Type:** keep the site's existing faces — Syne (display headlines), Space
  Grotesk (body), JetBrains Mono (labels/eyebrows only). Large, confident
  headlines; body text never below 16px; generous line-height.
- **Text legibility over the sky:** each chapter block sits on a soft,
  heavily-blurred dark scrim (not a hard card) so text passes WCAG AA contrast
  against every part of the gradient.
- **Clouds:** layered large billboard sheets with an fbm-noise shader (soft
  edges, light from the sun direction, tinted by the current sky colour).
  Cheaper and more reliable than raymarched volumetrics, and reads as volume
  when the camera passes through layers at different depths. Passing *through*
  a layer triggers a short full-screen mist fade.
- **City/network grid (bottom):** a perspective grid plane plus scattered light
  points and a few slow-moving "packet" streaks along grid lines — the
  network-at-night payoff.
- **Finish:** gentle bloom on sun, city lights and packets only (text is DOM
  and never bloomed); subtle grain + vignette. Same lessons as the current
  engine: bloom composites from the glow-only buffer.

## 3. Architecture

Real native scroll. The WebGL canvas is `position: fixed` behind the page; the
page itself is normal HTML sections that scroll.

```
index.html              hero + 5 chapter sections + contact section + case-study <dialog>s
src/main.js             bootstrap: Lenis, GSAP ScrollTrigger, wires progress → scene + chapters
src/scroll.js           Lenis smooth scroll ↔ ScrollTrigger sync; exposes progress (0..1)
src/scene/renderer.js   renderer, resize, DPR cap, quality tier, render loop, post FX
src/scene/sky.js        gradient sky dome + sun, colours from progress
src/scene/clouds.js     cloud layer sheets + fbm shader + pass-through mist
src/scene/city.js       grid, lights, packet streaks
src/scene/camera.js     camera path: descent curve keyed to progress (+ tiny pointer parallax)
src/chapters.js         chapter enter/leave reveals (ScrollTrigger per section)
src/case-study.js       <dialog> open/close, pauses Lenis, runs the ported widgets
src/widgets/            ported from app.js: phase-flow pulse, typewriter command
                        blocks, copy-commands button, CTF machine tabs, contact form
src/styles/             base.css (tokens, type), chapters.css, case-study.css
```

Each scene module exports `create(scene, options)` returning
`{ update(progress, time), dispose() }` — independent and testable on its own.
`main.js` is the only module that knows about all of them.

**Dependencies (npm, bundled by Vite):** `three`, `gsap` (includes
ScrollTrigger), `lenis`. `playwright` stays as a dev tool.

**Retired:** `app.js`, `three-bg.js` (root and `public/` copies), the cylinder,
front-door gate, HUD/sidebar/dial, command palette, and their CSS in
`style.css`. The case-study content inside the six `drawer-*` panels is kept
and moved into the dialogs. Nothing is lost — all of it remains in git history
on `main`.

**Note:** the root/`public/` duplicate-file arrangement and `?v=` cache-bust
strings go away — Vite hashes bundled assets. `file://` direct-open is no
longer supported (the deployed site is always built by GitHub Actions).

## 4. Case studies

Each chapter's **View case study** opens a native `<dialog>` holding that
project's existing drawer content (overview, stats, phase-flow diagram,
commands, IDE panels, CTF tabs). Native dialog gives ESC-to-close, focus
trapping and an inert background for free. While open, Lenis is stopped so the
page underneath doesn't scroll; on close, the visitor is exactly where they
were in the descent. Deep link: `#mutagen` etc. opens the matching dialog on
load (cheap, and lets Aaron link a recruiter straight to a case study).

## 5. Mobile, small windows, accessibility

- Same film on phones: fewer cloud sheets (≈ half), DPR capped at 1.5 (1.0 on
  low tier), bloom off on low tier. Layout is single-column; chapter text
  anchored to the lower third so it never covers the whole sky.
- Breakpoints checked: 390, 768, 1280, 1600 px wide; also a short, wide
  window (1280×600).
- `prefers-reduced-motion`: Lenis disabled (plain native scroll), no pointer
  parallax, no cloud drift or packet animation; the descent itself still
  follows scroll (it is user-driven, not autonomous). Content never depends on
  animation finishing — lesson from this project's history.
- No WebGL / context lost: the canvas is hidden and a static CSS gradient of
  the same palette sits behind the page; every word of content still reads.
- All content is real DOM text: selectable, screen-reader and search friendly.

## 6. Performance budget

- 60 fps on a mid-range desktop GPU; ≥ 45 fps on a recent phone.
- Initial JS (gzipped) under ~250 KB including Three.js; no image/video assets.
- Render loop pauses when the tab is hidden; post FX drops first under the
  FPS watchdog, then cloud-sheet count.

## 7. Testing and verification

Playwright on the **real GPU** (`--use-angle=d3d11 --ignore-gpu-blocklist
--enable-gpu`; the default SwiftShader is classed as low tier and hides post
FX):

- Screenshots at progress 0, 0.1, 0.2 … 1.0 on desktop (1600×1000) and phone
  (390×844); visual review of every frame.
- Hero content readable at progress 0 with no interaction.
- Each "View case study" opens its dialog; ESC closes it and scroll position is
  unchanged; widgets (phase pulse, typewriter, CTF tabs) run inside.
- Deep link `#mutagen` opens the Mutagen dialog.
- Contact form builds the correct `mailto:`.
- Zero console errors/warnings; FPS sampled at the busiest point (cloud entry).
- Reduced-motion and no-WebGL fallbacks each checked once.
- `npm run build` succeeds and the built `docs/` output works.

## 8. Delivery

- Built on branch `cinematic-descent`; `main` (the live site) untouched until
  the user has seen it on the dev server and approved.
- A peer Claude session may take one self-contained module (e.g.
  `scene/clouds.js` against a standalone test page) in its own git worktree to
  avoid edit collisions; integration happens on this branch.
- Merge + push only on the user's explicit go-ahead.

## Out of scope

- AI-generated video (optional later swap for the opening sky only).
- Per-project 3D "signature scenes" like the old Mutagen halo — can return
  later as chapter embellishments once the film itself is solid.
- Part 4 real tool-run artifacts (still blocked on Aaron) — case-study dialogs
  are where they'll go when they exist.
