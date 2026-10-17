// The address-space layer: avalanche transitions, SHA-256 sigils, the probe
// cursor, Ctrl+K, the perimeter tally, and a low-end (software GPU) run.
// Needs the dev server: node tests/e2e/address.mjs
import { createHash } from 'node:crypto';
import { withPage, check, contrastOf, SHOTS, BASE } from './lib.mjs';

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
    check(/^10\.\d+\.\d+\.\d+\/32$/.test(read), `${tag}: probe reads a private 10.x address under the pointer, never a public one (${read})`);
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

    // Terminal: nmap maps the site; traceroute flies there hop by hop.
    await page.goto(BASE + '#/work'); await page.waitForTimeout(900);
    await page.fill('.term__in', 'nmap'); await page.press('.term__in', 'Enter'); await page.waitForTimeout(150);
    check((await page.textContent('.term__out')).includes('443/tcp'), `${tag}: terminal nmap lists the site's views as ports`);
    await page.fill('.term__in', 'traceroute signalhub'); await page.press('.term__in', 'Enter');
    await page.waitForTimeout(3200);
    check(page.url().endsWith('#/work/signalhub'), `${tag}: traceroute ends on the project (${page.url().split('#')[1]})`);

    // Contact: the message, really encrypted, as you type.
    await page.goto(BASE + '#/contact'); await page.waitForTimeout(1200);
    await page.fill('#contact-form textarea', 'hello from the test');
    await page.waitForTimeout(300);
    const ct = await page.textContent('.cipher__out');
    check(/^[0-9a-f]{40,}$/.test(ct) && !ct.includes('hello'), `${tag}: contact shows the AES-GCM ciphertext (${ct.slice(0, 16)}…)`);
    await page.fill('#contact-form textarea', 'hello from the test!');
    await page.waitForTimeout(300);
    check(await page.textContent('.cipher__out') !== ct, `${tag}: ciphertext changes with the message`);
    await page.goto(BASE + '#/'); await page.waitForTimeout(900);

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

// The establishing shot: once per session on home, letterboxed, copy held
// back until the camera lands; any input cuts it; never under reduced motion.
await withPage({ viewport: { width: 1440, height: 900 }, intro: true }, async (page, errors) => {
  await live(page);
  await page.waitForTimeout(300);
  const on = await page.evaluate(() => document.documentElement.classList.contains('is-intro'));
  check(on, 'intro: plays on a first visit to home');
  await page.waitForTimeout(1200);
  const y0 = await page.evaluate(() => window.__stage.camera.position.y);
  check(y0 > 4, `intro: camera starts high over the address space (y ${y0.toFixed(1)})`);
  await page.screenshot({ path: `${SHOTS}/intro-mid.png` });
  await page.waitForTimeout(6000);
  const after = await page.evaluate(() => ({ on: document.documentElement.classList.contains('is-intro'), op: getComputedStyle(document.querySelector('#home-title')).opacity, y: window.__stage.camera.position.y }));
  check(!after.on && Number(after.op) > 0.95 && Math.abs(after.y - 0.2) < 0.4, `intro: lands on the home mark and shows the copy (${JSON.stringify(after)})`);
  await page.reload(); await live(page); await page.waitForTimeout(300);
  check(!(await page.evaluate(() => document.documentElement.classList.contains('is-intro'))), 'intro: only once per session');
  check(errors.length === 0, `intro: no console errors ${JSON.stringify(errors)}`);
});
await withPage({ viewport: { width: 1440, height: 900 }, intro: true }, async (page) => {
  await live(page);
  await page.waitForTimeout(800);
  await page.keyboard.press('Space');
  await page.waitForTimeout(400);
  check(!(await page.evaluate(() => document.documentElement.classList.contains('is-intro'))), 'intro: a key press cuts it');
});
await withPage({ viewport: { width: 1440, height: 900 }, intro: true, reducedMotion: 'reduce' }, async (page) => {
  await live(page);
  await page.waitForTimeout(300);
  check(!(await page.evaluate(() => document.documentElement.classList.contains('is-intro'))), 'intro: never under reduced motion');
});

// Opening a project is a dolly zoom: the lens widens mid-move, then settles.
await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
  await live(page);
  await page.goto(BASE + '#/work'); await page.waitForTimeout(2200);
  const fovs = [];
  await page.click('.caption__open');
  for (let i = 0; i < 12; i++) { fovs.push(await page.evaluate(() => window.__stage.camera.fov)); await page.waitForTimeout(80); }
  await page.waitForTimeout(1600);
  const end = await page.evaluate(() => window.__stage.camera.fov);
  check(Math.max(...fovs) > 52 && Math.abs(end - 40) < 1.5, `dolly zoom: lens widens mid-move (peak ${Math.max(...fovs).toFixed(1)}°) and settles (${end.toFixed(1)}°)`);
  await page.screenshot({ path: `${SHOTS}/dolly-detail.png` });
});

// Each project opens with its own reveal (motion only); closing sinkholes the
// card through the hole; contact is across the event horizon.
for (const reduced of [false, true]) {
  const tag = reduced ? 'reduced' : 'motion';
  await withPage({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' }, async (page, errors) => {
    await live(page);
    const lit = () => page.evaluate(() => {
      const c = document.querySelector('.reveal');
      const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++;
      return n;
    });
    for (const id of ['mutagen', 'vigil', 'signalhub', 'proving-grounds', 'jarvis', 'homelab', 'who']) {
      await page.goto(BASE + '#/work'); await page.waitForTimeout(1200);
      await page.evaluate((id) => { location.hash = '#/work/' + id; }, id);
      await page.waitForTimeout(700);
      const n = await lit();
      if (reduced) check(n === 0, `${tag}: ${id} opens without a reveal effect`);
      else check(n > 300, `${tag}: ${id} opens with its own reveal (${n} px)`);
    }
    if (!reduced) {
      await page.waitForTimeout(1200);
      // Track the card's closest approach to the hole on every frame.
      const closest = await page.evaluate(() => new Promise((res) => {
        const card = window.__world.cards.cards.find((c) => c.project.id === 'who').mesh;
        let min = Infinity; const t0 = performance.now();
        const f = () => { min = Math.min(min, card.position.length()); if (performance.now() - t0 < 1500) requestAnimationFrame(f); else res(min); };
        location.hash = '#/work';
        requestAnimationFrame(f);
      }));
      check(closest < 1.2, `${tag}: closing a project sinkholes the card through the hole (closest ${closest.toFixed(2)})`);
    }
    await page.goto(BASE + '#/contact'); await page.waitForTimeout(2500);
    const dist = await page.evaluate(() => window.__stage.camera.position.length());
    check(dist < 3.5, `${tag}: contact puts the camera across the event horizon (${dist.toFixed(2)} from the hole)`);
    check(errors.length === 0, `${tag}: reveals - no console errors ${JSON.stringify(errors)}`);
  });
}

// Opening a project shows its "How it works" flow diagram: one node per
// stage, stepping on its own with motion, pinned by a click either way.
for (const reduced of [false, true]) {
  const tag = reduced ? 'reduced' : 'motion';
  await withPage({ viewport: { width: 1440, height: 900 }, reducedMotion: reduced ? 'reduce' : 'no-preference' }, async (page, errors) => {
    await live(page);
    const expect = { mutagen: 5, vigil: 3, signalhub: 3, 'proving-grounds': 3, jarvis: 5, homelab: 4, who: 4 };
    for (const [id, n] of Object.entries(expect)) {
      await page.goto(BASE + '#/work/' + id); await page.waitForTimeout(900);
      const nodes = await page.$$eval('.flow:not([hidden]) .flow__node', (b) => b.length);
      check(nodes === n, `${tag}: ${id} shows a ${n}-stage flow diagram (${nodes})`);
    }
    await page.goto(BASE + '#/work/mutagen'); await page.waitForTimeout(900);
    const first = await page.textContent('.flow__tag');
    await page.waitForTimeout(3000);
    const later = await page.textContent('.flow__tag');
    if (reduced) check(first === later, `${tag}: flow holds still (${later})`);
    else check(first !== later, `${tag}: flow steps on its own (${first} -> ${later})`);
    await page.click('.flow__nodes li:nth-child(4) .flow__node'); await page.waitForTimeout(200);
    const pinned = await page.evaluate(() => ({ tag: document.querySelector('.flow__tag').textContent, pressed: document.querySelector('.flow__nodes li:nth-child(4) .flow__node').getAttribute('aria-pressed') }));
    check(pinned.tag.includes('Patch') && pinned.pressed === 'true', `${tag}: clicking a node shows that stage (${pinned.tag})`);
    await page.waitForTimeout(3000);
    check((await page.textContent('.flow__tag')).includes('Patch'), `${tag}: a clicked node stays pinned`);
    const c = await contrastOf(page, '.flow__desc');
    check(c >= 4.5, `${tag}: flow text readable (${c.toFixed(2)}:1)`);
    check(errors.length === 0, `${tag}: flow - no console errors ${JSON.stringify(errors)}`);
  });
}

// The open card is a live screen synced to the diagram, and clicking it opens
// the full dossier.
await withPage({ viewport: { width: 1440, height: 900 } }, async (page, errors) => {
  await live(page);
  await page.goto(BASE + '#/work/vigil'); await page.waitForTimeout(1800);
  const live1 = await page.evaluate(() => window.__world.cards.cards.find((c) => c.project.id === 'vigil').live);
  check(live1, 'live card: the open card switches to its live screen');
  await page.click('.flow__nodes li:nth-child(3) .flow__node'); await page.waitForTimeout(300);
  const stage = await page.evaluate(() => window.__world.cards.cards.find((c) => c.project.id === 'vigil').drawnStage);
  check(stage === 2, `live card: follows the diagram's stage (${stage})`);
  const r = await page.evaluate(() => window.__world.cardRect('vigil'));
  await page.mouse.click(r.x + r.w / 2, r.y + r.h / 2); await page.waitForTimeout(1200);
  check(await page.$eval('#case-vigil', (d) => d.open), 'live card: clicking it opens the full dossier');
  await page.keyboard.press('Escape'); await page.waitForTimeout(700);
  await page.goto(BASE + '#/work'); await page.waitForTimeout(1800);
  const back = await page.evaluate(() => window.__world.cards.cards.find((c) => c.project.id === 'vigil').live);
  check(!back, 'live card: back in the ring it shows its still motif');
  check(errors.length === 0, `live card: no console errors ${JSON.stringify(errors)}`);
});

// Phones: the detail view's panels are tabs, the card fits the screen.
await withPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }, async (page, errors) => {
  await live(page);
  await page.goto(BASE + '#/work/mutagen'); await page.waitForTimeout(2600);
  const shown = () => page.evaluate(() => ['.detail', '.flow'].map((s) => getComputedStyle(document.querySelector(s)).display !== 'none'));
  check(JSON.stringify(await shown()) === '[false,false]', '390 tabs: opens on the card alone');
  const r = await page.evaluate(() => window.__world.cardRect('mutagen'));
  check(r.x >= -2 && r.x + r.w <= 392, `390 tabs: the open card fits the screen (${Math.round(r.x)}..${Math.round(r.x + r.w)})`);
  await page.tap('.dtabs [data-tab="flow"]'); await page.waitForTimeout(300);
  check(JSON.stringify(await shown()) === '[false,true]', '390 tabs: "How it works" shows the diagram');
  await page.tap('.dtabs [data-tab="info"]'); await page.waitForTimeout(300);
  check(JSON.stringify(await shown()) === '[true,false]', '390 tabs: "Details" shows the copy');
  check(await page.getAttribute('.dtabs [data-tab="info"]', 'aria-selected') === 'true', '390 tabs: selected tab is aria-selected');
  check(await page.evaluate(() => document.documentElement.dataset.view) === 'detail', '390 tabs: tapping tabs never closes the project');
  check(errors.length === 0, `390 tabs: no console errors ${JSON.stringify(errors)}`);
});
await withPage({ viewport: { width: 1440, height: 900 } }, async (page) => {
  await live(page);
  await page.goto(BASE + '#/work/mutagen'); await page.waitForTimeout(1500);
  const vis = await page.evaluate(() => ['.detail', '.flow', '.dtabs'].map((s) => getComputedStyle(document.querySelector(s)).display !== 'none'));
  check(JSON.stringify(vis) === '[true,true,false]', `desktop: detail + diagram both shown, no tabs (${JSON.stringify(vis)})`);
});

// Skills: broad domains with a plain hands-on / familiar badge, from
// src/skills.js; no technique lists or addresses anywhere in the copy.
await withPage({ viewport: { width: 1440, height: 900 } }, async (page, errors) => {
  await live(page);
  await page.goto(BASE + '#/work/who'); await page.waitForTimeout(1400);
  await page.click('.detail__dossier'); await page.waitForTimeout(1200);
  const cards = await page.$$eval('#case-who .skill-card', (c) => c.map((e) => e.querySelector('.skill-card__level').textContent));
  check(cards.length === 6 && cards.every((l) => l === 'Hands-on' || l === 'Familiar'), `skills: six domains, each Hands-on or Familiar (${cards.join(', ')})`);
  check((await page.textContent('#case-who .skills-map')).includes('Web cache attacks'), 'skills: lately-into tags shown');
  await page.screenshot({ path: `${SHOTS}/skills-map.png` });
  await page.keyboard.press('Escape'); await page.waitForTimeout(600);
  const html = await page.content();
  check(!/162\.254|169\.254|kerberoast|bloodhound/i.test(html), 'skills: no addresses or niche technique lists in the page');
  await page.goto(BASE + '#/work'); await page.waitForTimeout(800);
  await page.fill('.term__in', 'skills'); await page.press('.term__in', 'Enter'); await page.waitForTimeout(150);
  check((await page.textContent('.term__out')).includes('Cloud [familiar]'), 'skills: terminal "skills" lists the domains');
  check(errors.length === 0, `skills: no console errors ${JSON.stringify(errors)}`);
});
