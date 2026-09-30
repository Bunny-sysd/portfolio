# Cinematic Descent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 3D cylinder portfolio with a scroll-driven "descent" film — dusk sky above the clouds, down through cloud layers, landing on a night network grid — with one chapter per layer and case studies in native dialogs.

**Architecture:** Real native scroll (smoothed by Lenis) produces a single `progress` value 0→1. A fixed WebGL canvas (Three.js, bundled by Vite) renders sky, clouds, city and a camera path as pure functions of `progress`; content is normal DOM laid out along a tall scroll track and faded by the same `progress`. All progress→value math lives in one pure, unit-tested module (`src/timeline.js`).

**Tech Stack:** Vite 5, Three.js (npm, current), Lenis (npm), Vitest (unit), Playwright library scripts (e2e, real GPU).

**Spec:** `specs/2026-09-30-cinematic-descent-design.md`

## Global Constraints

- Branch: `cinematic-descent`. Never commit to or push `main`; merge/push only on the user's explicit go-ahead.
- Copy: carried over **verbatim** from the current site. No new claims. Verified facts: GIAC GFACT certified, scored 94 (Credly `https://www.credly.com/badges/e6b7f224-b57d-4224-9f7a-cabe2b3fb257`); TryHackMe Top 1%, 100+ rooms (`https://tryhackme.com/p/354221973`); Hack The Box `maxthemadman`, Apprentice, Level 25 (`https://app.hackthebox.com/users/3735054`); email `aaron.lawrence.alva@gmail.com`; GitHub `https://github.com/Bunny-sysd`; Mutagen `https://github.com/bunny-sysd/mutagen`; Vigil `https://github.com/Bunny-sysd/vigil-hunter`.
- Do **not** reuse unverified numbers from the old site (e.g. "14.2K Mutation Cycles", "88.4% branch cov") in new chapter copy. They may remain inside moved case-study content, unchanged, as before.
- Palette stops (sRGB hex, `progress`: zenith / horizon): 0.00 `#2a1b3d`/`#f6b27a`; 0.33 `#3b2a5c`/`#b56a8f`; 0.62 `#0d1530`/`#283a6b`; 1.00 `#02040a`/`#0b1a33`. Accent `#7DD3FC`, warm glints `#FCD34D`.
- Fonts: Syne (display), Space Grotesk (body, ≥16px), JetBrains Mono (labels only).
- `prefers-reduced-motion`: no Lenis, no pointer parallax, no drift/twinkle/packets; the scroll-driven descent and all content still work.
- No WebGL → `html.no-webgl`: static CSS gradient, all content readable.
- Playwright must launch with `args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu']` (default SwiftShader is classified "low" and skips post FX).
- GSAP from the spec is **not** added: `progress` is a direct function of scroll, and all easing lives in `timeline.js` — one fewer dependency (YAGNI).
- Commit message trailer on every commit:
  ```
  Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01VGtanyW619vSEZMoDQwxw1
  ```

## File Map

| File | Responsibility |
|---|---|
| `src/timeline.js` | Pure: chapter beats, palette, opacity curves, altitude curve, cloud layer heights |
| `src/tier.js` | Pure: GPU/device → quality tier + per-tier settings |
| `src/contact.js` | Pure: `buildMailto` |
| `src/case-ids.js` | Pure: case-study ids + `caseIdFromHash` |
| `src/scroll.js` | Lenis wrapper → `progress()`, `stop()`, `start()`, `scrollToProgress()` |
| `src/chapters.js` | Writes `--o` opacity on each beat from `progress` |
| `src/scene/stage.js` | Renderer, scene, camera, tier |
| `src/scene/sky.js` | Sky dome + sun, palette from progress |
| `src/scene/camera.js` | Descent path + pointer parallax |
| `src/scene/clouds.js` | Cloud sheets (fbm shader) + mist amount |
| `src/scene/city.js` | Network grid, lights, packets |
| `src/scene/post.js` | Bloom + grain/vignette + OutputPass |
| `src/case-study.js` | `<dialog>` open/close, Lenis pause, deep links, widget start/stop |
| `src/widgets/phase-flow.js`, `commands.js`, `ctf-tabs.js` | Ported from `app.js` |
| `src/main.js` | Wires everything; the only module that knows all others |
| `src/styles/base.css`, `chapters.css`, `case-study.css` | Styles |
| `index.html` | Rewritten: hero, 5 chapters, contact, 5 case-study dialogs |
| `tests/unit/*.test.js` | Vitest |
| `tests/e2e/lib.mjs` + `*.mjs` | Playwright scripts (require `npm run dev` running) |

---

### Task 1: Toolchain and the pure core

**Files:**
- Modify: `package.json`, `vite.config.js`, `.gitignore`
- Create: `src/timeline.js`, `src/tier.js`, `src/contact.js`, `src/case-ids.js`
- Test: `tests/unit/timeline.test.js`, `tests/unit/tier.test.js`, `tests/unit/contact.test.js`

**Interfaces:**
- Produces:
  - `timeline.js`: `CHAPTERS: {id:string, at:number}[]`, `CLOUD_LAYER_P: number[]`, `clamp01(x)`, `smoothstep(e0,e1,x)`, `hexToRgb(hex) → [r,g,b]` (0..1), `paletteAt(p) → {zenith:[r,g,b], horizon:[r,g,b]}` (sRGB 0..1), `beatOpacity(p, at)`, `heroOpacity(p)`, `contactOpacity(p)`, `altitudeAt(p) → number`, `ALTITUDE_TOP`, `ALTITUDE_BOTTOM`, `cityReveal(p)`
  - `tier.js`: `detectTier({gpu, memory, cores, width}) → 'low'|'mid'|'high'`, `TIER_SETTINGS[tier] → {dprCap, sheetsPerLayer, postFX, cityLights}`
  - `contact.js`: `CONTACT_EMAIL`, `buildMailto(name, message) → string`
  - `case-ids.js`: `CASE_IDS: string[]`, `caseIdFromHash(hash) → string|null`

- [ ] **Step 1: Install dependencies and add scripts**

```bash
npm install three lenis
npm install -D vitest
```
Edit `package.json` `"scripts"` to:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "test": "vitest run",
  "e2e": "node tests/e2e/content.mjs && node tests/e2e/scene.mjs && node tests/e2e/case-study.mjs && node tests/e2e/fallbacks.mjs"
}
```
Append to `.gitignore`: `test-results/`

Replace `vite.config.js` with:
```js
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { outDir: 'docs' },
  server: { port: 5173, strictPort: false, host: '127.0.0.1' },
  test: { include: ['tests/unit/**/*.test.js'], environment: 'node' }
});
```

- [ ] **Step 2: Write the failing tests**

`tests/unit/timeline.test.js`:
```js
import { describe, it, expect } from 'vitest';
import {
  CHAPTERS, CLOUD_LAYER_P, hexToRgb, paletteAt, beatOpacity, heroOpacity,
  contactOpacity, altitudeAt, ALTITUDE_TOP, ALTITUDE_BOTTOM, cityReveal
} from '../../src/timeline.js';

const lum = ([r, g, b]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

describe('palette', () => {
  it('hits the exact stops at the ends', () => {
    expect(paletteAt(0).zenith).toEqual(hexToRgb('#2a1b3d'));
    expect(paletteAt(0).horizon).toEqual(hexToRgb('#f6b27a'));
    expect(paletteAt(1).zenith).toEqual(hexToRgb('#02040a'));
    expect(paletteAt(1).horizon).toEqual(hexToRgb('#0b1a33'));
  });
  it('gets darker as you descend', () => {
    expect(lum(paletteAt(0.8).horizon)).toBeLessThan(lum(paletteAt(0.1).horizon));
  });
  it('clamps out-of-range progress', () => {
    expect(paletteAt(-1)).toEqual(paletteAt(0));
    expect(paletteAt(2)).toEqual(paletteAt(1));
  });
});

describe('beats', () => {
  it('is fully visible on its beat and gone far from it', () => {
    expect(beatOpacity(0.33, 0.33)).toBe(1);
    expect(beatOpacity(0.53, 0.33)).toBe(0);
    expect(beatOpacity(0.30, 0.33)).toBeCloseTo(beatOpacity(0.36, 0.33), 6);
  });
  it('never shows two chapters strongly at once', () => {
    for (let p = 0; p <= 1; p += 0.001) {
      const strong = CHAPTERS.filter((c) => beatOpacity(p, c.at) > 0.5).length;
      expect(strong).toBeLessThanOrEqual(1);
    }
  });
  it('hero leaves before chapter 1 and contact arrives after chapter 5', () => {
    expect(heroOpacity(0)).toBe(1);
    expect(heroOpacity(CHAPTERS[0].at - 0.07)).toBe(0);
    expect(contactOpacity(CHAPTERS.at(-1).at + 0.07)).toBe(0);
    expect(contactOpacity(1)).toBe(1);
  });
});

describe('descent', () => {
  it('starts high, ends low, always going down', () => {
    expect(altitudeAt(0)).toBe(ALTITUDE_TOP);
    expect(altitudeAt(1)).toBe(ALTITUDE_BOTTOM);
    let prev = Infinity;
    for (let p = 0; p <= 1.0001; p += 0.01) {
      const y = altitudeAt(Math.min(p, 1));
      expect(y).toBeLessThanOrEqual(prev);
      prev = y;
    }
  });
  it('passes each cloud layer between chapters, never on a chapter beat', () => {
    for (const lp of CLOUD_LAYER_P) {
      for (const c of CHAPTERS) expect(beatOpacity(lp, c.at)).toBeLessThan(0.6);
    }
  });
  it('reveals the city only near the end', () => {
    expect(cityReveal(0.3)).toBe(0);
    expect(cityReveal(1)).toBe(1);
  });
});
```

`tests/unit/tier.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { detectTier, TIER_SETTINGS } from '../../src/tier.js';

describe('detectTier', () => {
  it('treats software renderers as low', () => {
    expect(detectTier({ gpu: 'ANGLE (Google, Vulkan (SwiftShader Device))' })).toBe('low');
    expect(detectTier({ gpu: 'llvmpipe (LLVM 15)' })).toBe('low');
  });
  it('treats weak devices as low', () => {
    expect(detectTier({ gpu: 'Apple GPU', memory: 2 })).toBe('low');
    expect(detectTier({ gpu: 'Apple GPU', cores: 2 })).toBe('low');
  });
  it('uses mid for phones and high for desktops', () => {
    expect(detectTier({ gpu: 'Apple GPU', width: 390 })).toBe('mid');
    expect(detectTier({ gpu: 'NVIDIA GeForce RTX 5060 Ti', width: 1600 })).toBe('high');
  });
  it('has settings for every tier', () => {
    for (const t of ['low', 'mid', 'high']) expect(TIER_SETTINGS[t].dprCap).toBeGreaterThan(0);
    expect(TIER_SETTINGS.low.postFX).toBe(false);
  });
});
```

`tests/unit/contact.test.js`:
```js
import { describe, it, expect } from 'vitest';
import { buildMailto, CONTACT_EMAIL } from '../../src/contact.js';
import { caseIdFromHash } from '../../src/case-ids.js';

describe('buildMailto', () => {
  it('addresses the real inbox and encodes subject/body', () => {
    const url = buildMailto('Alex', 'Hi there & welcome');
    expect(url.startsWith(`mailto:${CONTACT_EMAIL}?`)).toBe(true);
    expect(CONTACT_EMAIL).toBe('aaron.lawrence.alva@gmail.com');
    expect(decodeURIComponent(url)).toContain('[Portfolio] Message from Alex');
    expect(decodeURIComponent(url)).toContain('Hi there & welcome');
  });
  it('falls back to Anonymous', () => {
    expect(decodeURIComponent(buildMailto('   ', 'x'))).toContain('from Anonymous');
  });
});

describe('caseIdFromHash', () => {
  it('accepts known ids only', () => {
    expect(caseIdFromHash('#mutagen')).toBe('mutagen');
    expect(caseIdFromHash('#proving-grounds')).toBe('proving-grounds');
    expect(caseIdFromHash('#nope')).toBe(null);
    expect(caseIdFromHash('')).toBe(null);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — cannot resolve `../../src/timeline.js` (and the other modules).

- [ ] **Step 4: Implement the pure modules**

`src/timeline.js`:
```js
// Every progress → value mapping for the descent lives here, so scene,
// camera and DOM always agree on where each beat is.
export const CHAPTERS = [
  { id: 'who', at: 0.20 },
  { id: 'mutagen', at: 0.33 },
  { id: 'vigil', at: 0.46 },
  { id: 'signalhub', at: 0.59 },
  { id: 'proving-grounds', at: 0.72 },
];

// Cloud layers are passed between beats: entry, then the midpoints.
export const CLOUD_LAYER_P = [0.10, 0.265, 0.395, 0.525, 0.655];

const PALETTE = [
  { p: 0.00, zenith: '#2a1b3d', horizon: '#f6b27a' },
  { p: 0.33, zenith: '#3b2a5c', horizon: '#b56a8f' },
  { p: 0.62, zenith: '#0d1530', horizon: '#283a6b' },
  { p: 1.00, zenith: '#02040a', horizon: '#0b1a33' },
];

export const clamp01 = (x) => Math.min(1, Math.max(0, x));

export function smoothstep(e0, e1, x) {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
}

export function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

export function paletteAt(p) {
  p = clamp01(p);
  let i = 0;
  while (i < PALETTE.length - 2 && p > PALETTE[i + 1].p) i++;
  const a = PALETTE[i];
  const b = PALETTE[i + 1];
  const t = smoothstep(a.p, b.p, p);
  return {
    zenith: mix(hexToRgb(a.zenith), hexToRgb(b.zenith), t),
    horizon: mix(hexToRgb(a.horizon), hexToRgb(b.horizon), t),
  };
}

// 1 within `hold` of the beat, fading to 0 over `fade` on either side.
export function beatOpacity(p, at, hold = 0.025, fade = 0.035) {
  return 1 - smoothstep(hold, hold + fade, Math.abs(p - at));
}

export const heroOpacity = (p) => 1 - smoothstep(0.03, 0.08, p);
export const contactOpacity = (p) => smoothstep(0.84, 0.9, p);
export const cityReveal = (p) => smoothstep(0.62, 0.85, p);

export const ALTITUDE_TOP = 50;
export const ALTITUDE_BOTTOM = -45;

// Half linear, half smoothstep: never stalls, but starts and lands gently.
export function altitudeAt(p) {
  const t = clamp01(p);
  const ease = (t + smoothstep(0, 1, t)) / 2;
  return ALTITUDE_TOP + (ALTITUDE_BOTTOM - ALTITUDE_TOP) * ease;
}
```

`src/tier.js`:
```js
const SOFTWARE_OR_WEAK_GPU = /swiftshader|llvmpipe|software|mali-4|mali-t6|powervr sgx|adreno \(tm\) [23]\d\d/i;

export function detectTier({ gpu = '', memory = 8, cores = 8, width = 1600 } = {}) {
  if (SOFTWARE_OR_WEAK_GPU.test(gpu) || memory <= 2 || cores <= 2) return 'low';
  if (width < 768) return 'mid';
  return 'high';
}

export const TIER_SETTINGS = {
  low:  { dprCap: 1.0, sheetsPerLayer: 1, postFX: false, cityLights: 250 },
  mid:  { dprCap: 1.5, sheetsPerLayer: 2, postFX: true,  cityLights: 500 },
  high: { dprCap: 2.0, sheetsPerLayer: 3, postFX: true,  cityLights: 900 },
};
```

`src/contact.js`:
```js
export const CONTACT_EMAIL = 'aaron.lawrence.alva@gmail.com';

// Honest about what it is: this opens the visitor's own mail app.
export function buildMailto(name, message) {
  const sender = name.trim() || 'Anonymous';
  const subject = encodeURIComponent(`[Portfolio] Message from ${sender}`);
  const body = encodeURIComponent(`From: ${sender}\n\n${message.trim()}`);
  return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
}
```

`src/case-ids.js`:
```js
export const CASE_IDS = ['who', 'mutagen', 'vigil', 'signalhub', 'proving-grounds'];

export function caseIdFromHash(hash) {
  const id = (hash || '').replace(/^#/, '');
  return CASE_IDS.includes(id) ? id : null;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS, 3 files, all green.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vite.config.js .gitignore src tests/unit
git commit -m "feat(descent): toolchain and pure timeline/tier/contact core"
```

---

### Task 2: Page, content, styles and scroll-driven chapters

**Files:**
- Rewrite: `index.html`
- Create: `src/main.js`, `src/scroll.js`, `src/chapters.js`, `src/styles/base.css`, `src/styles/chapters.css`
- Test: `tests/e2e/lib.mjs`, `tests/e2e/content.mjs`

**Interfaces:**
- Consumes: `CHAPTERS`, `beatOpacity`, `heroOpacity`, `contactOpacity` (Task 1); `buildMailto` (Task 1)
- Produces:
  - `scroll.js`: `createScroll({ reducedMotion: () => boolean }) → { raf(ms), progress() → 0..1, stop(), start(), scrollToProgress(p) }`
  - `chapters.js`: `createChapters(doc) → { update(p) }` — sets CSS var `--o` on `#hero`, `#chapter-<id>`, `#contact`, `#to-top`
  - DOM ids later tasks rely on: `#scene` (canvas), `.mist`, `#hero`, `#chapter-{who,mutagen,vigil,signalhub,proving-grounds}`, `#contact`, `#contact-form`, `#to-top`, buttons `[data-case="<id>"]`

- [ ] **Step 1: Write the e2e harness and failing content test**

`tests/e2e/lib.mjs`:
```js
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

export const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
export const GPU_ARGS = ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu'];
export const SHOTS = 'test-results/shots';
mkdirSync(SHOTS, { recursive: true });

export function check(cond, msg) {
  if (cond) console.log('ok  ', msg);
  else { console.error('FAIL', msg); process.exitCode = 1; }
}

export async function withPage(ctxOpts, fn, launchArgs = GPU_ARGS) {
  const browser = await chromium.launch({ args: launchArgs });
  const page = await browser.newPage(ctxOpts);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  try {
    await page.goto(BASE, { waitUntil: 'load' });
    await page.waitForTimeout(600);
    await fn(page, errors);
  } finally {
    await browser.close();
  }
}

export async function scrollToProgress(page, p, settleMs = 900) {
  await page.evaluate((p) => {
    const max = document.documentElement.scrollHeight - innerHeight;
    window.scrollTo(0, Math.round(p * max));
  }, p);
  await page.waitForTimeout(settleMs);
}

export const opacityOf = (page, sel) =>
  page.$eval(sel, (el) => parseFloat(getComputedStyle(el).opacity));

// Sample a screen pixel from a real screenshot (the WebGL buffer isn't preserved).
export async function pixel(page, x, y) {
  const b64 = (await page.screenshot()).toString('base64');
  return page.evaluate(async ({ b64, x, y }) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = new OffscreenCanvas(img.width, img.height);
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    return Array.from(g.getImageData(x, y, 1, 1).data.slice(0, 3));
  }, { b64, x, y });
}
```

`tests/e2e/content.mjs`:
```js
import { withPage, check, scrollToProgress, opacityOf, SHOTS } from './lib.mjs';

const CHAPTER_AT = { who: 0.20, mutagen: 0.33, vigil: 0.46, signalhub: 0.59, 'proving-grounds': 0.72 };

for (const viewport of [{ width: 1600, height: 1000 }, { width: 390, height: 844 }]) {
  await withPage({ viewport }, async (page, errors) => {
    const tag = `${viewport.width}`;
    check(await page.textContent('#hero h1') === 'Aaron Alva', `[${tag}] hero name`);
    check((await page.textContent('#hero')).includes('Scored 94'), `[${tag}] GFACT credential in hero`);
    check((await page.textContent('#hero')).includes('100+ Rooms'), `[${tag}] THM credential in hero`);
    check(await opacityOf(page, '#hero') > 0.95, `[${tag}] hero visible at load, no interaction`);
    await page.screenshot({ path: `${SHOTS}/content-${tag}-hero.png` });

    for (const [id, at] of Object.entries(CHAPTER_AT)) {
      await scrollToProgress(page, at);
      check(await opacityOf(page, `#chapter-${id}`) > 0.9, `[${tag}] ${id} visible on its beat`);
      check(await opacityOf(page, '#hero') < 0.05, `[${tag}] hero gone at ${id}`);
    }
    await scrollToProgress(page, 1);
    check(await opacityOf(page, '#contact') > 0.95, `[${tag}] contact visible at the bottom`);
    check(await page.$('#contact-form') !== null, `[${tag}] contact form present`);
    await page.screenshot({ path: `${SHOTS}/content-${tag}-contact.png` });

    await page.click('#to-top');
    await page.waitForTimeout(1800);
    check(await opacityOf(page, '#hero') > 0.95, `[${tag}] "overview" link returns to the hero`);
    check(errors.length === 0, `[${tag}] no console errors ${JSON.stringify(errors)}`);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run (dev server running in another terminal: `npm run dev`): `node tests/e2e/content.mjs`
Expected: FAIL / throws — `#hero h1` not found (old page).

- [ ] **Step 3: Rewrite `index.html`**

Keep the `<head>` meta block from `main` (`git show main:index.html`, lines 5–21: charset through `twitter:image`) verbatim, then:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <!-- lines 5–21 of main:index.html (meta/og/twitter tags) go here unchanged -->
  <meta name="theme-color" content="#2a1b3d" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Space+Grotesk:wght@400;500;600&family=JetBrains+Mono:wght@400;500;700&display=swap" />
</head>
<body>
  <canvas id="scene" aria-hidden="true"></canvas>
  <div class="mist" aria-hidden="true"></div>
  <a id="to-top" class="to-top beat-ctl" href="#top">Overview ↑</a>

  <main class="track" id="top">
    <section id="hero" class="beat hero" style="--at: 0">
      <div class="beat__inner">
        <p class="eyebrow">Cybersecurity Researcher · Canada</p>
        <h1>Aaron Alva</h1>
        <p class="lede">Grade 11 · Building security automation tools &amp; vulnerability research</p>
        <ul class="creds">
          <li><a href="https://www.credly.com/badges/e6b7f224-b57d-4224-9f7a-cabe2b3fb257" target="_blank" rel="noopener noreferrer"><span>GIAC GFACT</span>Certified · Scored 94</a></li>
          <li><a href="https://tryhackme.com/p/354221973" target="_blank" rel="noopener noreferrer"><span>TryHackMe</span>Top 1% · 100+ Rooms</a></li>
          <li><a href="https://app.hackthebox.com/users/3735054" target="_blank" rel="noopener noreferrer"><span>Hack The Box</span>maxthemadman · Apprentice L25</a></li>
        </ul>
        <p class="hero-links">
          <a href="https://github.com/bunny-sysd/mutagen" target="_blank" rel="noopener noreferrer">Mutagen ↗</a>
          <a href="https://github.com/Bunny-sysd/vigil-hunter" target="_blank" rel="noopener noreferrer">Vigil ↗</a>
          <a href="mailto:aaron.lawrence.alva@gmail.com">aaron.lawrence.alva@gmail.com</a>
        </p>
        <p class="scroll-cue" aria-hidden="true">Scroll to descend</p>
      </div>
    </section>

    <section id="chapter-who" class="beat" style="--at: 0.20">
      <div class="beat__inner">
        <p class="eyebrow">01 — Researcher</p>
        <h2>Who</h2>
        <p>I am a Grade 11 cybersecurity researcher and systems developer specializing in autonomous vulnerability discovery, agentic AI fuzzing architectures, and low-level Linux systems security.</p>
        <button class="case-btn" data-case="who">View profile</button>
      </div>
    </section>

    <section id="chapter-mutagen" class="beat beat--right" style="--at: 0.33">
      <div class="beat__inner">
        <p class="eyebrow">02 — Agentic AI &amp; Zero-Day Fuzzing</p>
        <h2>Mutagen</h2>
        <p>Mutagen is an agentic AI fuzzer built in Python that reads source code (or a compiled binary via Ghidra decompilation), finds vulnerabilities, generates exploits, patches the bugs, and proves the fix works — fully autonomously.</p>
        <ul class="stats"><li><b>5-phase</b> pipeline</li><li><b>8</b> CWE classes</li><li><b>3</b> modes</li><li><b>130+</b> unit tests</li></ul>
        <button class="case-btn" data-case="mutagen">View case study</button>
      </div>
    </section>

    <section id="chapter-vigil" class="beat" style="--at: 0.46">
      <div class="beat__inner">
        <p class="eyebrow">03 — Threat Intelligence &amp; CLI Automation</p>
        <h2>Vigil</h2>
        <p>Vigil is a human-in-the-loop threat hunting CLI built in Python — the human decides, Vigil informs.</p>
        <ul class="stats"><li><b>8</b> formats auto-detected</li><li><b>NVD</b> API v2 live feed</li><li><b>SARIF</b> v2.1 output</li></ul>
        <button class="case-btn" data-case="vigil">View case study</button>
      </div>
    </section>

    <section id="chapter-signalhub" class="beat beat--right" style="--at: 0.59">
      <div class="beat__inner">
        <p class="eyebrow">04 — Live Data Pipeline &amp; NLP</p>
        <h2>SignalHub</h2>
        <p>SignalHub is a deployed financial market intelligence platform. It streams live equities and cryptocurrency price quotes via WebSocket and REST pipelines.</p>
        <button class="case-btn" data-case="signalhub">View case study</button>
      </div>
    </section>

    <section id="chapter-proving-grounds" class="beat" style="--at: 0.72">
      <div class="beat__inner">
        <p class="eyebrow">05 — Offensive Security Proving Grounds</p>
        <h2>Proving Grounds</h2>
        <p>Ranked in the Top 1% Worldwide on TryHackMe out of 3,000,000+ registered cybersecurity students and practitioners across 100+ completed machines and challenges.</p>
        <ul class="stats"><li><b>Top 1%</b> TryHackMe</li><li><b>100+</b> rooms</li><li><b>HTB</b> Apprentice · L25</li></ul>
        <button class="case-btn" data-case="proving-grounds">View writeups</button>
      </div>
    </section>

    <section id="contact" class="beat contact" style="--at: 1">
      <div class="beat__inner">
        <p class="eyebrow">06 — Contact</p>
        <h2>Get in touch</h2>
        <p>Connect with Aaron Alva for cybersecurity research collaborations, vulnerability disclosures, internship opportunities, or general technical inquiries.</p>
        <form id="contact-form" class="contact-form" novalidate>
          <label>Name <input name="name" autocomplete="name" placeholder="Your name" /></label>
          <label>Message <textarea name="message" rows="4" required placeholder="What would you like to talk about?"></textarea></label>
          <button type="submit" class="case-btn">Open in your email app</button>
          <p class="form-note" role="status" aria-live="polite"></p>
        </form>
        <p class="hero-links">
          <a href="mailto:aaron.lawrence.alva@gmail.com">aaron.lawrence.alva@gmail.com</a>
          <a href="https://github.com/Bunny-sysd" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
          <a href="https://tryhackme.com/p/354221973" target="_blank" rel="noopener noreferrer">TryHackMe ↗</a>
          <a href="https://app.hackthebox.com/users/3735054" target="_blank" rel="noopener noreferrer">Hack The Box ↗</a>
        </p>
      </div>
    </section>
  </main>

  <!-- case-study dialogs are inserted here in Task 7 -->

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 4: Write styles**

`src/styles/base.css`:
```css
:root {
  --font-display: 'Syne', system-ui, sans-serif;
  --font-sans: 'Space Grotesk', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --text: #F8FAFC;
  --text-dim: rgba(248, 250, 252, 0.74);
  --accent: #7DD3FC;
  --warm: #FCD34D;
  --ink: #02040a;
  --track-h: 900svh;
}
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; }
body {
  background: var(--ink);
  color: var(--text);
  font: 400 17px/1.6 var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
a { color: var(--accent); text-underline-offset: 3px; }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 3px; border-radius: 4px; }

#scene { position: fixed; inset: 0; width: 100vw; height: 100vh; display: block; z-index: 0; }
.mist {
  position: fixed; inset: 0; z-index: 1; pointer-events: none;
  background: var(--mist-color, #f3d7c9); opacity: var(--mist, 0);
}
html.no-webgl body {
  background: linear-gradient(180deg, #f6b27a 0%, #b56a8f 18%, #3b2a5c 40%, #0d1530 66%, #02040a 100%) fixed;
}
html.no-webgl #scene, html.no-webgl .mist { display: none; }
html.scroll-locked { overflow: hidden; }

.to-top {
  position: fixed; top: 18px; right: 18px; z-index: 5;
  font: 500 12px/1 var(--font-mono); letter-spacing: 0.14em; text-transform: uppercase;
  color: var(--text); text-decoration: none;
  padding: 10px 14px; border-radius: 999px;
  background: rgba(2, 4, 10, 0.45); backdrop-filter: blur(8px);
  border: 1px solid rgba(248, 250, 252, 0.14);
  opacity: var(--o, 0); pointer-events: none;
}
.to-top.is-live { pointer-events: auto; }
```

`src/styles/chapters.css`:
```css
.track { position: relative; z-index: 2; height: var(--track-h); }

.beat {
  position: absolute; left: 0; right: 0; height: 100svh;
  top: calc(var(--at) * (var(--track-h) - 100svh));
  display: grid; align-items: center;
  padding: 0 clamp(20px, 7vw, 120px);
  opacity: var(--o, 0);
  transform: translate3d(0, calc((1 - var(--o, 0)) * 28px), 0);
  will-change: opacity, transform;
}
.beat__inner { position: relative; max-width: 620px; }
.beat__inner::before {
  content: ''; position: absolute; inset: -56px -72px; z-index: -1;
  background: radial-gradient(closest-side, rgba(2, 4, 10, 0.55), rgba(2, 4, 10, 0));
  filter: blur(10px);
}
.beat--right .beat__inner { margin-left: auto; }

.eyebrow {
  margin: 0; font: 500 12px/1.5 var(--font-mono);
  letter-spacing: 0.18em; text-transform: uppercase; color: var(--accent);
}
.beat h1, .beat h2 {
  margin: 0.25em 0 0.3em; font-family: var(--font-display); font-weight: 800;
  letter-spacing: -0.02em; line-height: 0.95;
}
.beat h1 { font-size: clamp(56px, 9vw, 132px); }
.beat h2 { font-size: clamp(44px, 6.5vw, 96px); }
.beat p { margin: 0 0 1em; color: var(--text-dim); font-size: clamp(16px, 1.25vw, 19px); max-width: 54ch; }
.beat .lede { color: var(--text); }

.stats { display: flex; flex-wrap: wrap; gap: 8px 22px; margin: 18px 0 26px; padding: 0; list-style: none; }
.stats li { font: 500 13px/1.4 var(--font-mono); color: var(--text-dim); }
.stats b { color: var(--text); font-weight: 700; }

.case-btn {
  font: 600 15px/1 var(--font-sans); color: var(--ink); background: var(--text);
  border: 0; border-radius: 999px; padding: 14px 22px; cursor: pointer;
  transition: transform 0.2s ease, background 0.2s ease;
}
.case-btn:hover { transform: translateY(-1px); background: var(--accent); }

.creds { display: flex; flex-wrap: wrap; gap: 10px; margin: 26px 0 20px; padding: 0; list-style: none; }
.creds a {
  display: grid; gap: 2px; padding: 12px 16px; border-radius: 14px; text-decoration: none;
  color: var(--text); font: 500 15px/1.3 var(--font-sans);
  background: rgba(2, 4, 10, 0.35); border: 1px solid rgba(248, 250, 252, 0.16); backdrop-filter: blur(8px);
}
.creds a span { font: 500 11px/1 var(--font-mono); letter-spacing: 0.14em; text-transform: uppercase; color: var(--accent); }
.creds a:hover { border-color: var(--accent); }
.hero-links { display: flex; flex-wrap: wrap; gap: 8px 22px; }
.hero .beat__inner { max-width: 780px; }
.scroll-cue { margin-top: 40px; font: 500 12px var(--font-mono); letter-spacing: 0.2em; text-transform: uppercase; color: var(--text) !important; opacity: 0.8; }

.contact-form { display: grid; gap: 14px; margin: 22px 0; max-width: 520px; }
.contact-form label { display: grid; gap: 6px; font: 500 12px var(--font-mono); letter-spacing: 0.12em; text-transform: uppercase; color: var(--text-dim); }
.contact-form input, .contact-form textarea {
  font: 400 16px/1.5 var(--font-sans); color: var(--text);
  background: rgba(2, 4, 10, 0.55); border: 1px solid rgba(248, 250, 252, 0.18);
  border-radius: 12px; padding: 12px 14px;
}
.contact-form input:focus, .contact-form textarea:focus { outline: none; border-color: var(--accent); }
.contact-form .case-btn { justify-self: start; }
.form-note { min-height: 1.5em; margin: 0; font-size: 14px !important; }

@media (max-width: 767px) {
  .beat { align-items: end; padding-bottom: 10svh; }
  .hero { align-items: center; padding-bottom: 0; }
  .beat--right .beat__inner { margin-left: 0; }
  .beat__inner::before { inset: -32px -24px; }
}
```

- [ ] **Step 5: Implement scroll, chapters, main**

`src/scroll.js`:
```js
import Lenis from 'lenis';
import 'lenis/dist/lenis.css';

export function createScroll({ reducedMotion }) {
  const lenis = reducedMotion() ? null : new Lenis({ lerp: 0.09, smoothWheel: true });
  const max = () => Math.max(1, document.documentElement.scrollHeight - innerHeight);
  const root = document.documentElement;
  return {
    raf(ms) { if (lenis) lenis.raf(ms); },
    progress() { return Math.min(1, Math.max(0, scrollY / max())); },
    stop() { if (lenis) lenis.stop(); root.classList.add('scroll-locked'); },
    start() { if (lenis) lenis.start(); root.classList.remove('scroll-locked'); },
    scrollToProgress(p) {
      const y = p * max();
      if (lenis) lenis.scrollTo(y, { duration: 1.4 }); else window.scrollTo(0, y);
    },
  };
}
```

`src/chapters.js`:
```js
import { CHAPTERS, beatOpacity, heroOpacity, contactOpacity } from './timeline.js';

export function createChapters(doc) {
  const items = [
    { el: doc.getElementById('hero'), fn: heroOpacity },
    ...CHAPTERS.map((c) => ({ el: doc.getElementById(`chapter-${c.id}`), fn: (p) => beatOpacity(p, c.at) })),
    { el: doc.getElementById('contact'), fn: contactOpacity },
    { el: doc.getElementById('to-top'), fn: (p) => 1 - heroOpacity(p), live: true },
  ];
  const last = new Array(items.length).fill(-1);
  return {
    update(p) {
      items.forEach((it, i) => {
        const o = it.fn(p);
        if (Math.abs(o - last[i]) < 0.002) return;
        last[i] = o;
        it.el.style.setProperty('--o', o.toFixed(3));
        if (it.live) it.el.classList.toggle('is-live', o > 0.5);
      });
    },
  };
}
```

`src/main.js`:
```js
import './styles/base.css';
import './styles/chapters.css';
import { createScroll } from './scroll.js';
import { createChapters } from './chapters.js';
import { buildMailto } from './contact.js';

const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => reduceQuery.matches;

const scroll = createScroll({ reducedMotion });
const chapters = createChapters(document);

document.getElementById('to-top').addEventListener('click', (e) => {
  e.preventDefault();
  scroll.scrollToProgress(0);
});

const form = document.getElementById('contact-form');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  const note = form.querySelector('.form-note');
  const message = form.message.value;
  if (!message.trim()) { note.textContent = 'Add a message first.'; return; }
  window.location.href = buildMailto(form.name.value, message);
  note.textContent = 'Opening your email app with the message filled in…';
});

function frame(now) {
  requestAnimationFrame(frame);
  scroll.raf(now);
  chapters.update(scroll.progress());
}
requestAnimationFrame(frame);
```

- [ ] **Step 6: Run the content test to verify it passes**

Run: `node tests/e2e/content.mjs`
Expected: every line `ok`, exit code 0. Open `test-results/shots/content-*.png` and confirm text is readable at 1600 and 390.

- [ ] **Step 7: Commit**

```bash
git add index.html src tests/e2e
git commit -m "feat(descent): page, chapters and scroll-driven reveals"
```

---

### Task 3: Stage, sky and camera path

**Files:**
- Create: `src/scene/stage.js`, `src/scene/sky.js`, `src/scene/camera.js`
- Modify: `src/main.js`
- Test: `tests/e2e/scene.mjs`

**Interfaces:**
- Consumes: `paletteAt`, `smoothstep`, `altitudeAt`, `clamp01` (Task 1); `detectTier`, `TIER_SETTINGS` (Task 1)
- Produces:
  - `createStage(canvas) → { renderer, scene, camera, tier, settings } | null` (null = no WebGL)
  - `createSky(scene) → { colors: { zenith: THREE.Color, horizon: THREE.Color }, update(p, camera), dispose() }` — `colors` are linear-space and updated every frame; clouds/city read them
  - `createCameraRig(camera, { reducedMotion }) → { update(p), dispose() }`

- [ ] **Step 1: Write the failing scene test**

`tests/e2e/scene.mjs`:
```js
import { withPage, check, scrollToProgress, pixel, SHOTS } from './lib.mjs';

const POINTS = [0, 0.1, 0.2, 0.265, 0.33, 0.46, 0.59, 0.72, 0.85, 1];

for (const viewport of [{ width: 1600, height: 1000 }, { width: 390, height: 844 }]) {
  await withPage({ viewport }, async (page, errors) => {
    const tag = `${viewport.width}`;
    check(!(await page.evaluate(() => document.documentElement.classList.contains('no-webgl'))), `[${tag}] WebGL active`);
    for (const p of POINTS) {
      await scrollToProgress(page, p, 1200);
      await page.screenshot({ path: `${SHOTS}/scene-${tag}-${String(p).padEnd(5, '0')}.png` });
    }
    await scrollToProgress(page, 0, 1500);
    const [r, , b] = await pixel(page, Math.round(viewport.width / 2), Math.round(viewport.height * 0.52));
    check(r > b, `[${tag}] warm dusk near the horizon at the top (r=${r} b=${b})`);
    await scrollToProgress(page, 1, 1500);
    const [r2, g2, b2] = await pixel(page, Math.round(viewport.width * 0.85), 8);
    check(r2 + g2 + b2 < 120, `[${tag}] dark night sky at the bottom (${r2},${g2},${b2})`);
    const fps = await page.evaluate(() => new Promise((res) => {
      let n = 0; const t0 = performance.now();
      (function f() { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / 2); })();
    }));
    check(fps >= 45, `[${tag}] fps ${fps} >= 45`);
    check(errors.length === 0, `[${tag}] no console errors ${JSON.stringify(errors)}`);
  });
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/e2e/scene.mjs`
Expected: FAIL — "warm dusk near the horizon" fails (plain `--ink` background).

- [ ] **Step 3: Implement stage, sky, camera**

`src/scene/stage.js`:
```js
import * as THREE from 'three';
import { detectTier, TIER_SETTINGS } from '../tier.js';

export function createStage(canvas) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }
  const gl = renderer.getContext();
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : '';
  const tier = detectTier({
    gpu,
    memory: navigator.deviceMemory ?? 8,
    cores: navigator.hardwareConcurrency ?? 8,
    width: innerWidth,
  });
  const settings = TIER_SETTINGS[tier];
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, settings.dprCap));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(innerWidth < 768 ? 62 : 50, innerWidth / innerHeight, 0.1, 2000);
  return { renderer, scene, camera, tier, settings };
}
```

`src/scene/sky.js`:
```js
import * as THREE from 'three';
import { paletteAt, smoothstep } from '../timeline.js';

export function createSky(scene) {
  const uniforms = {
    uZenith: { value: new THREE.Color() },
    uHorizon: { value: new THREE.Color() },
    uSunDir: { value: new THREE.Vector3(0.35, 0.06, -1).normalize() },
    uSun: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    side: THREE.BackSide,
    depthWrite: false,
    vertexShader: /* glsl */`
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 uZenith;
      uniform vec3 uHorizon;
      uniform vec3 uSunDir;
      uniform float uSun;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        vec3 col = mix(uHorizon, uZenith, smoothstep(-0.02, 0.55, d.y));
        col = mix(col, uHorizon * 0.5, smoothstep(0.0, -0.45, d.y));
        float s = max(dot(d, uSunDir), 0.0);
        col += vec3(1.0, 0.72, 0.45) * (pow(s, 900.0) * 6.0 + pow(s, 14.0) * 0.35) * uSun;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24), material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -10;
  scene.add(mesh);

  const colors = { zenith: uniforms.uZenith.value, horizon: uniforms.uHorizon.value };
  return {
    colors,
    update(p, camera) {
      const { zenith, horizon } = paletteAt(p);
      colors.zenith.setRGB(zenith[0], zenith[1], zenith[2], THREE.SRGBColorSpace);
      colors.horizon.setRGB(horizon[0], horizon[1], horizon[2], THREE.SRGBColorSpace);
      uniforms.uSun.value = 1 - smoothstep(0.22, 0.55, p);
      mesh.position.copy(camera.position);
    },
    dispose() {
      scene.remove(mesh);
      mesh.geometry.dispose();
      material.dispose();
    },
  };
}
```

`src/scene/camera.js`:
```js
import * as THREE from 'three';
import { altitudeAt, clamp01 } from '../timeline.js';

export function createCameraRig(camera, { reducedMotion }) {
  const pointer = { x: 0, y: 0 };
  const smooth = { x: 0, y: 0 };
  const onMove = (e) => {
    pointer.x = (e.clientX / innerWidth) * 2 - 1;
    pointer.y = (e.clientY / innerHeight) * 2 - 1;
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  const target = new THREE.Vector3();

  return {
    update(p) {
      const k = reducedMotion() ? 0 : 1;
      smooth.x += (pointer.x * k - smooth.x) * 0.05;
      smooth.y += (pointer.y * k - smooth.y) * 0.05;
      const y = altitudeAt(p);
      camera.position.set(smooth.x * 2.5, y - smooth.y * 1.2, 0);
      // Level with the horizon at the top; tilting down toward the city below.
      target.set(smooth.x * 6, y - (3 + 32 * clamp01(p)), -80);
      camera.lookAt(target);
    },
    dispose() {
      window.removeEventListener('pointermove', onMove);
    },
  };
}
```

Replace `src/main.js` frame wiring (keep the form/to-top code from Task 2):
```js
import './styles/base.css';
import './styles/chapters.css';
import { createScroll } from './scroll.js';
import { createChapters } from './chapters.js';
import { buildMailto } from './contact.js';
import { createStage } from './scene/stage.js';
import { createSky } from './scene/sky.js';
import { createCameraRig } from './scene/camera.js';

const reduceQuery = matchMedia('(prefers-reduced-motion: reduce)');
const reducedMotion = () => reduceQuery.matches;

const scroll = createScroll({ reducedMotion });
const chapters = createChapters(document);

// ...to-top and contact-form handlers from Task 2, unchanged...

const stage = createStage(document.getElementById('scene'));
if (!stage) document.documentElement.classList.add('no-webgl');
const sky = stage && createSky(stage.scene);
const rig = stage && createCameraRig(stage.camera, { reducedMotion });

addEventListener('resize', () => {
  if (!stage) return;
  stage.camera.aspect = innerWidth / innerHeight;
  stage.camera.fov = innerWidth < 768 ? 62 : 50;
  stage.camera.updateProjectionMatrix();
  stage.renderer.setSize(innerWidth, innerHeight, false);
}, { passive: true });

function frame(now) {
  requestAnimationFrame(frame);
  scroll.raf(now);
  const p = scroll.progress();
  chapters.update(p);
  if (!stage || document.hidden) return;
  rig.update(p);
  sky.update(p, stage.camera);
  stage.renderer.render(stage.scene, stage.camera);
}
requestAnimationFrame(frame);
```

- [ ] **Step 4: Run tests**

Run: `node tests/e2e/scene.mjs && node tests/e2e/content.mjs`
Expected: all `ok`. Review `scene-1600-0.000.png` (warm sunset), `scene-1600-1.000.png` (dark navy).

- [ ] **Step 5: Commit**

```bash
git add src tests/e2e/scene.mjs
git commit -m "feat(descent): stage, dusk-to-night sky and descent camera"
```

---

### Task 4: Clouds and pass-through mist

*Peer-assignable: self-contained module with its own demo page. Hand it to the peer session in its own worktree (`git worktree add ../portfolio-clouds cinematic-descent`), with this task text and the interfaces below.*

**Files:**
- Create: `src/scene/clouds.js`, `tests/pages/clouds.html` (standalone preview used by the peer)
- Modify: `src/main.js`
- Test: extend `tests/e2e/scene.mjs`

**Interfaces:**
- Consumes: `CLOUD_LAYER_P`, `altitudeAt`, `smoothstep` (Task 1); `sky.colors` (Task 3); `settings.sheetsPerLayer` (Task 1)
- Produces: `createClouds(scene, { sheetsPerLayer, reducedMotion }) → { update(p, time, camera, colors) → mist (0..1), dispose() }`

- [ ] **Step 1: Add the failing assertions to `tests/e2e/scene.mjs`**

Inside the viewport loop, after the screenshots:
```js
    await scrollToProgress(page, 0.10, 1500);
    const mist = await page.$eval('.mist', (el) => parseFloat(getComputedStyle(el).opacity));
    check(mist > 0.3, `[${tag}] mist engulfs the camera while passing the first layer (${mist})`);
    await scrollToProgress(page, 0.20, 1500);
    const clear = await page.$eval('.mist', (el) => parseFloat(getComputedStyle(el).opacity));
    check(clear < 0.05, `[${tag}] mist clears between layers (${clear})`);
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/e2e/scene.mjs`
Expected: FAIL "mist engulfs the camera" (opacity 0).

- [ ] **Step 3: Implement `src/scene/clouds.js`**

```js
import * as THREE from 'three';
import { CLOUD_LAYER_P, altitudeAt, smoothstep } from '../timeline.js';

const COVERAGE = [0.42, 0.48, 0.5, 0.54, 0.62]; // higher = gappier; the lowest layer lets the city through
const SHEET_OFFSETS = [0, 1.6, -1.6];
const MIST_RADIUS = 3.5;

const vertexShader = /* glsl */`
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;

const fragmentShader = /* glsl */`
  uniform float uTime;
  uniform float uCoverage;
  uniform float uSeed;
  uniform vec3 uLit;
  uniform vec3 uShade;
  uniform vec3 uFog;
  uniform vec3 uCam;
  varying vec3 vWorld;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vWorld.xz * 0.012 + vec2(uSeed, uSeed * 1.7) + vec2(uTime * 0.004, uTime * 0.0015);
    float n = fbm(uv);
    float a = smoothstep(uCoverage, uCoverage + 0.28, n);
    float dist = length(vWorld.xz - uCam.xz);
    a *= 1.0 - smoothstep(380.0, 680.0, dist);                   // soften the sheet's far edge
    a *= smoothstep(0.8, 2.6, abs(uCam.y - vWorld.y));           // DOM mist takes over up close
    vec3 col = mix(uShade, uLit, smoothstep(uCoverage, uCoverage + 0.5, n));
    col = mix(col, uFog, 1.0 - exp(-dist * 0.0022));
    gl_FragColor = vec4(col, a * 0.92);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

export function createClouds(scene, { sheetsPerLayer, reducedMotion }) {
  const geometry = new THREE.PlaneGeometry(1400, 1400);
  const layers = CLOUD_LAYER_P.map((lp, li) => ({ y: altitudeAt(lp), coverage: COVERAGE[li] }));
  const sheets = [];
  const shared = { uLit: new THREE.Color(), uShade: new THREE.Color(), uFog: new THREE.Color(), uCam: new THREE.Vector3() };

  layers.forEach((layer, li) => {
    for (let s = 0; s < sheetsPerLayer; s++) {
      const material = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCoverage: { value: layer.coverage + s * 0.03 },
          uSeed: { value: li * 7.13 + s * 3.31 },
          uLit: { value: shared.uLit },
          uShade: { value: shared.uShade },
          uFog: { value: shared.uFog },
          uCam: { value: shared.uCam },
        },
        vertexShader,
        fragmentShader,
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.y = layer.y + SHEET_OFFSETS[s];
      scene.add(mesh);
      sheets.push(mesh);
    }
  });

  const white = new THREE.Color(1, 1, 1);
  return {
    update(p, time, camera, colors) {
      shared.uLit.copy(colors.horizon).lerp(white, 0.35);
      shared.uShade.copy(colors.zenith).lerp(colors.horizon, 0.35).multiplyScalar(0.8);
      shared.uFog.copy(colors.horizon);
      shared.uCam.copy(camera.position);
      const t = reducedMotion() ? 0 : time;
      for (const m of sheets) {
        m.material.uniforms.uTime.value = t;
        m.position.x = camera.position.x;   // sheets follow the camera sideways so edges never show
      }
      let mist = 0;
      for (const layer of layers) mist = Math.max(mist, 1 - smoothstep(0, MIST_RADIUS, Math.abs(camera.position.y - layer.y)));
      return mist;
    },
    dispose() {
      for (const m of sheets) { scene.remove(m); m.material.dispose(); }
      geometry.dispose();
    },
  };
}
```

Wire into `src/main.js`:
```js
import { createClouds } from './scene/clouds.js';
// after sky/rig:
const clouds = stage && createClouds(stage.scene, { sheetsPerLayer: stage.settings.sheetsPerLayer, reducedMotion });
const mistEl = document.querySelector('.mist');
// inside frame(), after sky.update:
  const mist = clouds.update(p, now / 1000, stage.camera, sky.colors);
  mistEl.style.setProperty('--mist', (mist * 0.85).toFixed(3));
  mistEl.style.setProperty('--mist-color', `#${sky.colors.horizon.clone().lerp(new THREE.Color(1, 1, 1), 0.55).getHexString(THREE.SRGBColorSpace)}`);
```
(add `import * as THREE from 'three';` to `main.js`; hoist the `new THREE.Color(1, 1, 1)` to a module constant `WHITE` and reuse a scratch `THREE.Color` so nothing allocates per frame.)

`tests/pages/clouds.html` (peer preview; open at `/tests/pages/clouds.html` on the dev server, drag the slider to scrub progress):
```html
<!DOCTYPE html>
<html><body style="margin:0;background:#000">
<input id="p" type="range" min="0" max="1" step="0.001" value="0" style="position:fixed;top:10px;left:10px;width:60vw;z-index:2">
<canvas id="c" style="width:100vw;height:100vh;display:block"></canvas>
<script type="module">
  import * as THREE from 'three';
  import { createSky } from '/src/scene/sky.js';
  import { createCameraRig } from '/src/scene/camera.js';
  import { createClouds } from '/src/scene/clouds.js';
  const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('c'), antialias: true });
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 2000);
  const sky = createSky(scene);
  const rig = createCameraRig(camera, { reducedMotion: () => false });
  const clouds = createClouds(scene, { sheetsPerLayer: 3, reducedMotion: () => false });
  const slider = document.getElementById('p');
  renderer.setAnimationLoop((t) => {
    const p = parseFloat(slider.value);
    rig.update(p); sky.update(p, camera);
    const mist = clouds.update(p, t / 1000, camera, sky.colors);
    document.body.style.boxShadow = `inset 0 0 0 100vmax rgba(255,230,220,${mist * 0.85})`;
    renderer.render(scene, camera);
  });
</script>
</body></html>
```

- [ ] **Step 4: Run tests and review frames**

Run: `node tests/e2e/scene.mjs && node tests/e2e/content.mjs`
Expected: all `ok`. Review `scene-1600-0.000.png` (sea of clouds below a sunset), `0.100` (misty white-out), `0.265`/`0.395` (passing layers), `0.720` (gaps). Tune `COVERAGE`, noise scale `0.012`, and lit/shade mixes until it reads as clouds, not noise; re-run after each change.

- [ ] **Step 5: Commit**

```bash
git add src/scene/clouds.js src/main.js tests/pages/clouds.html tests/e2e/scene.mjs
git commit -m "feat(descent): cloud layers and pass-through mist"
```

---

### Task 5: Night city / network grid

**Files:**
- Create: `src/scene/city.js`
- Modify: `src/main.js`
- Test: extend `tests/e2e/scene.mjs`

**Interfaces:**
- Consumes: `cityReveal` (Task 1); `sky.colors` (Task 3); `settings.cityLights` (Task 1)
- Produces: `createCity(scene, { lights, reducedMotion }) → { update(p, time, camera), dispose() }`

- [ ] **Step 1: Add the failing assertion**

In `tests/e2e/scene.mjs`, inside the viewport loop:
```js
    await scrollToProgress(page, 1, 1500);
    const [cr, cg, cb] = await pixel(page, Math.round(viewport.width / 2), Math.round(viewport.height * 0.85));
    const glowScreenshot = await page.screenshot({ clip: { x: 0, y: Math.round(viewport.height * 0.6), width: viewport.width, height: Math.round(viewport.height * 0.4) } });
    const bright = await page.evaluate(async (b64) => {
      const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
      const c = new OffscreenCanvas(img.width, img.height); const g = c.getContext('2d'); g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data; let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 2] > 170 && d[i + 1] > 140) n++;
      return n;
    }, glowScreenshot.toString('base64'));
    check(bright > 150, `[${tag}] city lights glow in the lower frame at the bottom (${bright} px)`);
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/e2e/scene.mjs`
Expected: FAIL "city lights glow".

- [ ] **Step 3: Implement `src/scene/city.js`**

```js
import * as THREE from 'three';
import { cityReveal } from '../timeline.js';

const CITY_Y = -72;
const CELL = 14;
const PACKETS = 70;

const gridVertex = /* glsl */`
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }`;
const gridFragment = /* glsl */`
  uniform vec3 uLine;
  uniform vec3 uCam;
  uniform float uReveal;
  varying vec3 vWorld;
  void main() {
    vec2 g = vWorld.xz / ${CELL.toFixed(1)};
    vec2 w = fwidth(g);
    vec2 l = abs(fract(g - 0.5) - 0.5) / w;
    float line = 1.0 - min(min(l.x, l.y), 1.0);
    float dist = length(vWorld.xz - uCam.xz);
    float fade = 1.0 - smoothstep(120.0, 720.0, dist);
    gl_FragColor = vec4(uLine * line * fade * uReveal, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

const pointVertex = /* glsl */`
  attribute vec3 aColor;
  attribute float aSeed;
  uniform float uTime;
  uniform float uScale;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    vColor = aColor;
    vTwinkle = 0.75 + 0.25 * sin(uTime * (1.5 + aSeed * 2.0) + aSeed * 40.0);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = uScale * (2.0 + aSeed * 2.5) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }`;
const pointFragment = /* glsl */`
  uniform float uReveal;
  varying vec3 vColor;
  varying float vTwinkle;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor * a * vTwinkle * uReveal * 1.6, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }`;

function makePoints(count, colorFor) {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const seed = new Float32Array(count);
  const cyan = new THREE.Color('#7DD3FC');
  const warm = new THREE.Color('#FCD34D');
  for (let i = 0; i < count; i++) {
    pos[i * 3] = Math.round((Math.random() - 0.5) * 1000 / CELL) * CELL;
    pos[i * 3 + 1] = CITY_Y + 0.2;
    pos[i * 3 + 2] = Math.round((-Math.random() * 800 + 120) / CELL) * CELL;
    const c = colorFor(i, cyan, warm);
    col.set([c.r, c.g, c.b], i * 3);
    seed[i] = Math.random();
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  return geo;
}

export function createCity(scene, { lights, reducedMotion }) {
  const gridUniforms = { uLine: { value: new THREE.Color('#7DD3FC').multiplyScalar(0.55) }, uCam: { value: new THREE.Vector3() }, uReveal: { value: 0 } };
  const grid = new THREE.Mesh(
    new THREE.PlaneGeometry(1600, 1600),
    new THREE.ShaderMaterial({ uniforms: gridUniforms, vertexShader: gridVertex, fragmentShader: gridFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }),
  );
  grid.rotation.x = -Math.PI / 2;
  grid.position.y = CITY_Y;
  scene.add(grid);

  const pointUniforms = { uTime: { value: 0 }, uScale: { value: 600 }, uReveal: { value: 0 } };
  const pointMaterial = new THREE.ShaderMaterial({ uniforms: pointUniforms, vertexShader: pointVertex, fragmentShader: pointFragment, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const lightPoints = new THREE.Points(makePoints(lights, (i, cyan, warm) => (Math.random() < 0.15 ? warm : cyan)), pointMaterial);
  scene.add(lightPoints);

  // Packets: bright dots running along grid lines — traffic across the network.
  const packetGeo = makePoints(PACKETS, (i, cyan) => cyan);
  const packetPos = packetGeo.attributes.position;
  const packets = Array.from({ length: PACKETS }, () => ({ axis: Math.random() < 0.5 ? 0 : 2, speed: 20 + Math.random() * 45 }));
  const packetPoints = new THREE.Points(packetGeo, pointMaterial.clone());
  packetPoints.material.uniforms = { uTime: pointUniforms.uTime, uScale: { value: 900 }, uReveal: pointUniforms.uReveal };
  scene.add(packetPoints);

  let last = 0;
  return {
    update(p, time, camera) {
      const reveal = cityReveal(p);
      gridUniforms.uReveal.value = reveal;
      pointUniforms.uReveal.value = reveal;
      gridUniforms.uCam.value.copy(camera.position);
      const still = reducedMotion();
      pointUniforms.uTime.value = still ? 0 : time;
      const dt = Math.min(0.05, time - last);
      last = time;
      grid.visible = lightPoints.visible = packetPoints.visible = reveal > 0.001;
      if (still || reveal <= 0.001) return;
      for (let i = 0; i < PACKETS; i++) {
        const k = packets[i].axis;
        let v = packetPos.array[i * 3 + k] + packets[i].speed * dt;
        if (k === 0 && v > 500) v = -500;
        if (k === 2 && v > 120) v = -680;
        packetPos.array[i * 3 + k] = v;
      }
      packetPos.needsUpdate = true;
    },
    dispose() {
      for (const o of [grid, lightPoints, packetPoints]) { scene.remove(o); o.geometry.dispose(); o.material.dispose(); }
    },
  };
}
```

Wire into `src/main.js`:
```js
import { createCity } from './scene/city.js';
const city = stage && createCity(stage.scene, { lights: stage.settings.cityLights, reducedMotion });
// in frame(), after clouds:
  city.update(p, now / 1000, stage.camera);
```

- [ ] **Step 4: Run tests and review**

Run: `node tests/e2e/scene.mjs && node tests/e2e/content.mjs`
Expected: all `ok`. Review `scene-*-0.720.png` (lights through gaps) and `1.000` (full grid, packets). Contact text must stay readable over the grid.

- [ ] **Step 5: Commit**

```bash
git add src/scene/city.js src/main.js tests/e2e/scene.mjs
git commit -m "feat(descent): night network grid with city lights and packets"
```

---

### Task 6: Post-processing and adaptive quality

**Files:**
- Create: `src/scene/post.js`
- Modify: `src/main.js`
- Test: `tests/e2e/scene.mjs` (FPS assertion already present; re-run)

**Interfaces:**
- Consumes: `stage.settings.postFX` (Task 1/3)
- Produces: `createPost(renderer, scene, camera, { reducedMotion }) → { render(time), setSize(w, h), setPixelRatio(r), dispose() }`

- [ ] **Step 1: Implement `src/scene/post.js`**

```js
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

const FilmShader = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0.03 }, uVignette: { value: 0.32 } },
  vertexShader: /* glsl */`
    varying vec2 vUv;
    void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
  fragmentShader: /* glsl */`
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uGrain;
    uniform float uVignette;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec3 col = texture2D(tDiffuse, vUv).rgb;
      vec2 c = vUv - 0.5;
      col *= 1.0 - uVignette * smoothstep(0.1, 0.55, dot(c, c));
      col += (hash(gl_FragCoord.xy + fract(uTime) * 97.0) - 0.5) * uGrain;
      gl_FragColor = vec4(col, 1.0);
    }`,
};

export function createPost(renderer, scene, camera, { reducedMotion }) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // Text is DOM, so nothing here can smear it; threshold keeps bloom to the
  // sun, city lights and packets.
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.75, 0.6, 0.82));
  const film = new ShaderPass(FilmShader);
  composer.addPass(film);
  composer.addPass(new OutputPass());
  return {
    render(time) {
      film.uniforms.uTime.value = reducedMotion() ? 0 : time;
      composer.render();
    },
    setSize(w, h) { composer.setSize(w, h); },
    setPixelRatio(r) { composer.setPixelRatio(r); },
    dispose() { composer.dispose(); },
  };
}
```

- [ ] **Step 2: Wire in with an FPS watchdog**

In `src/main.js`:
```js
import { createPost } from './scene/post.js';
let post = stage && stage.settings.postFX ? createPost(stage.renderer, stage.scene, stage.camera, { reducedMotion }) : null;

// resize handler: add
  if (post) post.setSize(innerWidth, innerHeight);

// watchdog: step 1 drop pixel ratio, step 2 drop post FX
const watch = { frames: 0, since: performance.now(), step: 0 };
function watchdog(now) {
  if (++watch.frames < 90) return;
  const fps = (watch.frames * 1000) / (now - watch.since);
  watch.frames = 0; watch.since = now;
  if (fps >= 42 || !stage) return;
  if (watch.step === 0) {
    watch.step = 1;
    stage.renderer.setPixelRatio(1);
    if (post) post.setPixelRatio(1);
  } else if (watch.step === 1 && post) {
    watch.step = 2;
    post.dispose();
    post = null;
  }
}

// in frame(), replace the render call:
  watchdog(now);
  if (post) post.render(now / 1000);
  else stage.renderer.render(stage.scene, stage.camera);
```

- [ ] **Step 3: Run tests and review**

Run: `node tests/e2e/scene.mjs && node tests/e2e/content.mjs`
Expected: all `ok`, fps ≥ 45 on both viewports. Review the sun (soft glow, not a white blob) and city (lights glow, grid lines stay thin). If the sun blows out, lower bloom strength `0.75` or raise threshold `0.82`.

- [ ] **Step 4: Commit**

```bash
git add src/scene/post.js src/main.js
git commit -m "feat(descent): bloom + film finish with FPS watchdog"
```

---

### Task 7: Case-study dialogs and ported widgets

**Files:**
- Modify: `index.html` (insert 5 dialogs), `src/main.js`
- Create: `src/case-study.js`, `src/widgets/phase-flow.js`, `src/widgets/commands.js`, `src/widgets/ctf-tabs.js`, `src/styles/case-study.css`
- Test: `tests/e2e/case-study.mjs`

**Interfaces:**
- Consumes: `CASE_IDS`, `caseIdFromHash` (Task 1); `scroll.stop()`, `scroll.start()` (Task 2); buttons `[data-case]` (Task 2)
- Produces:
  - `initCaseStudies({ scroll }) → { open(id) }`
  - `widgets/phase-flow.js`: `runPhaseFlowsIn(root) → () => void` (stop function)
  - `widgets/commands.js`: `revealCommandBlocks(root)`
  - `widgets/ctf-tabs.js`: `wireCtfTabs(root)`
  - Dialog ids: `#case-<id>`; close buttons `[data-close]`

- [ ] **Step 1: Write the failing test**

`tests/e2e/case-study.mjs`:
```js
import { withPage, check, scrollToProgress, BASE, SHOTS } from './lib.mjs';

await withPage({ viewport: { width: 1600, height: 1000 } }, async (page, errors) => {
  for (const [id, at] of [['mutagen', 0.33], ['vigil', 0.46], ['proving-grounds', 0.72]]) {
    await scrollToProgress(page, at);
    const before = await page.evaluate(() => scrollY);
    await page.click(`#chapter-${id} [data-case]`);
    await page.waitForTimeout(700);
    check(await page.$eval(`#case-${id}`, (d) => d.open), `${id} dialog opens`);
    check(page.url().endsWith(`#${id}`), `${id} sets the shareable hash`);
    await page.screenshot({ path: `${SHOTS}/case-${id}.png` });
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
    check(!(await page.$eval(`#case-${id}`, (d) => d.open)), `${id} closes on ESC`);
    check(Math.abs((await page.evaluate(() => scrollY)) - before) < 4, `${id} returns to the same spot in the descent`);
  }
  await scrollToProgress(page, 0.33);
  await page.click('#chapter-mutagen [data-case]');
  await page.waitForTimeout(3500);
  const readout = await page.$eval('#case-mutagen [data-phase-readout]', (el) => el.textContent);
  check(/PHASE 2\/5/.test(readout), `phase-flow pulse advances inside the dialog ("${readout}")`);
  const typed = await page.$eval('#case-mutagen .command-block-code', (el) => el.textContent.length);
  check(typed > 20, 'command typewriter runs inside the dialog');
  await page.keyboard.press('Escape');

  await scrollToProgress(page, 0.72);
  await page.click('#chapter-proving-grounds [data-case]');
  await page.waitForTimeout(500);
  await page.click('#case-proving-grounds .target-btn[data-machine="linux"]');
  check((await page.textContent('#case-proving-grounds #ctfMachineContent')).includes('CYBERPULSE'), 'CTF tabs switch writeups');
  check(errors.length === 0, `no console errors ${JSON.stringify(errors)}`);
});

await withPage({ viewport: { width: 390, height: 844 } }, async (page) => {
  await page.goto(BASE + '#vigil', { waitUntil: 'load' });
  await page.waitForTimeout(800);
  check(await page.$eval('#case-vigil', (d) => d.open), 'deep link #vigil opens the Vigil case study on load (mobile)');
  await page.screenshot({ path: `${SHOTS}/case-vigil-mobile.png` });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `node tests/e2e/case-study.mjs`
Expected: FAIL — `#case-mutagen` not found.

- [ ] **Step 3: Generate the dialog markup from `main`'s drawers**

Run this one-off (not committed) to print the 5 dialogs, then paste its output into `index.html` in place of the `<!-- case-study dialogs ... -->` comment:
```bash
git show main:index.html > /tmp/main-index.html
node -e "
const h = require('fs').readFileSync('/tmp/main-index.html', 'utf8');
const map = { who: 'profile', mutagen: 'mutagen', vigil: 'vigil', signalhub: 'signalhub', 'proving-grounds': 'tryhackme' };
for (const [id, old] of Object.entries(map)) {
  const start = h.indexOf('id=\"drawer-' + old + '\"');
  const next = h.indexOf('class=\"at-drawer\"', start + 20);
  const chunk = h.slice(start, next < 0 ? h.length : next);
  const badge = chunk.match(/at-drawer-badge\">([^<]*)/)[1];
  const title = chunk.match(/<h2>([^<]*)/)[1];
  const bodyStart = chunk.indexOf('<div class=\"at-drawer-body\">') + '<div class=\"at-drawer-body\">'.length;
  const bodyEnd = chunk.lastIndexOf('</div>', chunk.lastIndexOf('</div>') - 1);
  const body = chunk.slice(bodyStart, bodyEnd).trim();
  console.log('<dialog id=\"case-' + id + '\" class=\"case\" aria-labelledby=\"case-' + id + '-title\" data-lenis-prevent>');
  console.log('  <header class=\"case__head\"><div><p class=\"eyebrow\">' + badge + '</p><h2 id=\"case-' + id + '-title\">' + title + '</h2></div>');
  console.log('  <button class=\"case__close\" data-close aria-label=\"Close case study\">Close ✕</button></header>');
  console.log('  <div class=\"case__body\">' + body + '</div>');
  console.log('</dialog>');
}
"
```
Verify: `grep -c '<dialog id="case-' index.html` → `5`; `grep -c 'closeActiveTheoryDrawer\|rotateCylinderToCard' index.html` → `0` (no leftover old-engine calls; if non-zero, delete those attributes).

- [ ] **Step 4: Port the widgets**

`src/widgets/commands.js` — moved from `main:app.js` lines 931–964, unchanged logic:
```js
const PROMPT_LINE_RE = /^(<span class="cmd-prompt">.*?<\/span>)(.*)$/;

// Comment lines pop in; each `$ command` types out, then pauses before the next.
export function revealCommandBlocks(root) {
  root.querySelectorAll('.command-block-code').forEach((block) => {
    if (!block.dataset.rawHtml) block.dataset.rawHtml = block.innerHTML;
    const lines = block.dataset.rawHtml.split('\n');
    block.innerHTML = '';
    let delay = 0;
    lines.forEach((lineHtml) => {
      const lineWrap = document.createElement('span');
      lineWrap.className = 'command-line-reveal';
      const promptMatch = lineHtml.match(PROMPT_LINE_RE);
      if (promptMatch) {
        const [, promptHtml, commandText] = promptMatch;
        setTimeout(() => { lineWrap.innerHTML = promptHtml; block.appendChild(lineWrap); }, delay);
        for (let ci = 1; ci <= commandText.length; ci++) {
          setTimeout(() => { lineWrap.innerHTML = promptHtml + commandText.slice(0, ci); }, delay + 60 + ci * 18);
        }
        delay += 60 + commandText.length * 18 + 450;
      } else {
        setTimeout(() => { lineWrap.innerHTML = lineHtml; block.appendChild(lineWrap); }, delay);
        delay += lineHtml.trim() ? 150 : 80;
      }
    });
  });
}
```

`src/widgets/phase-flow.js` — moved from `main:app.js` lines 966–1033:
```js
function runPhaseFlow(wrap) {
  const nodeEls = Array.from(wrap.querySelectorAll('.phase-node'));
  const connectorEls = Array.from(wrap.querySelectorAll('.phase-connector'));
  const pulseEls = connectorEls.map((c) => c.querySelector('.phase-pulse'));
  const readout = wrap.querySelector('[data-phase-readout]');
  const labels = nodeEls.map((n) => n.querySelector('.phase-node-label')?.textContent.trim() || '');
  const count = nodeEls.length;
  if (!readout || count < 1) return () => {};

  const setActive = (i) => {
    nodeEls.forEach((n, idx) => n.classList.toggle('is-active', idx === i));
    readout.textContent = `PHASE ${i + 1}/${count} · ${labels[i].toUpperCase()}`;
  };
  setActive(0);
  if (count < 2) return () => {};

  // Reduced motion still cycles through every phase (it's content); only the
  // sliding dot is skipped.
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const DWELL_MS = 2100;
  const TRAVEL_MS = 900;
  const timeouts = [];
  let current = 0;

  const travelPulse = (i) => {
    if (reduceMotion) return;
    const pulse = pulseEls[i];
    if (!pulse) return;
    pulse.style.transitionDuration = '0s';
    pulse.style.left = '0%';
    pulse.classList.add('is-traveling');
    void pulse.offsetWidth;
    pulse.style.transitionDuration = '';
    requestAnimationFrame(() => { pulse.style.left = '100%'; });
  };

  const step = () => {
    timeouts.push(setTimeout(() => {
      if (current < count - 1) travelPulse(current);
      timeouts.push(setTimeout(() => {
        current = (current + 1) % count;
        setActive(current);
        pulseEls.forEach((p) => { if (p) { p.classList.remove('is-traveling'); p.style.left = '0%'; } });
        step();
      }, TRAVEL_MS));
    }, DWELL_MS));
  };
  step();
  return () => timeouts.forEach(clearTimeout);
}

export function runPhaseFlowsIn(root) {
  const stops = Array.from(root.querySelectorAll('.phase-flow-wrap')).map(runPhaseFlow);
  return () => stops.forEach((stop) => stop());
}
```

`src/widgets/ctf-tabs.js` — move the `machineWriteups` object **verbatim** from `main:app.js` lines 895–917, then:
```js
const machineWriteups = { /* ad, linux, web — verbatim from main:app.js 895–917 */ };

export function wireCtfTabs(root) {
  const tabs = root.querySelectorAll('#ctfMachineTabs .target-btn');
  const content = root.querySelector('#ctfMachineContent');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      if (content && machineWriteups[tab.dataset.machine]) content.innerHTML = machineWriteups[tab.dataset.machine];
    });
  });
}
```

- [ ] **Step 5: Implement `src/case-study.js`**

```js
import { CASE_IDS, caseIdFromHash } from './case-ids.js';
import { runPhaseFlowsIn } from './widgets/phase-flow.js';
import { revealCommandBlocks } from './widgets/commands.js';
import { wireCtfTabs } from './widgets/ctf-tabs.js';

export function initCaseStudies({ scroll }) {
  const dialogs = new Map(CASE_IDS.map((id) => [id, document.getElementById(`case-${id}`)]));
  let stopFlows = () => {};

  function open(id) {
    const dialog = dialogs.get(id);
    if (!dialog || dialog.open) return;
    scroll.stop();
    dialog.showModal();
    dialog.scrollTop = 0;
    revealCommandBlocks(dialog);
    stopFlows = runPhaseFlowsIn(dialog);
    history.replaceState(null, '', `#${id}`);
  }

  dialogs.forEach((dialog) => {
    dialog.addEventListener('close', () => {
      stopFlows();
      stopFlows = () => {};
      scroll.start();
      history.replaceState(null, '', location.pathname + location.search);
    });
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  });

  document.querySelectorAll('[data-case]').forEach((btn) => {
    btn.addEventListener('click', () => open(btn.dataset.case));
  });
  wireCtfTabs(document);

  const initial = caseIdFromHash(location.hash);
  if (initial) open(initial);
  return { open };
}
```

In `src/main.js`: `import './styles/case-study.css';` and `import { initCaseStudies } from './case-study.js';`, then after `createChapters`: `initCaseStudies({ scroll });`.

- [ ] **Step 6: Build `src/styles/case-study.css`**

Extract the component rules from `main:style.css` (verify each range with `sed -n` first — each must start at a rule and end before the next section header):
```bash
git show main:style.css > /tmp/main-style.css
{ echo '/* Case-study components, moved from the previous site. */'
  echo '.case {'; sed -n '10,33p' /tmp/main-style.css; echo '}'      # old tokens, scoped to dialogs
  sed -n '723,746p' /tmp/main-style.css                              # .target-btn
  sed -n '1821,1987p' /tmp/main-style.css                            # .dossier-* panels, grids, stats
  sed -n '2117,2537p' /tmp/main-style.css                            # phase-flow, command blocks, dd-console, IDE panel
} > src/styles/case-study.css
```
Then append the dialog shell:
```css
dialog.case {
  width: min(1120px, 100vw); height: 100svh; max-height: 100svh; max-width: 100vw;
  margin: 0 auto; padding: 0; border: 0; overflow-y: auto; overscroll-behavior: contain;
  color: var(--text); background: rgba(4, 7, 15, 0.94);
  font-family: var(--font-sans);
}
dialog.case::backdrop { background: rgba(2, 4, 10, 0.6); backdrop-filter: blur(6px); }
.case__head {
  position: sticky; top: 0; z-index: 2; display: flex; justify-content: space-between; align-items: center; gap: 16px;
  padding: 20px clamp(16px, 4vw, 40px); background: rgba(4, 7, 15, 0.92); backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(248, 250, 252, 0.1);
}
.case__head h2 { margin: 4px 0 0; font: 800 clamp(22px, 3vw, 34px)/1.05 var(--font-display); }
.case__close {
  flex: none; font: 500 13px var(--font-mono); letter-spacing: 0.1em; text-transform: uppercase;
  color: var(--text); background: transparent; border: 1px solid rgba(248, 250, 252, 0.25);
  border-radius: 999px; padding: 10px 16px; cursor: pointer;
}
.case__close:hover { border-color: var(--accent); color: var(--accent); }
.case__body { padding: clamp(16px, 4vw, 40px); }
```

Coverage check — every class used inside dialogs must have a rule:
```bash
node -e "
const fs=require('fs');const h=fs.readFileSync('index.html','utf8');const css=fs.readFileSync('src/styles/case-study.css','utf8')+fs.readFileSync('src/styles/chapters.css','utf8');
const dialogs=h.slice(h.indexOf('<dialog'));const cls=new Set([...dialogs.matchAll(/class=\"([^\"]+)\"/g)].flatMap(m=>m[1].split(/\s+/)));
const missing=[...cls].filter(c=>!css.includes('.'+c));console.log('unstyled:',missing.join(' ')||'none');"
```
Expected: `unstyled:` lists only state/semantic classes (`active`, `dim`, `cyan`, `warn`, `err`, `green`, `is-active`) — if any layout class appears, find its rule in `/tmp/main-style.css` and append it.

- [ ] **Step 7: Run tests**

Run: `node tests/e2e/case-study.mjs && node tests/e2e/content.mjs`
Expected: all `ok`. Review `case-mutagen.png` and `case-vigil-mobile.png` — must look like the old drawers, readable, close button visible.

- [ ] **Step 8: Commit**

```bash
git add index.html src tests/e2e/case-study.mjs
git commit -m "feat(descent): case-study dialogs with ported widgets and deep links"
```

---

### Task 8: Fallbacks, retire the old engine, docs, final verification

**Files:**
- Delete: `app.js`, `three-bg.js`, `public/app.js`, `public/three-bg.js`, `style.css`
- Modify: `CLAUDE.md`, `RESTRUCTURE_PLAN.md`
- Test: `tests/e2e/fallbacks.mjs`, full `npm test && npm run e2e`, `npm run build`

- [ ] **Step 1: Write the fallback test**

`tests/e2e/fallbacks.mjs`:
```js
import { withPage, check, scrollToProgress, opacityOf, SHOTS } from './lib.mjs';

await withPage({ viewport: { width: 1600, height: 1000 }, reducedMotion: 'reduce' }, async (page, errors) => {
  check(await opacityOf(page, '#hero') > 0.95, 'reduced motion: hero visible');
  await scrollToProgress(page, 0.33);
  check(await opacityOf(page, '#chapter-mutagen') > 0.9, 'reduced motion: chapters still reveal on scroll');
  check(await page.evaluate(() => !document.documentElement.classList.contains('lenis')), 'reduced motion: no smooth-scroll hijack');
  check(errors.length === 0, `reduced motion: no errors ${JSON.stringify(errors)}`);
});

await withPage({ viewport: { width: 1600, height: 1000 } }, async (page, errors) => {
  check(await page.evaluate(() => document.documentElement.classList.contains('no-webgl')), 'no WebGL: fallback class set');
  await page.screenshot({ path: `${SHOTS}/fallback-no-webgl.png` });
  await scrollToProgress(page, 0.46);
  check(await opacityOf(page, '#chapter-vigil') > 0.9, 'no WebGL: content still readable');
  check(errors.length === 0, `no WebGL: no errors ${JSON.stringify(errors)}`);
}, ['--disable-webgl', '--disable-3d-apis']);
```

- [ ] **Step 2: Run it**

Run: `node tests/e2e/fallbacks.mjs`
Expected: all `ok`. If the no-WebGL run throws inside `createStage` rather than returning null, widen the `try` in `stage.js` to cover `getContext()`/`getExtension()` too, and re-run.

- [ ] **Step 3: Retire the old engine**

```bash
git rm app.js three-bg.js public/app.js public/three-bg.js style.css
grep -rn "app.js\|three-bg.js\|style.css" index.html src || echo "no references left"
```
Expected: `no references left`.

- [ ] **Step 4: Full verification**

```bash
npm test
npm run e2e
npm run build && ls docs
```
Expected: unit and e2e all `ok`; build succeeds; `docs/index.html` and hashed `docs/assets/*.js|css` exist. Size budget (spec §6): `node -e "const fs=require('fs'),z=require('zlib');let t=0;for(const f of fs.readdirSync('docs/assets'))if(f.endsWith('.js'))t+=z.gzipSync(fs.readFileSync('docs/assets/'+f)).length;console.log((t/1024).toFixed(1)+' KB gz');process.exit(t>256000?1:0)"` → under 250 KB. Then run `npx vite preview --port 4173` and `BASE_URL=http://127.0.0.1:4173/ node tests/e2e/content.mjs` → all `ok` (the built site works, not just dev).

Review every screenshot in `test-results/shots/` at both widths; also load at 1280×600 (short window) and confirm chapter text isn't clipped.

- [ ] **Step 5: Update docs**

`CLAUDE.md`: replace the Stack / File layout / 3D engine / app.js sections with the new architecture (native scroll + Lenis, `src/` module map from this plan, `timeline.js` as the single source of truth for beats, real-GPU Playwright flags, `npm test` / `npm run e2e` commands). `RESTRUCTURE_PLAN.md`: mark Part 6 superseded by "Part 7 — Cinematic descent rebuild (branch `cinematic-descent`)", linking the spec and this plan; note the mobile card-framing bug is resolved by the rebuild.

- [ ] **Step 6: Commit**

```bash
git add -A
git status --short   # review: no secrets, no test-results/, no .superpowers/
git commit -m "refactor(descent): retire the cylinder engine; fallbacks, docs"
```

Then stop and show the user the dev server. Merge to `main` / push only on their explicit go-ahead.
