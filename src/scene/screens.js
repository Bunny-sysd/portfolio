// Procedural "screens" for the glass cards: one original Canvas2D motif per
// project, plus its title in the site's mono face. Drawn once (and again once
// the web font has loaded), then used as a texture.
export const SCREEN_W = 640;
export const SCREEN_H = 400;

const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

const MOTIFS = {
  // Mutation grid: a hex dump with a few bytes "mutated" in the accent.
  mutagen(g, w, h, accent, r) {
    g.font = '500 15px "JetBrains Mono", monospace';
    for (let y = 40; y < h - 20; y += 22) {
      for (let x = 24, i = 0; x < w - 30; x += 34, i++) {
        const hot = r() < 0.08;
        g.fillStyle = hot ? accent : 'rgba(200,230,240,0.22)';
        g.fillText((r() * 256 | 0).toString(16).padStart(2, '0'), x, y);
      }
    }
  },
  // Radar sweep with blips.
  vigil(g, w, h, accent, r) {
    const cx = w * 0.7, cy = h * 0.5;
    g.strokeStyle = 'rgba(200,230,240,0.2)';
    for (let k = 1; k <= 4; k++) { g.beginPath(); g.arc(cx, cy, k * 42, 0, Math.PI * 2); g.stroke(); }
    const grad = g.createConicGradient(-Math.PI / 2, cx, cy);
    grad.addColorStop(0, accent); grad.addColorStop(0.18, 'rgba(0,0,0,0)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = 0.45; g.fillStyle = grad; g.beginPath(); g.arc(cx, cy, 168, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1;
    g.fillStyle = accent;
    for (let i = 0; i < 9; i++) { const a = r() * 6.28, d = 30 + r() * 130; g.beginPath(); g.arc(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 3, 0, 6.28); g.fill(); }
  },
  // Price line over a faint grid.
  signalhub(g, w, h, accent, r) {
    g.strokeStyle = 'rgba(200,230,240,0.1)';
    for (let x = 0; x < w; x += 40) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h); g.stroke(); }
    for (let y = 0; y < h; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
    g.strokeStyle = accent; g.lineWidth = 2.5; g.beginPath();
    let y = h * 0.6;
    for (let x = 0; x <= w; x += 8) { y = Math.min(h - 30, Math.max(60, y + (r() - 0.52) * 26)); x ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.stroke(); g.lineWidth = 1;
  },
  // A ladder of ranks with the top rung lit.
  'proving-grounds'(g, w, h, accent, r) {
    for (let i = 0; i < 9; i++) {
      const y = 50 + i * 34, len = w * (0.25 + 0.6 * (1 - i / 9)) * (0.85 + r() * 0.15);
      g.fillStyle = i === 0 ? accent : 'rgba(200,230,240,0.14)';
      g.fillRect(w - 24 - len, y, len, 14);
    }
  },
  // Concentric "fingerprint" rings.
  who(g, w, h, accent, r) {
    const cx = w * 0.72, cy = h * 0.52;
    for (let k = 0; k < 16; k++) {
      g.strokeStyle = k % 5 === 0 ? accent : 'rgba(200,230,240,0.2)';
      g.beginPath();
      g.ellipse(cx, cy, 14 + k * 9, 20 + k * 11, 0.2, r() * 0.8, Math.PI * 2 - r() * 0.8);
      g.stroke();
    }
  },
};

export function drawScreen(canvas, project, index, total) {
  const g = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const accent = `hsl(${Math.round(project.hue * 360)} 80% 62%)`;
  const r = rand(17 + index * 101);
  g.clearRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, 'rgba(6,14,22,0.92)'); bg.addColorStop(1, 'rgba(10,8,22,0.82)');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  MOTIFS[project.id]?.(g, w, h, accent, r);
  // Title block, bottom-left.
  g.fillStyle = 'rgba(2,4,10,0.55)'; g.fillRect(0, h - 132, w, 132);
  g.fillStyle = accent;
  g.font = '500 14px "JetBrains Mono", monospace';
  g.fillText(`${String(index + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}  ·  ${project.kind.toUpperCase()}`, 28, h - 96);
  g.fillStyle = '#f8fafc';
  g.font = '700 44px "JetBrains Mono", monospace';
  g.fillText(project.title.toUpperCase(), 28, h - 44);
}

// The open card's live screen: the stage the flow diagram is on (synced via
// widgets/live-state.js), its explanation, a console typing the project's
// real commands, and the way into the dossier. Redrawn ~15×/s while open.
const CHAR_MS = 28, HOLD_MS = 900;
function wrap(g, text, maxW) {
  const out = []; let line = '';
  for (const word of text.split(' ')) {
    const t = line ? `${line} ${word}` : word;
    if (g.measureText(t).width > maxW && line) { out.push(line); line = word; } else line = t;
  }
  if (line) out.push(line);
  return out;
}
export function drawLive(canvas, project, index, total, { stage, stageT, now, reduced, stepMs }) {
  const g = canvas.getContext('2d');
  const w = canvas.width, h = canvas.height;
  const accent = `hsl(${Math.round(project.hue * 360)} 80% 62%)`;
  const text1 = '#e6faff', dim = 'rgba(200,230,240,0.5)';
  g.clearRect(0, 0, w, h);
  const bg = g.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, 'rgba(4,10,18,0.94)'); bg.addColorStop(1, 'rgba(8,6,20,0.9)');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  // The project's motif, faint, as a watermark.
  g.globalAlpha = 0.16; MOTIFS[project.id]?.(g, w, h, accent, rand(17 + index * 101)); g.globalAlpha = 1;

  // Top bar: live dot, title, stage counter.
  g.fillStyle = 'rgba(2,4,10,0.6)'; g.fillRect(0, 0, w, 40);
  g.fillStyle = accent; g.fillRect(0, 40, w, 1);
  const blink = reduced || Math.floor(now / 600) % 2 === 0;
  g.fillStyle = blink ? '#ff5d73' : 'rgba(255,93,115,0.35)';
  g.beginPath(); g.arc(22, 20, 5, 0, Math.PI * 2); g.fill();
  g.font = '600 13px "JetBrains Mono", monospace';
  g.fillStyle = '#f8fafc'; g.fillText(`LIVE · ${project.title.toUpperCase()}`, 36, 25);
  const steps = project.flow || [];
  const si = Math.max(0, Math.min(stage, steps.length - 1));
  g.textAlign = 'right'; g.fillStyle = accent;
  g.fillText(`STAGE ${String(si + 1).padStart(2, '0')}/${String(steps.length).padStart(2, '0')}`, w - 20, 25);
  g.textAlign = 'left';

  // Left: stage ring (fills over the stage's time), name, explanation.
  const k = reduced ? 1 : Math.min(1, stageT / stepMs);
  const cx = 60, cy = 96;
  g.lineWidth = 3; g.strokeStyle = 'rgba(200,230,240,0.15)';
  g.beginPath(); g.arc(cx, cy, 28, 0, Math.PI * 2); g.stroke();
  g.strokeStyle = accent;
  g.beginPath(); g.arc(cx, cy, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); g.stroke();
  g.font = '700 19px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillStyle = '#f8fafc';
  g.fillText(String(si + 1).padStart(2, '0'), cx, cy + 7); g.textAlign = 'left';
  const [name = '', text = ''] = steps[si] || [];
  g.font = '700 20px "JetBrains Mono", monospace'; g.fillStyle = '#f8fafc';
  wrap(g, name.toUpperCase(), 180).slice(0, 2).forEach((l, i) => g.fillText(l, 100, 92 + i * 24));
  g.font = '400 14px "Space Grotesk", sans-serif'; g.fillStyle = 'rgba(232,242,248,0.88)';
  wrap(g, text, 262).slice(0, 7).forEach((l, i) => g.fillText(l, 22, 160 + i * 21));

  // Right: a console typing the project's real commands, looping.
  const x0 = 300, y0 = 58, cw = w - x0 - 18, ch = 266;
  g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(x0, y0, cw, ch);
  g.strokeStyle = 'rgba(200,230,240,0.18)'; g.lineWidth = 1; g.strokeRect(x0 + 0.5, y0 + 0.5, cw - 1, ch - 1);
  g.font = '500 11px "JetBrains Mono", monospace'; g.fillStyle = accent;
  g.fillText('CONSOLE', x0 + 12, y0 + 18);
  const lines = project.console || [];
  g.font = '500 12px "JetBrains Mono", monospace';
  const cost = lines.map((l) => l.length * CHAR_MS + HOLD_MS);
  const cycle = cost.reduce((a, b) => a + b, 0) || 1;
  let t = reduced ? Infinity : now % cycle, cur = reduced ? lines.length - 1 : 0;
  if (!reduced) while (cur < lines.length - 1 && t >= cost[cur]) t -= cost[cur++];
  let y = y0 + 42, cursorAt = null;
  for (let i = 0; i <= cur; i++) {
    const full = lines[i];
    const shown = i < cur || reduced ? full : full.slice(0, Math.min(full.length, Math.floor(t / CHAR_MS)));
    const rows = wrap(g, shown, cw - 34);
    for (const row of rows.length ? rows : ['']) {
      if (y > y0 + ch - 10) break;
      const isHead = row === rows[0] && /^[$>]/.test(row);
      if (isHead) {
        g.fillStyle = accent; g.fillText(row[0], x0 + 12, y);
        g.fillStyle = i === cur ? text1 : dim; g.fillText(row.slice(1), x0 + 12 + g.measureText(row[0]).width, y);
      } else { g.fillStyle = i === cur ? text1 : dim; g.fillText(row, x0 + 24, y); }
      cursorAt = [x0 + (isHead ? 12 : 24) + g.measureText(row).width + 3, y];
      y += 18;
    }
  }
  if (cursorAt && (reduced || Math.floor(now / 450) % 2 === 0)) { g.fillStyle = accent; g.fillRect(cursorAt[0], cursorAt[1] - 11, 7, 13); }

  // Bottom: stats, and the way in.
  g.fillStyle = 'rgba(2,4,10,0.62)'; g.fillRect(0, h - 56, w, 56);
  g.fillStyle = accent; g.fillRect(0, h - 56, w, 1);
  g.font = '500 10px "JetBrains Mono", monospace';
  let sx = 18;
  for (const s of (project.stats || []).slice(0, 3)) {
    const label = s.toUpperCase();
    const tw = g.measureText(label).width + 14;
    if (sx + tw > w - 190) break;
    g.strokeStyle = accent; g.strokeRect(sx + 0.5, h - 40.5, tw, 22);
    g.fillStyle = text1; g.fillText(label, sx + 7, h - 25);
    sx += tw + 8;
  }
  g.font = '600 11px "JetBrains Mono", monospace';
  g.textAlign = 'right'; g.fillStyle = blink ? accent : 'rgba(200,230,240,0.6)';
  g.fillText('CLICK · FULL DOSSIER ↗', w - 18, h - 25); g.textAlign = 'left';
  // Scanlines.
  g.fillStyle = 'rgba(0,0,0,0.12)';
  for (let yy = 0; yy < h; yy += 3) g.fillRect(0, yy, w, 1);
}
