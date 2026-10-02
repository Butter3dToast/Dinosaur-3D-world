// 3D value noise with a Math.sin hash. Fine visually but not fast; a simplex
// noise library is the planned replacement (see CLAUDE.md, known limitations).

function hash(x, y, z) {
  const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return s - Math.floor(s);
}

function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const a = hash(xi, yi, zi), b = hash(xi + 1, yi, zi), c = hash(xi, yi + 1, zi), d = hash(xi + 1, yi + 1, zi);
  const e = hash(xi, yi, zi + 1), f = hash(xi + 1, yi, zi + 1), g = hash(xi, yi + 1, zi + 1), h = hash(xi + 1, yi + 1, zi + 1);
  const x1 = a + (b - a) * u, x2 = c + (d - c) * u, x3 = e + (f - e) * u, x4 = g + (h - g) * u;
  const y1 = x1 + (x2 - x1) * v, y2 = x3 + (x4 - x3) * v;
  return y1 + (y2 - y1) * w;
}

/** Fractal (fBm) value noise in roughly [-1, 1]. */
export function fbm(x, y, z, octaves) {
  let s = 0, a = .5, f = 1;
  for (let i = 0; i < octaves; i++) {
    s += a * (vnoise(x * f, y * f, z * f) * 2 - 1);
    f *= 2.03; a *= .5;
  }
  return s;
}
