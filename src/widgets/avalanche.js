// View transitions as a hash avalanche: a wavefront of bit-cells sweeps out
// from where you acted, and — like a one-bit change to a hash input — about
// half the cells it crosses flip. A plain 2D canvas over the scene (so it runs
// on every tier, with or without WebGL), drawn only while a wave is live.
const CELL = 18, BAND = 240, SPEED = 2600; // px, px, px/s

export function createAvalanche(canvas, { reduced }) {
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, cols = 0, rows = 0, raf = 0;
  let wave = null;
  const resize = () => {
    w = canvas.width = innerWidth; h = canvas.height = innerHeight;
    cols = Math.ceil(w / CELL); rows = Math.ceil(h / CELL);
  };
  resize();
  addEventListener('resize', resize, { passive: true });

  // Cheap per-cell coin, reseeded per wave so each transition flips a
  // different half.
  const coin = (i, seed) => {
    let x = (i * 374761393 + seed * 668265263) | 0;
    x = (x ^ (x >>> 13)) * 1274126177;
    return ((x ^ (x >>> 16)) >>> 0) / 4294967296;
  };

  function draw(now) {
    const r = ((now - wave.t0) / 1000) * SPEED;
    ctx.clearRect(0, 0, w, h);
    const inner = Math.max(0, r - BAND);
    // Only the cells inside the band's bounding box are visited.
    const c0 = Math.max(0, Math.floor((wave.x - r) / CELL)), c1 = Math.min(cols - 1, Math.ceil((wave.x + r) / CELL));
    const r0 = Math.max(0, Math.floor((wave.y - r) / CELL)), r1 = Math.min(rows - 1, Math.ceil((wave.y + r) / CELL));
    for (let cy = r0; cy <= r1; cy++) {
      for (let cx = c0; cx <= c1; cx++) {
        const px = cx * CELL + CELL / 2, py = cy * CELL + CELL / 2;
        const d = Math.hypot(px - wave.x, py - wave.y);
        if (d > r || d < inner) continue;
        const i = cy * cols + cx;
        if (coin(i, wave.seed) > 0.5) continue;
        const k = (d - inner) / BAND; // 0 at the trailing edge → 1 at the front
        ctx.globalAlpha = k * k * 0.55;
        ctx.fillStyle = k > 0.92 ? '#e0f7ff' : coin(i, wave.seed + 1) > 0.85 ? '#f2b45a' : '#7DD3FC';
        ctx.fillRect(cx * CELL + 3, cy * CELL + 3, CELL - 6, CELL - 6);
      }
    }
    ctx.globalAlpha = 1;
    if (inner < Math.hypot(w, h)) raf = requestAnimationFrame(draw);
    else { ctx.clearRect(0, 0, w, h); wave = null; raf = 0; }
  }

  return {
    trigger(x = w / 2, y = h / 2) {
      if (reduced()) return false;
      cancelAnimationFrame(raf);
      wave = { x, y, t0: performance.now(), seed: (Math.random() * 1e6) | 0 };
      raf = requestAnimationFrame(draw);
      return true;
    },
    get active() { return !!wave; },
  };
}
