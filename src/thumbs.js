import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

// Real 3D renders for the collection cards. One shared renderer draws each
// sculpture into the card's 2D canvas; the hovered card slowly turns.
const W = 640, H = 800;
const urls = {
  bust: '/models/classical-bust.glb',
  vase: '/models/classical-vessel.glb',
  torso: '/models/classical-torso.glb'
};

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping;

const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight(0xffffff, 0x222222, 1.2));
const key = new THREE.DirectionalLight(0xffffff, 2.8);
key.position.set(3, 4, 5);
const rim = new THREE.DirectionalLight(0xffffff, 2.2);
rim.position.set(-4, 3, -3);
scene.add(key, rim);

const camera = new THREE.PerspectiveCamera(32, W / H, 0.1, 50);
camera.position.set(0, 0.1, 5.4);

const entries = [];
let hovered = null;
let last = performance.now();

function draw(e) {
  entries.forEach((x) => { x.pivot.visible = x === e; });
  e.pivot.rotation.y = e.rot;
  renderer.render(scene, camera);
  e.ctx.clearRect(0, 0, W, H);
  e.ctx.drawImage(renderer.domElement, 0, 0, W, H);
}

function tick(now) {
  const dt = Math.min((now - last) / 1000, 0.1);
  last = now;
  if (hovered) {
    hovered.rot += dt * 0.9;
    draw(hovered);
    requestAnimationFrame(tick);
  }
}

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

document.querySelectorAll('.collection-art [data-open-artwork], .collection-art[data-open-artwork]').forEach((btn) => {
  const art = btn.classList.contains('collection-art') ? btn : btn.closest('.collection-art');
  const url = urls[btn.dataset.openArtwork];
  if (!art || !url) return;

  loader.load(url, (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const pivot = new THREE.Group();
    pivot.add(model);
    pivot.scale.setScalar(Math.min(2.7 / size.y, 2.2 / size.x, 2.2 / size.z));
    pivot.visible = false;
    scene.add(pivot);

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    canvas.className = 'card-render';
    art.prepend(canvas);

    const entry = { pivot, ctx: canvas.getContext('2d'), rot: -0.45 };
    entries.push(entry);
    draw(entry);
    art.classList.add('has-render');

    art.addEventListener('pointerenter', () => {
      hovered = entry;
      last = performance.now();
      requestAnimationFrame(tick);
    });
    art.addEventListener('pointerleave', () => { hovered = null; });
  }, undefined, () => { /* model missing: keep the flat preview */ });
});