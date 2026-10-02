# Mesozoic World: project handoff

## What this is

A browser-based 3D globe of the dinosaur age. The planet rotates slowly with a day and night cycle. Animals live through a full life cycle, and a timeline lets the viewer switch between the Triassic, Jurassic and Cretaceous periods.

A working single-file prototype already exists: `mesozoic-world.html` (Three.js r128, loaded from a CDN). This project turns that prototype into a proper, maintainable codebase and then extends it.

## Owner's original requirements

- The globe rotates at a speed slow enough to watch the world.
- It shows the world of the dinosaurs, back in the dinosaur age.
- It has a day and night cycle.
- It has a life cycle.
- It includes all types of dinosaurs. If that is too much, it has a timeline so the viewer can choose which dinosaurs or which period to watch. (We chose the timeline approach: there are well over a thousand named dinosaur genera, so each period shows a set of representative species.)

## Owner's working preferences

- Simple, uncluttered output. Prefer fewer, well-made features over many noisy ones.
- Honesty matters. Don't invent or exaggerate facts in the app's text. When something is approximate, say so in the UI.
- Explain the reasoning behind implementation choices; the owner wants an opinion on the best approach, not just code.

## Current prototype: how it works

All logic lives in one IIFE inside `mesozoic-world.html`.

**Scene.** The scene graph is a `tilt` group (axial tilt 0.32 rad) containing a `spin` group that rotates on Y. Terrain, ocean, clouds, trees, volcanoes, animals and nests are all children of `spin`, so everything turns with the planet. The sun is a fixed `DirectionalLight` along `SUN_DIR`, which produces day and night as the planet turns. Other scene elements are a starfield (Points), a sun sprite and a small orbiting moon.

**Constants.** `R = 10` is the planet radius. `DAY_LEN = 60` is seconds per rotation at 1× speed.

**Terrain.**
- The mesh is `IcosahedronGeometry(1, 28)`, which is non-indexed. Vertices are de-duplicated into unique points (`uid`, `ux/uy/uz`) so heights are computed once per point.
- `heightFor(x, y, z, periodIndex)` combines three ingredients:
  - a continent mask built from angular-distance "blobs" (lat, lon, radius) defined per period;
  - fBm value noise;
  - a ridged-noise term that forms mountain ranges.
  - Land is wherever `h > 0`.
- `disp(h)` converts height into radial displacement.
- Colour is set per face from a 5-stop palette per period, with small random jitter to give a low-poly look. Underwater faces are coloured from deep to shallow and show through the semi-transparent ocean sphere.
- Heights for all three periods are precomputed into `H[]`. `applyTerrain(a, b, t)` blends between two periods, which animates continental drift when the period changes (about 2.6 s).

**Other world layers.**
- Clouds are a canvas-generated noise texture on a sphere at `R * 1.075`.
- The atmosphere is a back-side additive fresnel shader that is brighter on the sunlit side.
- Trees are an `InstancedMesh` of cones placed on green land bands; their count and colour change per period.
- Volcanoes are additive glow sprites on the highest peaks, brighter at night.

**Animals.**
- Each one is built from shared primitive geometries. The builders are biped, sauro, cera, stego, anky, ptero and sea.
- Each model faces +Z with +Y up.
- Size is set by `sp.size` and deliberately exaggerated for visibility.
- Legs, wings and flippers are animated by rotating pivot groups.

**Simulation.**
- `class Dino` holds:
  - a position on the unit sphere and a tangent heading;
  - movement along great circles using quaternions;
  - random wandering;
  - a terrain validity check (land, sea or flying);
  - an age and lifespan, with stages Hatchling, Juvenile, Adult and Elder.
- Behaviour by kind:
  - Land animals rest at night.
  - Adults breed periodically. Egg-layers create a `Nest`, which hatches into 1–2 young after about 22 sim-seconds. Live-bearers (plesiosaurs, mosasaurs) spawn a juvenile directly.
  - Each species has a population cap (`CAP`).
  - Elders die with a shrink-and-sink animation.
  - If a species dies out while enabled, two new adults arrive every 10 s.
- Switching period kills all animals, morphs the terrain, then calls `finalizePeriod()`, which rebuilds trees and volcanoes and spawns the new species.

**UI.**
- Top left: a title panel with the period name and a short description.
- Top right: counts for Day, Adults, Young and Nests.
- Bottom dock:
  - a timeline strip with segment widths proportional to each period's length;
  - a row of species chips, which open an info card;
  - pause and speed buttons (½×, 1×, 2×, 4×).
- Tapping an animal raycasts against the animal groups and opens its info card, showing its current life stage. The info card can show or hide that species.

## Design decisions to keep

- **Period colours** are the International Commission on Stratigraphy chart colours: Triassic `#812B92`, Jurassic `#34B2C9`, Cretaceous `#7FC64E`.
- **Fonts:** Fraunces for headings, Atkinson Hyperlegible for body text.
- **Theme:** colour tokens live on `:root`, with dark-mode overrides. The space background is always dark.
- **Mobile:** layout is responsive and respects safe areas.
- **Accessibility:** reduced motion is respected and keyboard focus is visible.
- **Restraint:** the globe is the hero, and all UI stays small and quiet around it.

## Accuracy rules (important)

- Pterosaurs and marine reptiles must be labelled as not dinosaurs. The UI already does this.
- Species facts are kept conservative. When estimates vary, say "about" or "estimates vary".
- Continent shapes are approximations; don't present them as accurate palaeogeographic maps.
- Animal sizes on the globe are exaggerated, and the UI says so.
- No ice caps. The Mesozoic largely lacked large polar ice.
- Flowering plants only appear from the Cretaceous onward.

## Species currently included

**Triassic (252–201 Mya):** Eoraptor, Herrerasaurus, Coelophysis, Plateosaurus (bipedal), Eudimorphodon (pterosaur).

**Jurassic (201–145 Mya):** Brachiosaurus, Diplodocus, Allosaurus, Stegosaurus, Rhamphorhynchus (pterosaur), Plesiosaurus (marine reptile, Early Jurassic).

**Cretaceous (145–66 Mya):** Tyrannosaurus, Triceratops, Ankylosaurus, Parasaurolophus, Velociraptor, Spinosaurus, Pteranodon (pterosaur), Mosasaurus (marine reptile).

The facts, diet, length and colours for each species are in the `SP` object in the prototype. Move them into a data file such as `src/data/species.js` or `species.json`.

## Known limitations of the prototype

- It was tested headlessly (simulation logic, life cycle, period switching) but never visually reviewed, so check the look in a real browser first.
- It uses Three.js r128 from a CDN in a single file. Upgrade it to a modern `three` npm package with ES modules.
- In r128, `MeshLambertMaterial` doesn't support `flatShading`, so animals use flat-shaded `MeshPhongMaterial`. Terrain gets a faceted look from non-indexed normals. Re-check this after the upgrade.
- The noise hash is based on `Math.sin`, which is fine visually but slow-ish. A simplex noise library would be faster.
- All animals are block-built from primitives, so realism is limited.
- The full terrain is recomputed every frame during a period transition. That's acceptable at the current mesh detail.

## Step 1: restructure

1. Create a Vite project with Three.js: `npm create vite@latest` (vanilla JS), then `npm i three`.
2. Split the prototype into these modules:
   - `src/world/terrain.js` (noise, heights, palettes, morph)
   - `src/world/sky.js` (sun, stars, moon, atmosphere, clouds)
   - `src/world/flora.js` (trees, volcanoes)
   - `src/life/models.js` (animal builders)
   - `src/life/sim.js` (Dino, Nest, breeding, spawning)
   - `src/data/periods.js` and `src/data/species.js`
   - `src/ui/hud.js` (timeline, chips, info card, controls)
   - `src/main.js` (renderer, loop, picking)
3. Import OrbitControls from `three/addons/controls/OrbitControls.js`.
4. Confirm the app looks and behaves the same as the prototype before adding features.

**Status: done** (three r186, Vite 8). `mesozoic-world.html` stays at the root as the visual reference (served at `/mesozoic-world.html` by `npm run dev`). Upgrade decisions to keep in mind:
- `src/color-setup.js` disables three's colour management and `main.js` uses linear output, matching r128 so the tuned palette looks the same. It must stay the first import in `main.js`. Moving to a proper sRGB pipeline would mean retuning every colour.
- Light intensities are multiplied by π (`LEGACY_LIGHT` in `sky.js`) because r155+ dropped the legacy light scale.
- Clouds and atmosphere have explicit `renderOrder` so they draw after the ocean; concentric transparent spheres otherwise sort by creation order.
- `THREE.Timer` replaces the deprecated `Clock`. Small extras: `src/config.js` (R, DAY_LEN, tilt), `src/util.js`, `src/world/noise.js` (shared by terrain and clouds).

## Roadmap (in agreed priority order)

1. **Real animated models.** Replace the block animals with free, properly licensed (CC0 preferred) low-poly animated `.glb` dinosaurs. Use `GLTFLoader` and `AnimationMixer` to play walk, idle and sleep clips. Keep exaggerated scale and record each model's licence and source in `ASSETS.md`.
2. **Follow camera.** Tap an animal and choose "Follow" to have the camera track it smoothly near the surface. Exit with a button or Esc.
3. **End-Cretaceous impact.** An optional finale at 66 Mya: an asteroid streak, an impact flash, a darkening sky and the population collapsing. Present it accurately: this is the extinction event for non-bird dinosaurs, and birds survived.
4. **Food chains.** Herbivores graze near trees and predators hunt them, with simple steering. Keep it subtle so the view stays calm and uncluttered.

Ideas for later: ambient sound, more species per period (data-driven), a "random event" toggle, and an optional screenshot or share button.

## How to work on this project

- Work in small, verifiable steps and run the dev server after each change.
- Before writing code for a new feature, briefly explain the approach and any trade-offs.
- Keep the UI minimal. If a feature adds new controls, propose where they go first.
- Don't add facts to the UI without being confident they're accurate. When unsure, leave them out or mark them as estimates.
