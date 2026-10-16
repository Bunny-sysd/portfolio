// The address-space layer: avalanche transitions, SHA-256 sigils, the probe
// cursor, Ctrl+K, the perimeter tally, and a low-end (software GPU) run.
// Needs the dev server: node tests/e2e/address.mjs
import { createHash } from 'node:crypto';
import { withPage, check, SHOTS, BASE } from './lib.mjs';

const live = (page) => page.waitForFunction(() => document.documentElement.classList.contains('scene-live'), null, { timeout: 30000 });
const sha = (s) => createHash('sha256').update(s).digest('hex');
// Lit pixels on the avalanche canvas right now.
const avalanchePixels = (page) => page.evaluate(() => {
  const c = document.querySelector('.avalanche');
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
  return n;
});

for (const reduced of [false, true]) {
  const tag = reduced ? 'reduced' : 'motion';
  await withPage({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' }, async (page, errors) => {
    await live(page);
    await page.waitForTimeout(800);

    // Identity sigil: the real digest of the name.
    const id = await page.textContent('.hud-id__hash');
    check(id === `sha256 ${sha('Aaron Alva').slice(0, 8)}…`, `${tag}: identity sigil is sha256("Aaron Alva") (${id})`);

    // Avalanche on a view change — motion only.
    await page.mouse.click(300, 300);
    await page.click('.cue');
    await page.waitForTimeout(160);
    const px = await avalanchePixels(page);
    if (reduced) check(px === 0, `${tag}: no avalanche under reduced motion`);
    else check(px > 500, `${tag}: view change runs the avalanche (${px} lit px)`);
    await page.waitForTimeout(1400);
    check(await avalanchePixels(page) === 0, `${tag}: avalanche clears itself`);

    // Caption sigil follows the project, with its real hash.
    let hash = await page.textContent('.caption__hash');
    check(hash === `sha256 ${sha('Mutagen').slice(0, 12)}…`, `${tag}: caption shows sha256("Mutagen") (${hash})`);
    await page.click('[data-step="1"]'); await page.waitForTimeout(500);
    hash = await page.textContent('.caption__hash');
    check(hash === `sha256 ${sha('Vigil').slice(0, 12)}…`, `${tag}: stepping updates the hash (${hash})`);

    // Probe: an IPv4 readout on open space, a lock + verify over a control.
    await page.mouse.move(200, 200); await page.waitForTimeout(500);
    const read = await page.textContent('.probe__read');
    check(/^\d+\.\d+\.\d+\.\d+\/32$/.test(read), `${tag}: probe reads the address under the pointer (${read})`);
    const box = await page.locator('.caption__open').boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2); await page.waitForTimeout(700);
    const lock = await page.evaluate(() => ({ cls: document.querySelector('.probe').className, text: document.querySelector('.probe__read').textContent }));
    check(lock.cls.includes('is-verified') && lock.text.includes('verified'), `${tag}: probe locks on and verifies a control (${lock.text})`);
    await page.screenshot({ path: `${SHOTS}/address-work-${tag}.png` });

    // Terminal: hash command, and Ctrl+K from home.
    await page.fill('.term__in', 'hash vigil'); await page.press('.term__in', 'Enter'); await page.waitForTimeout(200);
    check((await page.textContent('.term__out')).includes(sha('Vigil')), `${tag}: terminal "hash vigil" prints the full digest`);
    await page.goto(BASE + '#/'); await page.waitForTimeout(900);
    await page.keyboard.press('Control+k'); await page.waitForTimeout(200);
    const focused = await page.evaluate(() => document.activeElement?.classList.contains('term__in') && getComputedStyle(document.querySelector('.term')).display !== 'none');
    check(focused, `${tag}: Ctrl+K summons the terminal on home`);
    await page.keyboard.press('Escape'); await page.waitForTimeout(100);
    check(await page.evaluate(() => getComputedStyle(document.querySelector('.term')).display === 'none'), `${tag}: and it tucks away again on blur`);

    // Perimeter tally ticks with motion, holds still without.
    const a = Number((await page.textContent('[data-blocked]')).replace(/,/g, ''));
    await page.waitForTimeout(4000);
    const b = Number((await page.textContent('[data-blocked]')).replace(/,/g, ''));
    if (reduced) check(a === b, `${tag}: perimeter tally holds still (${a})`);
    else check(b > a, `${tag}: perimeter tally counts deflected probes (${a} -> ${b})`);
    check(errors.length === 0, `${tag}: no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
  });
}

// Low-end device: a software rasteriser (SwiftShader) lands on the low tier —
// no post chain, fewer particles — and the whole site still works.
await withPage({ viewport: { width: 1280, height: 720 } }, async (page, errors) => {
  await live(page);
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => ({ tier: window.__stage?.tier, post: document.documentElement.classList.contains('post-live') }));
  check(info.tier === 'low' && !info.post, `low-end: software GPU runs the low tier without post (${JSON.stringify(info)})`);
  await page.click('.cue'); await page.waitForTimeout(1500);
  check(await page.evaluate(() => document.documentElement.dataset.view) === 'work', 'low-end: views work');
  const fps = await page.evaluate(() => new Promise((res) => {
    let n = 0; const t0 = performance.now();
    const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(Math.round(n / 2)); };
    requestAnimationFrame(f);
  }));
  console.log(`info low-end: ~${fps} fps on SwiftShader (CPU-only rendering)`);
  await page.screenshot({ path: `${SHOTS}/address-lowend.png` });
  check(errors.length === 0, `low-end: no console errors ${JSON.stringify(errors)}`);
}, ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']);
