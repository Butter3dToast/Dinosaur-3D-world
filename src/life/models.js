import * as THREE from 'three';

// Block-built animals from shared primitives. Each model faces +Z with +Y up;
// legs, wings and flippers are pivot groups the simulation rotates.
// Flat-shaded Phong: r128 Lambert had no flatShading (modern Lambert does; revisit
// when real models replace these).

const G = {
  s: new THREE.SphereGeometry(1, 9, 7),
  b: new THREE.BoxGeometry(1, 1, 1),
  c: new THREE.ConeGeometry(1, 1, 6),
  y: new THREE.CylinderGeometry(1, 1, 1, 6),
};
const materials = {};
const M = c => materials[c] || (materials[c] = new THREE.MeshPhongMaterial({ color: c, flatShading: true, shininess: 6, specular: 0x111111 }));
const BONE = '#e6dcc2';
const HP = Math.PI / 2;

function part(g, m, px, py, pz, sx, sy, sz, rx, ry, rz) {
  const o = new THREE.Mesh(G[g], m);
  o.position.set(px, py, pz); o.scale.set(sx, sy, sz); o.rotation.set(rx || 0, ry || 0, rz || 0);
  return o;
}

function leg(x, y, z, len, rad, m) {
  const p = new THREE.Group(); p.position.set(x, y, z);
  p.add(part('y', m, 0, -len / 2, 0, rad, len, rad));
  p.add(part('s', m, 0, -len, .03, rad * 1.35, rad * .6, rad * 1.8));
  return p;
}

function buildBiped(sp) {
  const g = new THREE.Group(), m = M(sp.color), a = M(sp.accent), sl = sp.slim ? .8 : 1, hs = sp.head || 1, th = sp.thick ? 1.2 : 1;
  g.add(part('s', m, 0, .85, 0, .28 * sl * th, .3 * sl * th, .56));
  g.add(part('c', m, 0, .8, -1.05, .2 * sl * th, 1.1, .22 * sl * th, -HP - .08));
  if (sp.longNeck) {
    g.add(part('y', m, 0, 1.05, .55, .09, .62, .09, .9));
    g.add(part('s', m, 0, 1.27, .86, .1, .09, .16));
  } else {
    g.add(part('s', m, 0, 1.0, .45, .15 * sl, .17, .2));
    g.add(part('b', m, 0, 1.1, .66 + .06 * (hs - 1), .2 * hs * sl, .22 * hs, .38 * hs));
    g.add(part('b', a, 0, 1.0, .7 + .06 * (hs - 1), .16 * hs * sl, .06, .3 * hs));
  }
  const arm = sp.tinyArms ? .5 : 1;
  g.add(part('b', m, .17, .78, .42, .05, .05, .22 * arm, .6));
  g.add(part('b', m, -.17, .78, .42, .05, .05, .22 * arm, .6));
  if (sp.sail) g.add(part('s', a, 0, 1.25, -.05, .03, .4, .52));
  if (sp.crest) g.add(part('y', a, 0, 1.28, .48, .045, .5, .045, -1.0));
  const L = leg(.17, .75, 0, .72, .075 * sl * th, m), Rr = leg(-.17, .75, 0, .72, .075 * sl * th, m);
  g.add(L, Rr);
  g.userData.legs = [L, Rr]; g.userData.biped = true;
  return g;
}

function buildSauro(sp) {
  const g = new THREE.Group(), m = M(sp.color), fl = sp.frontLeg || 1, nl = sp.neck || 1, nt = sp.neckTilt ?? .7, tl = sp.tailLen || 1.5;
  const body = new THREE.Group(); body.rotation.x = -(fl - 1) * .45; g.add(body);
  body.add(part('s', m, 0, 1.0, 0, .42, .38, .72));
  const neck = new THREE.Group(); neck.position.set(0, 1.12, .55); neck.rotation.x = nt; body.add(neck);
  neck.add(part('y', m, 0, nl / 2, 0, .1, nl, .1));
  neck.add(part('s', m, 0, nl + .02, .08, .11, .1, .2, -nt * .85));
  body.add(part('c', m, 0, .95, -.7 - tl / 2, .2, tl, .24, -HP - .06));
  const legs = [leg(.24, .05 + .8 * fl, .42, .8 * fl, .11, m), leg(-.24, .05 + .8 * fl, .42, .8 * fl, .11, m), leg(.24, .85, -.42, .8, .12, m), leg(-.24, .85, -.42, .8, .12, m)];
  legs.forEach(l => g.add(l)); g.userData.legs = legs;
  return g;
}

function buildCera(sp) {
  const g = new THREE.Group(), m = M(sp.color), a = M(sp.accent), b = M(BONE);
  g.add(part('s', m, 0, .62, 0, .4, .35, .62));
  g.add(part('b', m, 0, .62, .72, .26, .28, .38, .15));
  g.add(part('c', b, 0, .53, .95, .07, .14, .07, 1.98));
  g.add(part('y', a, 0, .86, .5, .36, .04, .32, HP - .45));
  g.add(part('c', b, .1, .86, .86, .035, .34, .035, 1.15));
  g.add(part('c', b, -.1, .86, .86, .035, .34, .035, 1.15));
  g.add(part('c', b, 0, .72, .95, .03, .14, .03, .9));
  g.add(part('c', m, 0, .6, -.85, .15, .6, .15, -HP - .1));
  const legs = [leg(.24, .45, .36, .42, .09, m), leg(-.24, .45, .36, .42, .09, m), leg(.24, .45, -.36, .42, .1, m), leg(-.24, .45, -.36, .42, .1, m)];
  legs.forEach(l => g.add(l)); g.userData.legs = legs;
  return g;
}

function buildStego(sp) {
  const g = new THREE.Group(), m = M(sp.color), a = M(sp.accent), b = M(BONE);
  g.add(part('s', m, 0, .72, 0, .34, .36, .62, .12));
  g.add(part('s', m, 0, .5, .62, .1, .1, .22, .3));
  g.add(part('s', m, 0, .42, .82, .09, .09, .15));
  for (let i = 0; i < 7; i++) {
    const s = 1 - Math.abs(i - 3) / 4.5;
    g.add(part('b', a, i % 2 ? .05 : -.05, 1.0 + .15 * s, .48 - i * .17, .03, .3 * s + .06, .24 * s + .05, 0, 0, i % 2 ? -.12 : .12));
  }
  g.add(part('c', m, 0, .75, -1.0, .16, .9, .17, -HP + .05));
  [[.1, -1.28, -1], [-.1, -1.28, 1], [.09, -1.4, -1], [-.09, -1.4, 1]].forEach(([x, z, s]) => g.add(part('c', b, x, .84, z, .025, .28, .025, 0, 0, s)));
  const legs = [leg(.2, .42, .38, .4, .08, m), leg(-.2, .42, .38, .4, .08, m), leg(.22, .62, -.32, .6, .1, m), leg(-.22, .62, -.32, .6, .1, m)];
  legs.forEach(l => g.add(l)); g.userData.legs = legs;
  return g;
}

function buildAnky(sp) {
  const g = new THREE.Group(), m = M(sp.color), a = M(sp.accent), b = M(BONE);
  g.add(part('s', m, 0, .45, 0, .44, .24, .62));
  g.add(part('s', a, 0, .53, 0, .4, .17, .57));
  for (let i = 0; i < 6; i++) g.add(part('c', b, (i % 2 ? .15 : -.15), .68, .35 - i * .14, .04, .1, .04));
  [.3, 0, -.3].forEach(z => {
    g.add(part('c', b, .43, .45, z, .035, .18, .035, 0, 0, -1.4));
    g.add(part('c', b, -.43, .45, z, .035, .18, .035, 0, 0, 1.4));
  });
  g.add(part('b', m, 0, .42, .68, .24, .18, .24));
  g.add(part('c', m, 0, .42, -.95, .1, .7, .1, -HP));
  g.add(part('s', b, 0, .42, -1.32, .13, .09, .14));
  const legs = [leg(.26, .3, .34, .28, .08, m), leg(-.26, .3, .34, .28, .08, m), leg(.26, .3, -.34, .28, .09, m), leg(-.26, .3, -.34, .28, .09, m)];
  legs.forEach(l => g.add(l)); g.userData.legs = legs;
  return g;
}

function buildPtero(sp) {
  const g = new THREE.Group(), m = M(sp.color), a = M(sp.accent), b = M(BONE);
  g.add(part('s', m, 0, 0, 0, .1, .09, .3));
  g.add(part('s', m, 0, .05, .32, .07, .07, .1));
  g.add(part('c', b, 0, .04, .47, .025, .24, .03, HP));
  if (sp.crest) g.add(part('c', a, 0, .1, .2, .025, .32, .03, -HP + .3));
  if (sp.tail) {
    g.add(part('y', m, 0, 0, -.5, .012, .5, .012, HP));
    g.add(part('b', a, 0, 0, -.77, .01, .09, .07));
  }
  const wl = new THREE.Group(), wr = new THREE.Group();
  wl.position.set(.08, .02, 0); wr.position.set(-.08, .02, 0);
  wl.add(part('b', a, .5, 0, .02, 1.0, .015, .32)); wl.add(part('b', a, 1.12, 0, -.04, .32, .012, .18));
  wr.add(part('b', a, -.5, 0, .02, 1.0, .015, .32)); wr.add(part('b', a, -1.12, 0, -.04, .32, .012, .18));
  g.add(wl, wr); g.userData.wings = [wl, wr];
  return g;
}

function buildSea(sp) {
  const g = new THREE.Group(), m = M(sp.color), a = M(sp.accent), fl = [];
  if (sp.variant === 'plesio') {
    g.add(part('s', m, 0, 0, 0, .28, .13, .42));
    g.add(part('y', m, 0, .06, .75, .06, .7, .06, HP - .15));
    g.add(part('s', m, 0, .11, 1.12, .07, .06, .11));
    g.add(part('c', m, 0, 0, -.6, .08, .4, .08, -HP));
    [[.34, .2], [-.34, .2], [.32, -.22], [-.32, -.22]].forEach(([x, z]) => {
      const f = part('b', a, x, -.03, z, .36, .02, .1, 0, x > 0 ? -.35 : .35, 0); g.add(f); fl.push(f);
    });
  } else {
    g.add(part('s', m, 0, 0, 0, .18, .15, .72));
    g.add(part('b', m, 0, .02, .82, .14, .12, .36));
    g.add(part('c', m, 0, 0, -1.08, .12, .8, .1, -HP));
    g.add(part('b', a, 0, -.06, -1.45, .02, .28, .2, .5));
    [[.24, .32], [-.24, .32], [.2, -.3], [-.2, -.3]].forEach(([x, z]) => {
      const f = part('b', a, x, -.06, z, .22, .02, .08); g.add(f); fl.push(f);
    });
  }
  g.userData.flippers = fl;
  return g;
}

const BUILD = { biped: buildBiped, sauro: buildSauro, cera: buildCera, stego: buildStego, anky: buildAnky, ptero: buildPtero, sea: buildSea };

/** Model for a species entry from data/species.js, at unit scale. */
export function buildAnimal(sp) {
  return BUILD[sp.body](sp);
}

/** Nest with three eggs; the eggs are in userData.eggs so they can wobble before hatching. */
export function buildNest(speciesSize) {
  const g = new THREE.Group(), eggs = [];
  g.add(part('y', M('#6b5134'), 0, .03, 0, .55, .06, .55));
  for (let i = 0; i < 3; i++) {
    const a = i / 3 * Math.PI * 2;
    const e = part('s', M('#efe6cf'), Math.cos(a) * .18, .15, Math.sin(a) * .18, .14, .18, .14);
    g.add(e); eggs.push(e);
  }
  g.scale.setScalar(Math.max(.06, speciesSize * .6));
  g.userData.eggs = eggs;
  return g;
}
