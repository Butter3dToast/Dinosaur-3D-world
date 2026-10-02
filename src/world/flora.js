import * as THREE from 'three';
import { R } from '../config.js';
import { PERIODS } from '../data/periods.js';
import { heightFor, disp } from './terrain.js';
import { clamp, randDir, glowTexture } from '../util.js';

const MAX_TREES = 900;
const UP = new THREE.Vector3(0, 1, 0);

/** Trees (instanced cones on green land bands) and volcano glows on the highest peaks. */
export function createFlora(parent) {
  const treeGeo = new THREE.ConeGeometry(.055, .2, 5); treeGeo.translate(0, .1, 0);
  const trees = new THREE.InstancedMesh(treeGeo,
    new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true, shininess: 4 }), MAX_TREES);
  parent.add(trees);

  const lavaTex = glowTexture('rgba(255,200,120,1)', 'rgba(255,70,20,0)');
  const volcanoes = [];
  let visible = true;

  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), v = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();

  function buildTrees(idx) {
    const P = PERIODS[idx], base = new THREE.Color(P.treeColor);
    let n = 0, tries = 0;
    while (n < P.treeCount && tries < P.treeCount * 12) {
      tries++;
      const d = randDir(), h = heightFor(d.x, d.y, d.z, idx);
      if (h < .08 || h > .62) continue;
      q.setFromUnitVectors(UP, d);
      const sc = .7 + Math.random() * .7; s.set(sc, sc * (.8 + Math.random() * .5), sc);
      v.copy(d).multiplyScalar(R + disp(h) - .01);
      trees.setMatrixAt(n, m4.compose(v, q, s));
      trees.setColorAt(n, c.copy(base).multiplyScalar(.8 + Math.random() * .35));
      n++;
    }
    trees.count = n;
    trees.instanceMatrix.needsUpdate = true;
    if (trees.instanceColor) trees.instanceColor.needsUpdate = true;
    trees.computeBoundingSphere();   // modern three caches this for frustum culling
  }

  function buildVolcanoes(idx) {
    volcanoes.forEach(vo => { parent.remove(vo.sprite); vo.sprite.material.dispose(); });
    volcanoes.length = 0;
    const cand = [];
    for (let i = 0; i < 3500; i++) { const d = randDir(); cand.push([heightFor(d.x, d.y, d.z, idx), d]); }
    cand.sort((a, b) => b[0] - a[0]);
    for (const [h, d] of cand) {
      if (volcanoes.length >= 5 || h < .5) break;
      if (volcanoes.some(vo => vo.p.angleTo(d) < .6)) continue;
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: lavaTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      sprite.position.copy(d).multiplyScalar(R + disp(h) + .05); sprite.scale.setScalar(.9);
      parent.add(sprite);
      volcanoes.push({ sprite, p: d, ph: Math.random() * 6 });
    }
  }

  return {
    build(idx) { buildTrees(idx); buildVolcanoes(idx); },
    setVisible(on) { visible = on; trees.visible = on; },
    /** Volcano glow is brighter on the night side and flickers slightly. */
    update(time, sunLocal) {
      for (const vo of volcanoes) {
        vo.sprite.visible = visible;
        const night = clamp(-vo.p.dot(sunLocal) * 3 + .25, .12, 1);
        vo.sprite.material.opacity = night * (.75 + .25 * Math.sin(time * 3 + vo.ph));
      }
    },
  };
}
