import { PERIODS } from '../data/periods.js';
import { SPECIES } from '../data/species.js';
import { STAGES } from '../life/sim.js';

/**
 * Title panel, stats, timeline, species chips, info card and speed controls.
 * The markup lives in index.html; this module fills and wires it.
 */
export function createHUD({ sim, getDay, onPeriod, onSpeed, onPause }) {
  const $ = id => document.getElementById(id);
  const strata = $('strata'), chips = $('chips'), info = $('info');

  // Timeline segments sized by each period's length in millions of years.
  PERIODS.forEach((p, i) => {
    const b = document.createElement('button');
    b.className = 'seg';
    b.style.setProperty('--c', p.color); b.style.setProperty('--w', p.from - p.to);
    b.innerHTML = `<strong>${p.name}</strong><small>${p.from}–${p.to} Mya</small>`;
    b.onclick = () => onPeriod(i);
    strata.appendChild(b);
  });

  function render() {
    const P = PERIODS[sim.period];
    [...strata.children].forEach((b, i) => b.setAttribute('aria-pressed', i === sim.period));
    $('title').style.setProperty('--era', P.color);
    $('era-name').textContent = `${P.name}, ${P.from} to ${P.to} million years ago`;
    $('era-blurb').textContent = P.blurb;
    chips.innerHTML = '';
    P.species.forEach(k => {
      const s = SPECIES[k], b = document.createElement('button');
      b.className = 'chip' + (sim.enabled.has(k) ? '' : ' off'); b.dataset.k = k;
      b.style.setProperty('--c', s.color);
      b.innerHTML = `<i></i>${s.name}<em></em>`;
      b.onclick = () => openInfo(k);
      chips.appendChild(b);
    });
    updateCounts();
  }

  function updateCounts() {
    [...chips.children].forEach(b => {
      const k = b.dataset.k;
      b.querySelector('em').textContent = sim.enabled.has(k) ? sim.countSpecies(k) : '';
    });
    const { adults, young, nests } = sim.stats();
    $('s-adult').textContent = adults; $('s-young').textContent = young;
    $('s-nest').textContent = nests; $('s-day').textContent = Math.floor(getDay());
  }

  /** Info card for species k; `individual` (a tapped animal) adds its life stage. */
  function openInfo(k, individual) {
    const s = SPECIES[k], on = sim.enabled.has(k), P = PERIODS[sim.period];
    info.innerHTML = `<button class="close" aria-label="Close">×</button><h2>${s.name}</h2>
      <dl class="facts"><dt>Lived</dt><dd>${P.name}</dd><dt>Diet</dt><dd>${s.diet}</dd><dt>Size</dt><dd>${s.len}</dd>
      ${individual ? `<dt>This one</dt><dd>${STAGES[individual.stage()]}</dd>` : ''}</dl>
      <p>${s.fact}</p>
      ${s.notDino ? `<p class="note">${s.kind === 'fly'
        ? 'Pterosaurs were flying reptiles, close cousins of dinosaurs but not dinosaurs themselves.'
        : 'Marine reptiles shared the Mesozoic seas with dinosaurs but were not dinosaurs.'}</p>` : ''}
      <p class="note">${s.live ? 'Life cycle: born live, juvenile, adult, elder.' : 'Life cycle: egg, hatchling, juvenile, adult, elder.'} Animals are drawn larger than true scale so you can see them.</p>
      <button class="toggle">${on ? 'Hide from globe' : 'Show on globe'}</button>`;
    info.hidden = false;
    info.querySelector('.close').onclick = closeInfo;
    info.querySelector('.toggle').onclick = () => {
      if (sim.locked) return;
      sim.toggleSpecies(k); render(); openInfo(k);
    };
  }

  function closeInfo() { info.hidden = true; }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeInfo(); });

  // Speed group: the first button toggles pause; the rest pick a speed and unpause.
  const speedBtns = [...document.querySelectorAll('#speed button')], pauseBtn = speedBtns[0];
  let paused = false;
  function setPaused(p) {
    paused = p;
    pauseBtn.textContent = p ? '▶' : '❚❚';
    pauseBtn.setAttribute('aria-label', p ? 'Play' : 'Pause');
    pauseBtn.setAttribute('aria-pressed', p);
    onPause(p);
  }
  pauseBtn.onclick = () => setPaused(!paused);
  speedBtns.slice(1).forEach(b => b.onclick = () => {
    onSpeed(+b.dataset.s);
    setPaused(false);
    speedBtns.slice(1).forEach(x => x.setAttribute('aria-pressed', x === b));
  });

  return { render, updateCounts, openInfo, closeInfo };
}
