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
