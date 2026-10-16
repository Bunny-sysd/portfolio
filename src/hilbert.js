// Hilbert curve helpers. The site treats the screen (and the floor of the
// world) as an address space laid out the way IPv4 census maps and binary
// visualisers (binvis) lay one out: a space-filling curve, so neighbouring
// addresses stay neighbours on the plane.

// Index d along a curve of side n (a power of two) → cell (x, y).
export function d2xy(n, d) {
  let x = 0, y = 0, t = d;
  for (let s = 1; s < n; s *= 2) {
    const rx = 1 & (t / 2);
    const ry = 1 & (t ^ rx);
    if (ry === 0) {
      if (rx === 1) { x = s - 1 - x; y = s - 1 - y; }
      [x, y] = [y, x];
    }
    x += s * rx; y += s * ry;
    t = Math.floor(t / 4);
  }
  return [x, y];
}

// Cell (x, y) → index d. Uses plain arithmetic, not bit ops, so order 16
// (a 65536² grid, 2^32 cells) stays exact past 32-bit integers.
export function xy2d(n, x, y) {
  let d = 0;
  for (let s = n / 2; s >= 1; s = Math.floor(s / 2)) {
    const rx = (x & s) > 0 ? 1 : 0;
    const ry = (y & s) > 0 ? 1 : 0;
    d += s * s * ((3 * rx) ^ ry);
    if (ry === 0) {
      if (rx === 1) { x = s - 1 - x; y = s - 1 - y; }
      [x, y] = [y, x];
    }
  }
  return d;
}

// A point in [0,1)² → its IPv4 address on an order-16 Hilbert map of the
// whole address space (each of the 2^32 cells is one address).
export function toIPv4(u, v) {
  const N = 65536;
  const x = Math.min(N - 1, Math.max(0, Math.floor(u * N)));
  const y = Math.min(N - 1, Math.max(0, Math.floor(v * N)));
  const d = xy2d(N, x, y);
  return [24, 16, 8, 0].map((sh) => Math.floor(d / 2 ** sh) % 256).join('.');
}
