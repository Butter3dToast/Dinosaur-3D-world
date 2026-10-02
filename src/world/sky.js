import * as THREE from 'three';
import { R } from '../config.js';
import { fbm } from './noise.js';
import { clamp, glowTexture } from '../util.js';

/** Fixed world-space sun direction. Day and night come from the planet turning under it. */
export const SUN_DIR = new THREE.Vector3(1, .25, .55).normalize();

// three r155+ no longer scales light intensity by PI; this keeps the r128 brightness.
const LEGACY_LIGHT = Math.PI;

/**
 * Sun, stars, moon, clouds and atmosphere. Clouds ride on `spin` so they turn
 * with the planet; the atmosphere sits on `tilt` so its lit side follows the sun.
 */
export function createSky(scene, tilt, spin) {
  const sun = new THREE.DirectionalLight(0xfff1dc, 1.35 * LEGACY_LIGHT);
  sun.position.copy(SUN_DIR).multiplyScalar(100);
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0x2a3a55, .32 * LEGACY_LIGHT));

  const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({
    map: glowTexture('rgba(255,244,214,1)', 'rgba(255,190,90,0)'), blending: THREE.AdditiveBlending, depthWrite: false }));
  sunSprite.position.copy(SUN_DIR).multiplyScalar(420); sunSprite.scale.setScalar(70);
  scene.add(sunSprite);

  scene.add(createStars());

  const moonPivot = new THREE.Group();
  const moon = new THREE.Mesh(new THREE.SphereGeometry(.75, 18, 14),
    new THREE.MeshPhongMaterial({ color: 0xb9b4aa, flatShading: true, shininess: 2 }));
  moon.position.set(30, 3, 0);
  moonPivot.add(moon); scene.add(moonPivot);

  const clouds = new THREE.Mesh(new THREE.SphereGeometry(R * 1.075, 64, 48),
    new THREE.MeshLambertMaterial({ map: createCloudTexture(), transparent: true, depthWrite: false, opacity: .75 }));
  // Clouds, ocean and atmosphere are concentric transparent spheres, so depth sorting
  // ties; draw clouds and atmosphere after the ocean rather than relying on creation order.
  clouds.renderOrder = 1;
  spin.add(clouds);

  const atmosphere = createAtmosphere();
  atmosphere.renderOrder = 2;
  tilt.add(atmosphere);

  return {
    update(sdt) {
      clouds.rotation.y += sdt * .012;
      moonPivot.rotation.y += sdt * .02;
    },
  };
}

function createStars() {
  const n = 2600, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const v = new THREE.Vector3();
  for (let i = 0; i < n; i++) {
    v.randomDirection().multiplyScalar(900 + Math.random() * 400);
    pos.set([v.x, v.y, v.z], i * 3);
    const b = .55 + Math.random() * .45, t = Math.random();
    col.set([b * (t > .85 ? 1 : .85), b * .9, b * (t < .15 ? .75 : 1)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ size: 1.6, sizeAttenuation: false, vertexColors: true }));
}

/** Equirectangular alpha map from 3D noise sampled on the sphere, so there is no seam. */
function createCloudTexture() {
  const w = 384, h = 192, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d'), img = g.createImageData(w, h);
  for (let y = 0; y < h; y++) {
    const lat = (.5 - y / h) * Math.PI;
    for (let x = 0; x < w; x++) {
      const lon = (x / w) * Math.PI * 2;
      const px = Math.cos(lat) * Math.cos(lon), py = Math.sin(lat), pz = Math.cos(lat) * Math.sin(lon);
      const n = fbm(px * 2.4 + 9, py * 2.4, pz * 2.4, 4) + fbm(px * 7, py * 7, pz * 7 + 3, 2) * .25;
      const a = clamp((n - .05) * 3.2, 0, 1) * .85, o = (y * w + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = 255; img.data[o + 3] = a * 255;
    }
  }
  g.putImageData(img, 0, 0);
  return new THREE.CanvasTexture(c);
}

/** Back-side additive fresnel rim, brighter on the sunlit side. */
function createAtmosphere() {
  return new THREE.Mesh(new THREE.SphereGeometry(R * 1.13, 64, 48), new THREE.ShaderMaterial({
    uniforms: { sunDir: { value: SUN_DIR } },
    vertexShader: /* glsl */`
      varying vec3 vN; varying vec3 vW;
      void main(){
        vN = normalize(normalMatrix * normal);
        vW = normalize((modelMatrix * vec4(normal, 0.)).xyz);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
      }`,
    fragmentShader: /* glsl */`
      uniform vec3 sunDir; varying vec3 vN; varying vec3 vW;
      void main(){
        float i = pow(clamp(-dot(vN, vec3(0., 0., 1.)), 0., 1.) * 1.9, 3.) * .55;
        float lit = clamp(dot(vW, sunDir) * .9 + .35, .06, 1.);
        gl_FragColor = vec4(vec3(.45, .72, 1.) * i * lit, 1.);
      }`,
    side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false,
  }));
}
