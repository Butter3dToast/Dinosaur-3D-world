import './color-setup.js';   // must stay the first import (see file)
import './style.css';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DAY_LEN, AXIAL_TILT } from './config.js';
import { createTerrain } from './world/terrain.js';
import { createSky, SUN_DIR } from './world/sky.js';
import { createFlora } from './world/flora.js';
import { Sim } from './life/sim.js';
import { createHUD } from './ui/hud.js';
import { smooth } from './util.js';

const START_PERIOD = 2;        // Cretaceous
const MORPH_SECONDS = 2.6;     // continental drift animation on period change
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- renderer, camera, controls ---------- */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;   // match r128 output (see color-setup.js)
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setSize(innerWidth, innerHeight);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#04070c');
const camera = new THREE.PerspectiveCamera(42, innerWidth / innerHeight, .05, 3000);
camera.position.set(0, 7, innerWidth < 640 ? 40 : 31);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = .08; controls.enablePan = false;
controls.minDistance = 11.6; controls.maxDistance = 75; controls.rotateSpeed = .6;

/* ---------- world ---------- */
// tilt holds the axial tilt; spin turns once per day. Everything on the planet is a child of spin.
const tilt = new THREE.Group(); tilt.rotation.z = AXIAL_TILT; scene.add(tilt);
const spin = new THREE.Group(); tilt.add(spin);

const sky = createSky(scene, tilt, spin);
const terrain = createTerrain(spin);
const flora = createFlora(spin);
const sim = new Sim(spin, START_PERIOD);

let morph = null, day = 1, speed = 1, paused = false;

const hud = createHUD({
  sim,
  getDay: () => day,
  onPeriod: goPeriod,
  onSpeed: s => { speed = s; },
  onPause: p => { paused = p; },
});

/* ---------- period changes ---------- */
// Animals die off, terrain morphs to the new layout, then trees and animals return.
function goPeriod(idx) {
  if (idx === sim.period || morph) return;
  morph = { from: sim.period, to: idx, t: 0 };
  sim.startPeriodChange(idx);
  flora.setVisible(false);
  hud.closeInfo(); hud.render();
}

function finishPeriod() {
  terrain.apply(sim.period, sim.period, 0);
  flora.build(sim.period); flora.setVisible(true);
  sim.populate();
}

/* ---------- picking ---------- */
// A tap (pointer moved under 6 px) on an animal opens its card; a tap elsewhere closes it.
const ray = new THREE.Raycaster(), pointer = new THREE.Vector2();
let downAt = null;
canvas.addEventListener('pointerdown', e => { downAt = [e.clientX, e.clientY]; });
canvas.addEventListener('pointerup', e => {
  if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
  downAt = null;
  pointer.set(e.clientX / innerWidth * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  ray.setFromCamera(pointer, camera);
  const hits = ray.intersectObjects(sim.dinos.filter(d => !d.dying).map(d => d.root), true);
  if (hits.length) {
    let o = hits[0].object;
    while (o && !o.userData.dino) o = o.parent;
    if (o) hud.openInfo(o.userData.dino.key, o.userData.dino);
  } else hud.closeInfo();
});

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

/* ---------- loop ---------- */
finishPeriod(); hud.render();
const loading = document.getElementById('loading');
loading.style.opacity = 0; setTimeout(() => loading.remove(), 700);

const timer = new THREE.Timer(); timer.connect(document);   // Timer pauses cleanly when the tab is hidden
const _wq = new THREE.Quaternion();
let uiT = 0;

function frame(timestamp) {
  timer.update(timestamp);
  const rdt = Math.min(timer.getDelta(), .05);
  const sdt = paused ? 0 : rdt * speed * (reduceMotion ? .5 : 1);
  day += sdt / DAY_LEN;
  spin.rotation.y += sdt * Math.PI * 2 / DAY_LEN;
  sky.update(sdt);
  spin.getWorldQuaternion(_wq); sim.sunLocal.copy(SUN_DIR).applyQuaternion(_wq.invert());

  if (morph) {
    morph.t += rdt / MORPH_SECONDS;
    if (morph.t >= 1) { morph = null; finishPeriod(); hud.render(); }
    else terrain.apply(morph.from, morph.to, smooth(morph.t));
  }
  sim.update(sdt, rdt);
  flora.update(sim.time, sim.sunLocal);

  uiT += rdt; if (uiT > .4) { uiT = 0; hud.updateCounts(); }
  controls.update();
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(frame);
