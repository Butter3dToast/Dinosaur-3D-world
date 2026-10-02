import * as THREE from 'three';
import { R } from '../config.js';
import { PERIODS } from '../data/periods.js';
import { SPECIES } from '../data/species.js';
import { heightFor, disp } from '../world/terrain.js';
import { buildAnimal, buildNest } from './models.js';
import { randDir, smooth } from '../util.js';

export const STAGES = ['Hatchling', 'Juvenile', 'Adult', 'Elder'];
const CAP = { land: 7, fly: 6, sea: 5 };   // population cap per species, by kind

const _q = new THREE.Quaternion(), _axis = new THREE.Vector3(), _np = new THREE.Vector3();
const _right = new THREE.Vector3(), _basis = new THREE.Matrix4();

/** Random unit tangent to the sphere at p. */
function tangent(p) {
  const t = randDir(); t.addScaledVector(p, -t.dot(p));
  return t.normalize();
}

/** Point obj's +Y along `up` and +Z along `fwd`. */
function orient(obj, up, fwd) {
  _right.crossVectors(up, fwd).normalize();
  _basis.makeBasis(_right, up, fwd);
  obj.quaternion.setFromRotationMatrix(_basis);
}

/**
 * One animal. Position is a unit vector; it moves along great circles with a
 * little random wander, and turns away from terrain it can't enter.
 */
class Dino {
  constructor(sim, key, pos, ageFrac, newborn) {
    this.sim = sim; this.key = key; this.sp = SPECIES[key]; this.kind = this.sp.kind;
    this.pos = pos.clone(); this.fwd = tangent(pos);
    this.life = 150 + Math.random() * 60; this.age = ageFrac * this.life;
    this.root = new THREE.Group(); this.model = buildAnimal(this.sp);
    this.root.add(this.model); this.root.userData.dino = this;
    this.phase = Math.random() * 6; this.breed = 12 + Math.random() * 25; this.dying = 0;
    this.speed = (this.kind === 'fly' ? .42 : this.kind === 'sea' ? .14 : .07) * (.8 + Math.random() * .4);
    this.alt = R + .9 + Math.random() * .25;
    this.altNow = newborn && this.kind === 'fly' ? R + .25 : this.alt;   // fledglings climb to cruising height
    this.h = sim.heightAt(this.pos);
    sim.parent.add(this.root);
    this.place();
  }

  get f() { return this.age / this.life; }
  stage() { const f = this.f; return f < .12 ? 0 : f < .3 ? 1 : f < .85 ? 2 : 3; }
  kill() { if (!this.dying) this.dying = .0001; }
  growth() { return .35 + .65 * smooth(this.f / .3); }

  place() {
    let r;
    if (this.kind === 'land') r = R + disp(this.h);
    else if (this.kind === 'sea') r = R - .012 + Math.sin(this.phase * .5) * .01;
    else r = this.altNow + Math.sin(this.phase * .15) * .06;
    this.root.position.copy(this.pos).multiplyScalar(r);
    orient(this.root, this.pos, this.fwd);
    const k = this.dying ? Math.max(0, 1 - this.dying) : 1;   // shrink while dying
    this.model.scale.setScalar(this.sp.size * this.growth() * k);
  }

  /** sdt: simulation seconds (scaled by speed), rdt: real seconds. Returns false once gone. */
  update(sdt, rdt) {
    const sim = this.sim;
    if (this.dying) {
      this.dying += rdt / 2.2;
      if (this.dying >= 1) { sim.parent.remove(this.root); return false; }
      this.place(); return true;
    }
    this.age += sdt;
    if (this.f >= 1) { this.kill(); return true; }

    const night = this.pos.dot(sim.sunLocal) < -.08, sleeping = night && this.kind === 'land', st = this.stage();
    const spd = sleeping ? 0 : this.speed * (st === 3 ? .6 : 1) * (this.kind === 'fly' && night ? .6 : 1);
    if (spd > 0 && sdt > 0) {
      _q.setFromAxisAngle(this.pos, (Math.random() - .5) * 1.6 * sdt); this.fwd.applyQuaternion(_q);
      _axis.crossVectors(this.pos, this.fwd).normalize(); _q.setFromAxisAngle(_axis, spd * sdt / R);
      _np.copy(this.pos).applyQuaternion(_q);
      if (sim.valid[this.kind](_np)) {
        this.pos.copy(_np).normalize(); this.fwd.applyQuaternion(_q);
        if (this.kind === 'land') this.h = sim.heightAt(this.pos);
      } else {
        _q.setFromAxisAngle(this.pos, Math.PI * (.6 + Math.random() * .8)); this.fwd.applyQuaternion(_q);
      }
      this.fwd.addScaledVector(this.pos, -this.fwd.dot(this.pos)).normalize();
      this.phase += sdt * (this.kind === 'land' ? spd * 90 : 6);
    } else if (this.kind !== 'land') this.phase += sdt * 3;
    if (this.kind === 'fly') this.altNow += (this.alt - this.altNow) * Math.min(1, sdt * .4);

    const ud = this.model.userData, moving = spd > 0 && sdt > 0;
    if (ud.legs) {
      const sw = moving ? .5 : 0;
      ud.legs.forEach((l, i) => {
        const off = ud.biped ? (i ? Math.PI : 0) : ((i === 0 || i === 3) ? 0 : Math.PI);   // quadrupeds: diagonal pairs
        l.rotation.x = Math.sin(this.phase + off) * sw;
      });
    }
    if (ud.wings) { const a = Math.sin(this.phase * 2.2) * .55; ud.wings[0].rotation.z = a; ud.wings[1].rotation.z = -a; }
    if (ud.flippers) ud.flippers.forEach((f, i) => { f.rotation.z = Math.sin(this.phase * 1.6 + (i < 2 ? 0 : 1.5)) * .35 * (i % 2 ? -1 : 1); });

    if (st === 2 && !sleeping) {
      this.breed -= sdt;
      if (this.breed <= 0) { this.breed = 28 + Math.random() * 28; sim.tryBreed(this); }
    }
    this.place(); return true;
  }
}

/** Eggs that hatch into 1–2 young after about 22 sim-seconds. */
class Nest {
  constructor(sim, key, pos) {
    this.sim = sim; this.key = key; this.sp = SPECIES[key]; this.pos = pos.clone();
    this.t = 22 + Math.random() * 8;
    this.root = buildNest(this.sp.size); this.eggs = this.root.userData.eggs;
    this.root.position.copy(pos).multiplyScalar(R + disp(sim.heightAt(pos)));
    orient(this.root, pos, tangent(pos));
    sim.parent.add(this.root);
  }

  update(sdt) {
    const sim = this.sim;
    this.t -= sdt;
    if (this.t < 5) this.eggs.forEach((e, i) => { e.rotation.z = Math.sin(sim.time * 12 + i * 2) * .25; });
    if (this.t <= 0) {
      const n = Math.random() < .65 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        if (sim.countSpecies(this.key) < CAP[this.sp.kind] + 1) sim.dinos.push(new Dino(sim, this.key, this.pos, 0, true));
      }
      this.remove(); return false;
    }
    return true;
  }

  remove() { this.sim.parent.remove(this.root); }
}

/** All living animals and nests for the current period. */
export class Sim {
  constructor(parent, period) {
    this.parent = parent;            // the spinning planet group
    this.period = period;
    this.enabled = new Set(PERIODS[period].species);
    this.dinos = []; this.nests = [];
    this.time = 0;
    this.sunLocal = new THREE.Vector3();   // sun direction in planet space; set each frame
    this.locked = false;             // true during a period change: no breeding, toggling or migration
    this.migrateT = 0;
    this.valid = {
      land: v => { const h = this.heightAt(v); return h > .02 && h < .95; },
      sea: v => this.heightAt(v) < -.06,
      fly: () => true,
    };
  }

  heightAt(v) { return heightFor(v.x, v.y, v.z, this.period); }

  countSpecies(k) {
    let n = 0;
    for (const d of this.dinos) if (d.key === k && !d.dying) n++;
    for (const s of this.nests) if (s.key === k) n++;
    return n;
  }

  stats() {
    let adults = 0, young = 0;
    for (const d of this.dinos) { if (d.dying) continue; if (d.stage() < 2) young++; else adults++; }
    return { adults, young, nests: this.nests.length };
  }

  /** Egg-layers make a nest nearby; live-bearers give birth to a juvenile directly. */
  tryBreed(d) {
    if (this.locked || !this.enabled.has(d.key) || this.countSpecies(d.key) >= CAP[d.kind]) return;
    if (d.sp.live) {
      const p = this.nearPoint(d.pos, .03, this.valid.sea);
      if (p) this.dinos.push(new Dino(this, d.key, p, .02, true));
      return;
    }
    const p = this.nearPoint(d.pos, d.kind === 'fly' ? .12 : .03, v => { const h = this.heightAt(v); return h > .04 && h < .8; });
    if (p) this.nests.push(new Nest(this, d.key, p));
  }

  spawnSpecies(k, n) {
    const kind = SPECIES[k].kind;
    const test = kind === 'land' ? (v => { const h = this.heightAt(v); return h > .06 && h < .75; })
      : kind === 'sea' ? (v => this.heightAt(v) < -.15) : (() => true);
    for (let i = 0; i < n; i++) {
      const p = this.randomPoint(test);
      if (p) this.dinos.push(new Dino(this, k, p, .15 + Math.random() * .6));
    }
  }

  removeSpecies(k) {
    this.dinos.forEach(d => { if (d.key === k) d.kill(); });
    for (let i = this.nests.length - 1; i >= 0; i--) {
      if (this.nests[i].key === k) { this.nests[i].remove(); this.nests.splice(i, 1); }
    }
  }

  /** Show or hide a species on the globe. Ignored during a period change. */
  toggleSpecies(k) {
    if (this.locked) return;
    if (this.enabled.has(k)) { this.enabled.delete(k); this.removeSpecies(k); }
    else { this.enabled.add(k); this.spawnSpecies(k, 3); }
  }

  /** Everything alive dies off and the sim locks until populate() is called. */
  startPeriodChange(idx) {
    this.dinos.forEach(d => d.kill());
    this.nests.forEach(n => n.remove()); this.nests.length = 0;
    this.period = idx;
    this.enabled = new Set(PERIODS[idx].species);
    this.locked = true;
  }

  /** Spawn the opening population for the current period and unlock. */
  populate() {
    this.locked = false;
    for (const k of PERIODS[this.period].species) {
      if (this.enabled.has(k)) this.spawnSpecies(k, SPECIES[k].kind === 'sea' ? 3 : 4);
    }
  }

  update(sdt, rdt) {
    this.time += sdt;
    for (let i = this.dinos.length - 1; i >= 0; i--) if (!this.dinos[i].update(sdt, rdt)) this.dinos.splice(i, 1);
    for (let i = this.nests.length - 1; i >= 0; i--) if (!this.nests[i].update(sdt)) this.nests.splice(i, 1);
    // If an enabled species dies out, two new adults arrive.
    this.migrateT += sdt;
    if (this.migrateT > 10 && !this.locked) {
      this.migrateT = 0;
      this.enabled.forEach(k => { if (this.countSpecies(k) === 0) this.spawnSpecies(k, 2); });
    }
  }

  randomPoint(test) {
    for (let i = 0; i < 600; i++) { const d = randDir(); if (test(d)) return d; }
    return null;
  }

  nearPoint(base, spread, test) {
    for (let i = 0; i < 16; i++) {
      const d = base.clone().add(randDir().multiplyScalar(spread)).normalize();
      if (test(d)) return d;
    }
    return null;
  }
}
