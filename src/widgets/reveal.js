import { sha256Hex, bitsOf } from './sigil.js';

// Every project opens with its own effect, acting out what the project does,
// drawn on a 2D canvas over the scene round the card as it flies in (its
// screen rect is read every frame, so the effect tracks the card):
//   mutagen          — fuzz: bytes mutate over the card, a crash, then patched
//   vigil            — radar: a sweep finds the threats, contact confirmed
//   signalhub        — pipeline: packets stream in and assemble the card
//   proving-grounds  — CTF: a lock brute-forced open, flag captured
//   who              — identity: the SHA-256 sigil unfolds into the card
// Plain canvas, so it runs on every tier; nothing under reduced motion.
const DURATION = 1500;
const HEX = '0123456789abcdef';
const rnd = (n) => (Math.random() * n) | 0;
const hexByte = () => HEX[rnd(16)] + HEX[rnd(16)];
const clamp01 = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => 1 - Math.pow(1 - clamp01(x), 3);

function label(ctx, text, x, y, color, alpha) {
  ctx.globalAlpha = alpha;
  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = 'rgba(3,6,11,0.75)';
  const w = ctx.measureText(text).width;
  ctx.fillRect(x - 6, y - 14, w + 12, 20);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

const FX = {
  mutagen: {
    init: () => ({}),
    draw(ctx, t, r) {
      const fuzz = t < 0.72 ? 1 : 1 - (t - 0.72) / 0.28;
      ctx.font = '500 13px "JetBrains Mono", monospace';
      for (let i = 0; i < 70 * fuzz; i++) {
        const crash = t > 0.38 && t < 0.62 && Math.random() < 0.3;
        ctx.globalAlpha = 0.35 + Math.random() * 0.6;
        ctx.fillStyle = crash ? '#ff6b81' : Math.random() < 0.2 ? '#f2b45a' : '#7dd3fc';
        ctx.fillText(hexByte(), r.x + Math.random() * r.w, r.y + Math.random() * r.h);
      }
      // Glitch slices: rows of the card's area knocked sideways.
      for (let i = 0; i < 6 * fuzz; i++) {
        ctx.globalAlpha = 0.12 + Math.random() * 0.2;
        ctx.fillStyle = Math.random() < 0.5 ? '#7dd3fc' : '#ff6b81';
        ctx.fillRect(r.x + (Math.random() - 0.5) * 40, r.y + Math.random() * r.h, r.w * (0.3 + Math.random() * 0.7), 2 + Math.random() * 6);
      }
      ctx.globalAlpha = 1;
      if (t > 0.38 && t < 0.66) label(ctx, 'SIGSEGV · input mutated', r.x + 14, r.y - 12, '#ff6b81', 1);
      if (t >= 0.66) {
        const k = ease((t - 0.66) / 0.2);
        ctx.globalAlpha = k * (1 - clamp01((t - 0.9) / 0.1));
        ctx.strokeStyle = '#5eead4'; ctx.lineWidth = 2;
        ctx.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
        label(ctx, '✓ patched · fix proven', r.x + 14, r.y - 12, '#5eead4', ctx.globalAlpha);
      }
    },
  },
  vigil: {
    init: () => ({ blips: Array.from({ length: 7 }, () => [Math.random(), 0.2 + Math.random() * 0.75]) }),
    draw(ctx, t, r, st) {
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2, R = Math.hypot(r.w, r.h) * 0.62;
      const a = -Math.PI / 2 + t * Math.PI * 2 * 1.25;
      const fade = 1 - clamp01((t - 0.85) / 0.15);
      // Range rings.
      ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 1;
      for (let i = 1; i <= 3; i++) {
        ctx.globalAlpha = 0.25 * fade;
        ctx.beginPath(); ctx.arc(cx, cy, R * i / 3 * ease(t * 2), 0, Math.PI * 2); ctx.stroke();
      }
      // The sweep: a fading wedge behind the beam.
      for (let k = 0; k < 24; k++) {
        ctx.globalAlpha = (1 - k / 24) * 0.18 * fade;
        ctx.fillStyle = '#7dd3fc';
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, R, a - (k + 1) * 0.03, a - k * 0.03); ctx.closePath(); ctx.fill();
      }
      ctx.globalAlpha = 0.9 * fade; ctx.strokeStyle = '#e0f7ff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke();
      // Threat blips light up as the beam passes them, then fade.
      st.blips.forEach(([u, d]) => {
        const ba = -Math.PI / 2 + u * Math.PI * 2;
        let since = a - ba; since -= Math.floor(since / (Math.PI * 2)) * Math.PI * 2;
        if (t * Math.PI * 2 * 1.25 < u * Math.PI * 2) return;
        const glow = Math.exp(-since * 1.4) * fade;
        ctx.globalAlpha = glow; ctx.fillStyle = '#ff6b81';
        ctx.beginPath(); ctx.arc(cx + Math.cos(ba) * R * d, cy + Math.sin(ba) * R * d, 4 + 4 * glow, 0, Math.PI * 2); ctx.fill();
      });
      ctx.globalAlpha = 1;
      if (t > 0.62) label(ctx, '◉ contact confirmed · human decides', r.x + 14, r.y - 12, '#7dd3fc', fade);
    },
  },
  signalhub: {
    init: (r) => ({
      packets: Array.from({ length: 90 }, () => {
        const side = rnd(4);
        const sx = side === 0 ? -20 : side === 1 ? innerWidth + 20 : Math.random() * innerWidth;
        const sy = side === 2 ? -20 : side === 3 ? innerHeight + 20 : Math.random() * innerHeight;
        return { sx, sy, u: Math.random(), v: Math.random(), delay: Math.random() * 0.35 };
      }),
    }),
    draw(ctx, t, r, st) {
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      const fade = 1 - clamp01((t - 0.85) / 0.15);
      const at = (p, k) => {
        const ex = r.x + p.u * r.w, ey = r.y + p.v * r.h;
        const mx = (p.sx + cx) / 2, my = (p.sy + cy) / 2 - 80;
        const a = (1 - k) * (1 - k), b = 2 * (1 - k) * k, c = k * k;
        return [a * p.sx + b * mx + c * ex, a * p.sy + b * my + c * ey];
      };
      ctx.lineWidth = 1.5;
      st.packets.forEach((p) => {
        const k = ease((t - p.delay) / 0.5);
        if (k <= 0) return;
        const [x0, y0] = at(p, Math.max(0, k - 0.12)), [x1, y1] = at(p, k);
        ctx.globalAlpha = 0.7 * fade; ctx.strokeStyle = '#f2b45a';
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
        ctx.globalAlpha = fade; ctx.fillStyle = k >= 1 ? '#fff3d6' : '#f2b45a';
        ctx.fillRect(x1 - 2, y1 - 2, 4, 4);
      });
      ctx.globalAlpha = 1;
      if (t > 0.7) {
        ctx.globalAlpha = (1 - clamp01((t - 0.7) / 0.3)) * 0.9;
        ctx.strokeStyle = '#f2b45a'; ctx.lineWidth = 2;
        ctx.strokeRect(r.x - 4, r.y - 4, r.w + 8, r.h + 8);
        label(ctx, '▸ dashboard assembled', r.x + 14, r.y - 12, '#f2b45a', ctx.globalAlpha);
      }
    },
  },
  'proving-grounds': {
    init: () => ({ sparks: Array.from({ length: 40 }, () => [Math.random() * Math.PI * 2, 0.4 + Math.random() * 0.6]) }),
    draw(ctx, t, r, st) {
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      const s = Math.min(r.w, r.h) * 0.22;
      const open = ease((t - 0.58) / 0.18);
      const fade = 1 - clamp01((t - 0.86) / 0.14);
      ctx.globalAlpha = fade;
      ctx.strokeStyle = open > 0 ? '#5eead4' : '#c4b5fd'; ctx.lineWidth = Math.max(3, s * 0.12);
      // Shackle lifts as the lock cracks.
      ctx.beginPath(); ctx.arc(cx, cy - s * 0.35 - open * s * 0.45, s * 0.42, Math.PI, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(3,6,11,0.85)';
      ctx.fillRect(cx - s * 0.65, cy - s * 0.35, s * 1.3, s);
      ctx.strokeRect(cx - s * 0.65, cy - s * 0.35, s * 1.3, s);
      // Brute force: a key counter spinning until it hits.
      ctx.font = `600 ${Math.max(12, s * 0.22) | 0}px "JetBrains Mono", monospace`;
      ctx.textAlign = 'center';
      ctx.fillStyle = open > 0 ? '#5eead4' : '#c4b5fd';
      const key = open > 0 ? 'FLAG{...}' : `0x${Array.from({ length: 6 }, () => HEX[rnd(16)]).join('')}`;
      ctx.fillText(key, cx, cy + s * 0.25);
      if (open > 0) {
        st.sparks.forEach(([a, sp]) => {
          const d = open * s * 3 * sp;
          ctx.globalAlpha = (1 - open) * fade;
          ctx.fillStyle = '#5eead4';
          ctx.fillRect(cx + Math.cos(a) * d - 2, cy + Math.sin(a) * d - 2, 4, 4);
        });
      }
      ctx.globalAlpha = 1; ctx.textAlign = 'left';
      label(ctx, open > 0 ? '⚑ flag captured' : 'brute-forcing…', r.x + 14, r.y - 12, open > 0 ? '#5eead4' : '#c4b5fd', fade);
    },
  },
  who: {
    init: (r, project) => {
      const st = { bits: null };
      sha256Hex(project.title).then((hex) => { if (hex) st.bits = bitsOf(hex); });
      return st;
    },
    draw(ctx, t, r, st) {
      if (!st.bits) return;
      const k = ease(t / 0.6);
      const fade = 1 - clamp01((t - 0.7) / 0.3);
      const cx = r.x + r.w / 2, cy = r.y + r.h / 2;
      const size = Math.max(r.w, r.h) * (0.15 + 0.85 * k);
      const cell = size / 16;
      ctx.fillStyle = '#7dd3fc';
      for (let i = 0; i < 256; i++) {
        if (!st.bits[i]) continue;
        const x = cx - size / 2 + (i % 16) * cell, y = cy - size / 2 + ((i / 16) | 0) * cell * (r.h / r.w);
        ctx.globalAlpha = fade * (0.25 + 0.5 * (1 - k));
        ctx.fillRect(x + 1, y + 1, cell - 2, cell * (r.h / r.w) - 2);
      }
      ctx.globalAlpha = 1;
      label(ctx, 'sha256 identity · unfolding', r.x + 14, r.y - 12, '#7dd3fc', fade);
    },
  },
};

export function createReveal({ reduced, rectOf, projectOf }) {
  const canvas = document.createElement('canvas');
  canvas.className = 'reveal';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.append(canvas);
  const ctx = canvas.getContext('2d');
  let raf = 0, run = null;
  const size = () => {
    const dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  size();
  addEventListener('resize', size, { passive: true });

  function frame(now) {
    const t = (now - run.t0) / DURATION;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    const r = rectOf(run.id);
    if (t >= 1 || !r) { run = null; raf = 0; return; }
    run.fx.draw(ctx, t, r, run.state);
    raf = requestAnimationFrame(frame);
  }
  return {
    play(id) {
      const fx = FX[id];
      if (!fx || reduced()) return false;
      cancelAnimationFrame(raf);
      const r = rectOf(id) || { x: innerWidth / 2 - 200, y: innerHeight / 2 - 125, w: 400, h: 250 };
      run = { id, fx, t0: performance.now(), state: fx.init(r, projectOf(id)) };
      raf = requestAnimationFrame(frame);
      return true;
    },
    stop() { cancelAnimationFrame(raf); raf = 0; run = null; ctx.clearRect(0, 0, innerWidth, innerHeight); },
    get playing() { return run?.id ?? null; },
  };
}
