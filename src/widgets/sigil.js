// Identity, the cryptographic way: each project's mark is its real SHA-256
// digest (of its title), drawn as a 16×16 grid — exactly 256 bits. Changing
// project shows the avalanche effect honestly: the two digests differ in about
// half their bits, and those cells flip in a cascade from one corner.

export async function sha256Hex(text) {
  if (!globalThis.crypto?.subtle) return null; // insecure context: no sigil
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function bitsOf(hex) {
  const bits = new Uint8Array(256);
  for (let i = 0; i < 64; i++) {
    const n = parseInt(hex[i], 16);
    for (let b = 0; b < 4; b++) bits[i * 4 + b] = (n >> (3 - b)) & 1;
  }
  return bits;
}

export function createSigil(canvas, { reduced, color = '#7DD3FC' }) {
  const N = 16, CELL = 4, GAP = 1;
  const size = N * (CELL + GAP) - GAP;
  const dpr = Math.min(2, devicePixelRatio || 1);
  canvas.width = canvas.height = size * dpr;
  canvas.style.width = canvas.style.height = `${size}px`;
  const ctx = canvas.getContext('2d');
  let shown = new Uint8Array(256), target = shown, flipAt = new Float32Array(256), start = 0, raf = 0, token = 0;

  const draw = (now) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, size, size);
    let pending = false;
    for (let i = 0; i < 256; i++) {
      const x = (i % N) * (CELL + GAP), y = ((i / N) | 0) * (CELL + GAP);
      let on = shown[i];
      let flash = 0;
      if (target[i] !== shown[i]) {
        const t = now - start - flipAt[i];
        if (t >= 0) { on = target[i]; flash = Math.max(0, 1 - t / 260); }
        if (t < 260) pending = true;
      }
      ctx.globalAlpha = on ? 0.95 : 0.13;
      ctx.fillStyle = flash > 0 ? '#ffffff' : color;
      ctx.fillRect(x, y, CELL, CELL);
    }
    ctx.globalAlpha = 1;
    if (pending) raf = requestAnimationFrame(draw);
    else { shown = target; raf = 0; }
  };

  return {
    async set(text) {
      const my = ++token;
      const hex = await sha256Hex(text);
      if (my !== token || !hex) return hex;
      cancelAnimationFrame(raf);
      target = bitsOf(hex);
      // Cascade outwards from the top-left bit, with a little jitter.
      for (let i = 0; i < 256; i++) flipAt[i] = reduced() ? 0 : (Math.hypot(i % N, (i / N) | 0) * 26 + Math.random() * 60);
      start = performance.now();
      if (reduced()) { shown = target; draw(start); } else raf = requestAnimationFrame(draw);
      return hex;
    },
  };
}
