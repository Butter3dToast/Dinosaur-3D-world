import * as THREE from 'three';
import { R } from '../config.js';
import { PERIODS } from '../data/periods.js';
import { fbm } from './noise.js';
import { clamp, latLon } from '../util.js';

const BLOBS = PERIODS.map(p => p.blobs.map(([lat, lon, r]) => Object.assign(latLon(lat, lon), { r })));

/**
 * Terrain height at unit-sphere point (x, y, z) for period `idx`. Land is h > 0.
 * Continent mask (angular-distance blobs) + fBm detail + ridged mountain ranges.
 */
export function heightFor(x, y, z, idx) {
  let m = -.6;
  for (const b of BLOBS[idx]) {
    const d = Math.acos(clamp(x * b.x + y * b.y + z * b.z, -1, 1));
    const v = 1 - d / b.r;
    if (v > m) m = v;
  }
  const n = fbm(x * 1.7 + 3.1, y * 1.7, z * 1.7, 4) * .55 + fbm(x * 5.3, y * 5.3 + 7.7, z * 5.3, 3) * .16;
  const ridge = Math.max(0, .45 - Math.abs(fbm(x * 2.6, y * 2.6, z * 2.6 + 5, 3))) * 1.25 * clamp(m, 0, 1);
  return m * 1.05 + n + ridge - .32;
}

/** Height -> radial displacement from the sea-level sphere. */
export const disp = h => (h > 0 ? h * .18 + Math.pow(h, 2.2) * .45 : h * .35);

// Height at which each of the 5 palette colours applies.
const STOPS = [0, .07, .32, .62, .9];

/**
 * Builds the terrain and ocean meshes under `parent`.
 * apply(a, b, t) shows period a blended toward period b by t (0..1), which
 * animates continental drift during a period change.
 */
export function createTerrain(parent) {
  const geo = new THREE.IcosahedronGeometry(1, 28);   // non-indexed: one vertex per face corner
  const posAttr = geo.attributes.position;
  const VN = posAttr.count, unit = new Float32Array(posAttr.array);
  const colors = new Float32Array(VN * 3);
  const colorAttr = new THREE.BufferAttribute(colors, 3);
  geo.setAttribute('color', colorAttr);

  // De-duplicate corners into unique points so each height is computed once.
  const uid = new Int32Array(VN), ux = [], uy = [], uz = [], keyMap = new Map();
  for (let i = 0; i < VN; i++) {
    const x = unit[i * 3], y = unit[i * 3 + 1], z = unit[i * 3 + 2];
    const k = Math.round(x * 1e4) + ',' + Math.round(y * 1e4) + ',' + Math.round(z * 1e4);
    let id = keyMap.get(k);
    if (id === undefined) { id = ux.length; keyMap.set(k, id); ux.push(x); uy.push(y); uz.push(z); }
    uid[i] = id;
  }
  const UN = ux.length;
  const faceJitter = new Float32Array(VN / 3);
  for (let f = 0; f < faceJitter.length; f++) faceJitter[f] = .92 + Math.random() * .13;

  const H = PERIODS.map((p, idx) => {
    const a = new Float32Array(UN);
    for (let u = 0; u < UN; u++) a[u] = heightFor(ux[u], uy[u], uz[u], idx);
    return a;
  });
  const hu = new Float32Array(UN);

  const palettes = PERIODS.map(p => p.palette.map(c => new THREE.Color(c)));
  const deep = new THREE.Color('#0c2740'), shallow = new THREE.Color('#3f9196');
  const ca = new THREE.Color(), cb = new THREE.Color();

  function landColor(h, pal, out) {
    if (h <= 0) return out.copy(deep).lerp(shallow, clamp(1 + h * 2.6, 0, 1));
    if (h >= STOPS[4]) return out.copy(pal[4]);
    for (let i = 0; i < 4; i++) {
      if (h < STOPS[i + 1]) return out.copy(pal[i]).lerp(pal[i + 1], (h - STOPS[i]) / (STOPS[i + 1] - STOPS[i]));
    }
    return out.copy(pal[4]);
  }

  function apply(a, b, t) {
    const A = H[a], B = H[b];
    for (let u = 0; u < UN; u++) hu[u] = A[u] + (B[u] - A[u]) * t;

    const p = posAttr.array;
    for (let i = 0; i < VN; i++) {
      const r = R + disp(hu[uid[i]]);
      p[i * 3] = unit[i * 3] * r; p[i * 3 + 1] = unit[i * 3 + 1] * r; p[i * 3 + 2] = unit[i * 3 + 2] * r;
    }

    // Flat colour per face, from the face's mean height, with jitter for a low-poly look.
    const pa = palettes[a], pb = palettes[b];
    for (let i = 0, f = 0; i < VN; i += 3, f++) {
      const h = (hu[uid[i]] + hu[uid[i + 1]] + hu[uid[i + 2]]) / 3;
      landColor(h, pa, ca);
      if (t > 0) { landColor(h, pb, cb); ca.lerp(cb, t); }
      const j = faceJitter[f], r = ca.r * j, g = ca.g * j, bl = ca.b * j;
      for (let k = 0; k < 3; k++) { colors[(i + k) * 3] = r; colors[(i + k) * 3 + 1] = g; colors[(i + k) * 3 + 2] = bl; }
    }
    posAttr.needsUpdate = true; colorAttr.needsUpdate = true;
    geo.computeVertexNormals();   // non-indexed, so these are face normals: faceted shading
  }

  parent.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ vertexColors: true })));
  // Semi-transparent, so underwater terrain colours show through as depth.
  parent.add(new THREE.Mesh(new THREE.SphereGeometry(R, 96, 64),
    new THREE.MeshPhongMaterial({ color: 0x1d6a9e, shininess: 70, specular: 0x6f8fa8, transparent: true, opacity: .84 })));

  return { apply };
}
