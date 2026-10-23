import * as THREE from 'three';
import { gsap } from 'gsap';

// A closed circular gallery hall. Because it is a full circle, the camera can
// orbit 360 degrees and never reveal an edge, a box or a missing wall.
const RADIUS = 13;
const HEIGHT = 9;
const BAYS = 16;

function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}

function speckle(ctx, w, h, count) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * 0.09;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.6})`;
    ctx.fillRect(Math.random() * w, Math.random() * h, Math.random() * 2 + 0.5, Math.random() * 2 + 0.5);
  }
}

// Ashlar stone blocks with dark joints, a dado line near the floor.
function stoneTexture() {
  const [c, ctx] = makeCanvas(1024, 512);
  ctx.fillStyle = '#1c1b19';
  ctx.fillRect(0, 0, 1024, 512);
  const rowH = 64;
  for (let row = 0; row < 8; row++) {
    const offset = row % 2 ? 128 : 0;
    for (let x = -256; x < 1024; x += 256) {
      const shade = 22 + Math.floor(Math.random() * 10);
      ctx.fillStyle = `rgb(${shade},${shade - 1},${shade - 3})`;
      ctx.fillRect(x + offset + 2, row * rowH + 2, 252, rowH - 4);
    }
  }
  speckle(ctx, 1024, 512, 24000);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 448, 1024, 6);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(BAYS / 2, 1);
  t.anisotropy = 4;
  return t;
}

// Wall-washer glow: one soft scallop per bay, bright at the top.
function glowTexture() {
  const [c, ctx] = makeCanvas(256, 512);
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, 256, 512);
  ctx.save();
  ctx.translate(128, 0);
  ctx.scale(0.62, 1);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 340);
  g.addColorStop(0, 'rgba(255,244,228,1)');
  g.addColorStop(0.45, 'rgba(255,244,228,0.28)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-340, 0, 680, 512);
  ctx.restore();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  t.repeat.set(BAYS, 1);
  return t;
}

// Polished dark floor with concentric inlay rings and faint compass spokes.
function floorTexture() {
  const [c, ctx] = makeCanvas(1024, 1024);
  ctx.fillStyle = '#12110f';
  ctx.fillRect(0, 0, 1024, 1024);
  speckle(ctx, 1024, 1024, 40000);
  ctx.translate(512, 512);
  ctx.strokeStyle = 'rgba(190,182,166,0.22)';
  ctx.lineWidth = 2;
  for (const f of [0.2, 0.215, 0.46, 0.47, 0.8]) {
    ctx.beginPath();
    ctx.arc(0, 0, f * 512, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(190,182,166,0.08)';
  for (let i = 0; i < BAYS; i++) {
    const a = (i / BAYS) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 0.22 * 512, Math.sin(a) * 0.22 * 512);
    ctx.lineTo(Math.cos(a) * 512, Math.sin(a) * 512);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

export function addGalleryHall(scene) {
  const hall = new THREE.Group();
  hall.name = 'gallery-hall';

  scene.fog = new THREE.Fog('#080808', 12, 34);

  const stone = stoneTexture();
  const wallMat = new THREE.MeshStandardMaterial({
    map: stone,
    bumpMap: stone,
    bumpScale: 1.2,
    roughness: 0.92,
    metalness: 0,
    emissive: new THREE.Color('#ffffff'),
    emissiveMap: glowTexture(),
    emissiveIntensity: 0.45,
    side: THREE.BackSide
  });
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(RADIUS, RADIUS, HEIGHT, 96, 1, true),
    wallMat
  );
  wall.position.y = HEIGHT / 2;
  hall.add(wall);

  // Pilasters sit on the bay boundaries, with a base and a capital each.
  const pilMat = new THREE.MeshStandardMaterial({ color: '#2a2825', roughness: 0.8, map: stone });
  const shaft = new THREE.BoxGeometry(0.9, HEIGHT - 1.4, 0.5);
  const block = new THREE.BoxGeometry(1.15, 0.45, 0.7);
  for (let i = 0; i < BAYS; i++) {
    const a = (i / BAYS) * Math.PI * 2;
    const x = Math.sin(a) * (RADIUS - 0.3);
    const z = Math.cos(a) * (RADIUS - 0.3);
    for (const [geo, y] of [[shaft, HEIGHT / 2], [block, 0.22], [block, HEIGHT - 0.5]]) {
      const m = new THREE.Mesh(geo, pilMat);
      m.position.set(x, y, z);
      m.rotation.y = a;
      hall.add(m);
    }
  }

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(RADIUS, 96),
    new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.5, metalness: 0.15 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.06;
  floor.receiveShadow = true;
  hall.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.CircleGeometry(RADIUS, 48),
    new THREE.MeshBasicMaterial({ color: '#050505', side: THREE.DoubleSide })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = HEIGHT;
  hall.add(ceiling);

  scene.add(hall);

  return {
    group: hall,
    // Called from the LIGHT toggle: dims the wall wash when lights go off.
    setLit(on) {
      gsap.to(wallMat, { emissiveIntensity: on ? 0.45 : 0.03, duration: 0.8, ease: 'power2.inOut' });
    }
  };
}