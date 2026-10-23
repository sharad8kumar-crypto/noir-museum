import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { gsap } from 'gsap';
import './style.css';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const container = document.querySelector('#scene');
const loader = document.querySelector('#loader');
const lightButton = document.querySelector('#light-toggle');
const inspectButton = document.querySelector('#inspect');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#080808');
scene.fog = new THREE.Fog('#080808', 9, 22);

const camera = new THREE.PerspectiveCamera(
  38,
  container.clientWidth / container.clientHeight,
  0.1,
  100
);
camera.position.set(0, 2.1, 7.8);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance'
});
// Phase 7: Adaptive rendering quality
function updateRenderQuality() {
  const isMobile = window.matchMedia('(max-width: 760px)').matches;
  const maxPixelRatio = isMobile ? 1.2 : 1.6;

  renderer.setPixelRatio(
    Math.min(window.devicePixelRatio || 1, maxPixelRatio)
  );
}

updateRenderQuality();
renderer.setSize(container.clientWidth, container.clientHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.domElement.setAttribute('aria-label', 'Interactive 3D marble sculpture. Drag to rotate and scroll to zoom.');
container.prepend(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 1.6, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.055;
controls.enablePan = false;
controls.minDistance = 4.3;
controls.maxDistance = 10;
controls.minPolarAngle = 0.55;
controls.maxPolarAngle = 1.75;
controls.update();

scene.add(new THREE.HemisphereLight(0xbebebe, 0x171717, 1.05));


const keyLight = new THREE.SpotLight(
  0xffffff,
  90,
  25,
  Math.PI / 3,
  1.0,
  1.0
);

const beamMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
  opacity: 0.045,
  depthWrite: false,
  side: THREE.DoubleSide,
  blending: THREE.AdditiveBlending
});

const lightBeam = new THREE.Mesh(
  new THREE.CylinderGeometry(
    0.08,  // beam ka upper radius
    1.25,  // beam ka lower radius
    5.5,   // beam ki length
    48,    // smoothness
    1,
    true   // open cylinder
  ),
  beamMaterial
);


lightBeam.position.set(0, 4, 0.3);
lightBeam.renderOrder = 1;

scene.add(lightBeam);


keyLight.position.set(2.5, 7, 3);
keyLight.target.position.set(0, 1.5, 0);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.radius = 6;
keyLight.shadow.bias = -0.0002;
keyLight.shadow.normalBias = 0.03;
scene.add(keyLight, keyLight.target);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.5);
fillLight.position.set(-4, 3, -2);
scene.add(fillLight);
// Phase 6: Cinematic rim lighting
const rimLight = new THREE.DirectionalLight(0xffffff, 1.75);

rimLight.position.set(-3, 4, -3);
rimLight.target.position.set(0, 1.6, 0);

scene.add(rimLight, rimLight.target);

const beamCore = new THREE.Mesh(
  new THREE.ConeGeometry(0.42, 1, 32, 1, true),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.035,
    depthWrite: false,
    side: THREE.DoubleSide,
    blending: THREE.AdditiveBlending
  })
);
beamCore.visible = false;
scene.add(beamCore);
scene.add(beamCore);
scene.add(beamCore);

const beamAxis = new THREE.Vector3(0, 1, 0);
const beamDirection = new THREE.Vector3();
const beamMidpoint = new THREE.Vector3();

function updateLightBeam() {
  beamDirection.copy(keyLight.position).sub(keyLight.target.position);

  const distance = beamDirection.length();
  beamDirection.normalize();

  beamMidpoint
    .copy(keyLight.position)
    .add(keyLight.target.position)
    .multiplyScalar(0.5);

  for (const beam of [lightBeam, beamCore]) {
    beam.position.copy(beamMidpoint);
    beam.quaternion.setFromUnitVectors(beamAxis, beamDirection);
    if (beam === lightBeam) {
      beam.scale.set(1, distance / 5.5, 1);
    } else {
      beam.scale.set(1, distance, 1);
    }
  }

  const visible = lightsOn;
  lightBeam.visible = visible;
  beamCore.visible = visible;
}

const floorMaterial = new THREE.MeshStandardMaterial({
  color: '#161616',
  roughness: 0.82,
  metalness: 0.12
});

const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), floorMaterial);
floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.04;
floor.receiveShadow = true;
scene.add(floor);

// Minimal gallery walls.
const wallMaterial = new THREE.MeshStandardMaterial({
  color: '#111111',
  roughness: 0.95,
  side: THREE.DoubleSide
});

function addWall(width, height, x, y, z, rotationY = 0) {
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    wallMaterial
  );
  wall.position.set(x, y, z);
  wall.rotation.y = rotationY;
  scene.add(wall);
}

addWall(14, 7, 0, 3.45, -4);
addWall(14, 7, -7, 3.45, 0, Math.PI / 2);
addWall(14, 7, 7, 3.45, 0, Math.PI / 2);

// Pedestal.
const pedestalMaterial = new THREE.MeshStandardMaterial({
  color: '#bdbdbd',
  roughness: 0.42,
  metalness: 0.16
});

const pedestal = new THREE.Mesh(
  new THREE.CylinderGeometry(0.73, 0.86, 1.05, 64),
  pedestalMaterial
);
pedestal.position.y = 0.5;
pedestal.castShadow = true;
pedestal.receiveShadow = true;
scene.add(pedestal);


const sculpture = new THREE.Group();
sculpture.position.y = 1.03;
scene.add(sculpture);

function createMarbleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;

  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#d8d5ce';
  ctx.fillRect(0, 0, 512, 512);

  for (let i = 0; i < 16000; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const alpha = Math.random() * 0.07;

    ctx.fillStyle = Math.random() > 0.5
      ? `rgba(255,255,255,${alpha})`
      : `rgba(35,35,35,${alpha})`;

    ctx.fillRect(x, y, Math.random() * 2 + 0.3, 1);
  }

  for (let i = 0; i < 34; i++) {
    let x = Math.random() * 512;
    let y = Math.random() * 512;

    ctx.beginPath();
    ctx.moveTo(x, y);

    for (let j = 0; j < 5; j++) {
      x += Math.random() * 40 - 20;
      y += Math.random() * 40 + 8;
      ctx.lineTo(x, y);
    }

    ctx.strokeStyle = `rgba(55,55,55,${Math.random() * 0.12})`;
    ctx.lineWidth = Math.random() * 1.1 + 0.3;
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(2, 2);

  return texture;
}

const marbleTexture = createMarbleTexture();

const marbleMaterial = new THREE.MeshStandardMaterial({
  color: '#ffffff',
  map: marbleTexture,
  roughness: 0.38,
  metalness: 0.015
});

const marble = marbleMaterial;


const vase = new THREE.Group();
vase.position.y = 1.03;
vase.visible = false;
scene.add(vase);

const vasePoints = [
  new THREE.Vector2(0, 0),
  new THREE.Vector2(0.30, 0.08),
  new THREE.Vector2(0.42, 0.32),
  new THREE.Vector2(0.50, 0.68),
  new THREE.Vector2(0.43, 1),
  new THREE.Vector2(0.28, 1.25),
  new THREE.Vector2(0.23, 1.47),
  new THREE.Vector2(0.30, 1.53),
  new THREE.Vector2(0.27, 1.60),
  new THREE.Vector2(0.18, 1.60),
  new THREE.Vector2(0.18, 1.49),
  new THREE.Vector2(0.16, 1.25),
  new THREE.Vector2(0, 1.20)
];

const vaseMesh = new THREE.Mesh(
  new THREE.LatheGeometry(vasePoints, 96),
  marble
);
vaseMesh.castShadow = true;
vaseMesh.receiveShadow = true;
vase.add(vaseMesh);

for (const y of [0.34, 0.42, 1, 1.08]) {
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(y < 0.5 ? 0.43 : 0.39, 0.018, 10, 72),
    marble
  );
  ring.position.y = y;
  ring.rotation.x = Math.PI / 2;
  ring.castShadow = true;
  vase.add(ring);
}

const torso = new THREE.Group();
torso.position.y = 1.03;
torso.visible = false;
scene.add(torso);

function addTorsoPart(geometry, position, scale) {
  const mesh = new THREE.Mesh(geometry, marble);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  torso.add(mesh);
}

addTorsoPart(
  new THREE.SphereGeometry(0.58, 48, 32),
  [0, 1.30, 0],
  [1, 0.86, 0.62]
);
addTorsoPart(
  new THREE.SphereGeometry(0.32, 40, 32),
  [0, 0.70, 0],
  [0.82, 1.2, 0.68]
);
addTorsoPart(
  new THREE.CylinderGeometry(0.20, 0.31, 0.70, 40),
  [0, 0.28, 0],
  [1, 1, 0.85]
);
addTorsoPart(
  new THREE.SphereGeometry(0.36, 40, 32),
  [-0.54, 1.36, 0],
  [0.65, 0.42, 0.68]
);
addTorsoPart(
  new THREE.SphereGeometry(0.36, 40, 32),
  [0.54, 1.36, 0],
  [0.65, 0.42, 0.68]
);

let activeObject = sculpture;
let switching = false;


const modelLoader = new GLTFLoader();

const ceramicMaterial = new THREE.MeshStandardMaterial({
  color: '#d8d5ce',
  roughness: 0.32,
  metalness: 0.02
});

const modelLoaded = {
  bust: false,
  vessel: false,
  torso: false
};

const modelPromises = {};

const modelConfig = {
  bust: {
    url: '/models/classical-bust.glb',
    group: sculpture,
    size: 1.85,
    label: 'THE BUST'
  },

  vase: {
    url: '/models/classical-vessel.glb',
    group: vase,
    size: 1.65,
    label: 'THE VESSEL',
    key: 'vessel'
  },

  torso: {
    url: '/models/classical-torso.glb',
    group: torso,
    size: 1.85,
    label: 'THE FORM'
  }
};

const loaderLabel = document.querySelector('#loader-label');
const loaderProgress = document.querySelector('#loader-progress');



const modelProgress = {
  bust: 0,
  vessel: 0,
  torso: 0
};

function updateCollectionProgress(key, percent) {
  const config = modelConfig[key];

  modelProgress[key] = Math.max(
    0,
    Math.min(100, percent)
  );

  const average = Math.round(
    (modelProgress.bust +
      modelProgress.vessel +
      modelProgress.torso) / 3
  );

  if (loaderLabel) {
    loaderLabel.textContent =
      `LOADING COLLECTION ${average}%`;
  }

  if (loaderProgress) {
    loaderProgress.style.width = `${average}%`;
  }
}



function loadArtworkModel(url, targetGroup, targetSize, key) {
  return new Promise((resolve, reject) => {
    modelLoader.load(
      url,

      (gltf) => {
        try {
          const model = gltf.scene;

          const materialAudit = [];

          model.traverse((child) => {
            if (!child.isMesh) return;

            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];

            for (const material of materials) {
              if (!material) continue;

              materialAudit.push({
                mesh: child.name || '(unnamed mesh)',
                material: material.name || '(unnamed material)',
                color: material.color
                  ? `#${material.color.getHexString()}`
                  : 'N/A',
                colorTexture: Boolean(material.map),
                normalTexture: Boolean(material.normalMap),
                roughnessTexture: Boolean(material.roughnessMap),
                metalnessTexture: Boolean(material.metalnessMap),
                vertexColors: Boolean(material.vertexColors)
              });
            }
          });

          console.groupCollapsed(`Original materials: ${url}`);
          console.table(materialAudit);
          console.groupEnd();




          const materialReport = [];

          model.traverse((child) => {
            if (!child.isMesh) return;

            child.castShadow = true;
            child.receiveShadow = true;

            const materials = Array.isArray(child.material)
              ? child.material
              : [child.material];

            for (const mat of materials) {
              if (!mat) continue;

              materialReport.push({
                mesh: child.name || '(unnamed mesh)',
                material: mat.name || '(unnamed material)',
                color: mat.color
                  ? `#${mat.color.getHexString()}`
                  : 'not available',
                baseColorTexture: Boolean(mat.map),
                normalTexture: Boolean(mat.normalMap),
                roughnessTexture: Boolean(mat.roughnessMap),
                metalnessTexture: Boolean(mat.metalnessMap),
                emissiveTexture: Boolean(mat.emissiveMap)
              });
            }
          });

          console.group(`Material audit: ${url}`);
          console.table(materialReport);
          console.groupEnd();



          // Fit every model into a consistent gallery size.
          const bounds = new THREE.Box3().setFromObject(model);
          const size = bounds.getSize(new THREE.Vector3());

          const maxDimension = Math.max(size.x, size.y, size.z);

          if (!Number.isFinite(maxDimension) || maxDimension <= 0) {
            throw new Error(`Invalid dimensions for ${url}`);
          }

          model.scale.setScalar(targetSize / maxDimension);
          model.updateMatrixWorld(true);

          // Center horizontally and align the base with the pedestal.
          const scaledBounds = new THREE.Box3().setFromObject(model);
          const center = scaledBounds.getCenter(new THREE.Vector3());

          model.position.x -= center.x;
          model.position.y -= scaledBounds.min.y;
          model.position.z -= center.z;

          // Remove the old procedural placeholder geometry.
          for (const oldChild of [...targetGroup.children]) {
            oldChild.traverse((child) => {
              if (child.isMesh && child.geometry) {
                child.geometry.dispose();
              }
            });

            targetGroup.remove(oldChild);
          }

          // Put the downloaded model inside its existing artwork group.
          targetGroup.add(model);

          updateCollectionProgress(key, 100);
          resolve(model);
        } catch (error) {
          reject(error);
        }
      },

      (progress) => {
        if (progress.total > 0) {
          const percent = Math.round(
            (progress.loaded / progress.total) * 100
          );

          updateCollectionProgress(key, percent);
        } else if (loaderLabel) {
          loaderLabel.textContent = 'LOADING COLLECTION...';
        }
      },

      (error) => {
        console.error(`Failed to load ${url}:`, error);
        reject(new Error(`Could not load ${url}`));
      }
    );
  });
}


function ensureArtworkLoaded(key) {
  const config = modelConfig[key];

  if (!config) {
    return Promise.reject(
      new Error(`Unknown artwork key: ${key}`)
    );
  }

  if (modelLoaded[key]) {
    return Promise.resolve();
  }

  if (modelPromises[key]) {
    return modelPromises[key];
  }

  // Show the existing loader while this model downloads.
  if (loader) {
    loader.classList.remove('hidden');
  }

  if (loaderLabel) {
    loaderLabel.textContent = `LOADING ${config.label} 0%`;
  }

  if (loaderProgress) {
    loaderProgress.style.width = '0%';
  }

  const fileKey = config.key ?? key;

  modelPromises[key] = loadArtworkModel(
    config.url,
    config.group,
    config.size,
    fileKey
  )
    .then(() => {
      modelLoaded[key] = true;
    })
    .finally(() => {
      delete modelPromises[key];
    });

  return modelPromises[key];
}


ensureArtworkLoaded('bust')
  .then(() => {
    if (loaderLabel) {
      loaderLabel.textContent = 'GALLERY READY';
    }

    if (loaderProgress) {
      loaderProgress.style.width = '100%';
    }

    gsap.from(sculpture.scale, {
      x: 0.85,
      y: 0.85,
      z: 0.85,
      duration: 1.1,
      ease: 'power3.out'
    });

    // Keep the loader in the DOM for later artwork selections.
    if (loader) {
      setTimeout(() => {
        loader.classList.add('hidden');
      }, 500);
    }
  })
  .catch((error) => {
    console.error('Initial sculpture loading failed:', error);

    if (loaderLabel) {
      loaderLabel.textContent = 'MODEL FAILED TO LOAD';
    }
  });


// Phase 6: Subtle floating dust in the gallery
const dustCount = 100;
const dustPositions = new Float32Array(dustCount * 3);

for (let i = 0; i < dustCount; i++) {
  dustPositions[i * 3] = (Math.random() - 0.5) * 7;
  dustPositions[i * 3 + 1] = 0.4 + Math.random() * 4.8;
  dustPositions[i * 3 + 2] = (Math.random() - 0.5) * 5;
}

const dustGeometry = new THREE.BufferGeometry();

dustGeometry.setAttribute(
  'position',
  new THREE.BufferAttribute(dustPositions, 3)
);

// Soft circular particle texture
const dustCanvas = document.createElement('canvas');
dustCanvas.width = 32;
dustCanvas.height = 32;

const dustContext = dustCanvas.getContext('2d');
const dustGradient = dustContext.createRadialGradient(
  16, 16, 0,
  16, 16, 16
);

dustGradient.addColorStop(0, 'rgba(255,255,255,0.8)');
dustGradient.addColorStop(1, 'rgba(255,255,255,0)');

dustContext.fillStyle = dustGradient;
dustContext.fillRect(0, 0, 32, 32);

const dustTexture = new THREE.CanvasTexture(dustCanvas);

const dustMaterial = new THREE.PointsMaterial({
  color: 0xffffff,
  map: dustTexture,
  size: 0.055,
  transparent: true,
  opacity: 0.18,
  depthWrite: false,
  sizeAttenuation: true
});

const dustParticles = new THREE.Points(
  dustGeometry,
  dustMaterial
);

dustParticles.frustumCulled = false;
scene.add(dustParticles);

// Floor lighting pool.
const pool = new THREE.Mesh(
  new THREE.CircleGeometry(1.45, 64),
  new THREE.MeshBasicMaterial({
    color: '#a6a6a6',
    transparent: true,
    opacity: 0.055,
    depthWrite: false
  })
);
pool.rotation.x = -Math.PI / 2;
pool.position.set(0, 0.006, 0);
scene.add(pool);

// Add a few architectural light strips.
const stripMaterial = new THREE.MeshBasicMaterial({ color: '#777777' });
for (const x of [-5.8, 5.8]) {
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(0.018, 4.5, 0.018),
    stripMaterial
  );
  strip.position.set(x, 2.6, -3.96);
  scene.add(strip);
}

// Click-and-drag directly on the sculpture to rotate the object.
// Dragging empty gallery space continues to orbit the camera.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let draggingObject = false;
let lastX = 0;
let lastY = 0;
let moved = false;

renderer.domElement.addEventListener('pointerdown', (event) => {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(activeObject.children, true);
  if (hits.length) {
    draggingObject = true;
    moved = false;
    lastX = event.clientX;
    lastY = event.clientY;
    controls.enabled = false;
    renderer.domElement.style.cursor = 'grabbing';
    renderer.domElement.setPointerCapture(event.pointerId);
  }
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!draggingObject) return;

  const dx = event.clientX - lastX;
  const dy = event.clientY - lastY;
  activeObject.rotation.y += dx * 0.009;

  activeObject.rotation.x = THREE.MathUtils.clamp(
    activeObject.rotation.x + dy * 0.004,
    -0.22,
    0.22
  );
  lastX = event.clientX;
  lastY = event.clientY;
  moved = true;
});

function stopObjectDrag() {
  if (!draggingObject) return;
  draggingObject = false;
  controls.enabled = true;
  renderer.domElement.style.cursor = 'grab';
}

renderer.domElement.addEventListener('pointerup', stopObjectDrag);
renderer.domElement.addEventListener('pointercancel', stopObjectDrag);
renderer.domElement.style.cursor = 'grab';

// Moving spotlight.
const clock = new THREE.Clock();
const prefersReducedMotion = window.matchMedia(
  '(prefers-reduced-motion: reduce)'
).matches;
let lightsOn = true;
let inspectionMode = false;
// Phase 5: Premium camera controls

const resetViewButton = document.createElement('button');

resetViewButton.type = 'button';
resetViewButton.className = 'view-reset';
resetViewButton.textContent = 'RESET VIEW ↺';
resetViewButton.setAttribute(
  'aria-label',
  'Reset camera and artwork rotation'
);

container.appendChild(resetViewButton);

function resetMuseumView() {
  if (switching) return;

  inspectionMode = false;

  inspectButton.innerHTML = 'INSPECT OBJECT <span>↗</span>';

  // Stop any previous camera animation.
  gsap.killTweensOf(camera.position);
  gsap.killTweensOf(controls.target);

  // Restore the default camera view.
  gsap.to(camera.position, {
    x: 0,
    y: 2.1,
    z: 7.8,
    duration: 0.8,
    ease: 'power3.inOut'
  });

  gsap.to(controls.target, {
    x: 0,
    y: 1.6,
    z: 0,
    duration: 0.8,
    ease: 'power3.inOut',
    onUpdate: () => controls.update()
  });

  // Smoothly return the current artwork to its default angle.
  gsap.to(activeObject.rotation, {
    x: 0,
    y: 0,
    z: 0,
    duration: 0.7,
    ease: 'power3.out'
  });
}

resetViewButton.addEventListener('click', resetMuseumView);

// Keyboard shortcuts: R = reset view, L = lighting toggle.
document.addEventListener('keydown', (event) => {
  const target = event.target;

  // Do not trigger shortcuts while typing into form fields.
  if (
    target instanceof HTMLElement &&
    (
      target.isContentEditable ||
      ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
    )
  ) {
    return;
  }

  if (event.repeat) return;

  if (event.key.toLowerCase() === 'r') {
    resetMuseumView();
  }

  if (event.key.toLowerCase() === 'l') {
    lightButton.click();
  }
});
const galleryTabs = document.querySelectorAll('.gallery-tab');

const artworkCatalog = {
  bust: {
    object: sculpture,
    title: 'Silent<br>Monument',
    description:
      'A study of volume, shadow and the enduring language of classical form.',
    material: 'WHITE MARBLE',
    period: 'CLASSICAL STUDIES'
  },

  vase: {
    object: vase,
    title: 'The<br>Vessel',
    description:
      'A sculptural exploration of symmetry, proportion and negative space.',
    material: 'CARVED MARBLE',
    period: 'DECORATIVE ARTS'
  },

  torso: {
    object: torso,
    title: 'The Human<br>Form',
    description:
      'An abstract study of the human silhouette and monumental form.',
    material: 'MONOCHROME STONE',
    period: 'FIGURATIVE STUDIES'
  }
};

const titleElement =
  document.querySelector('#artwork-title') ||
  document.querySelector('.object-card h2');

const descriptionElement =
  document.querySelector('#artwork-description') ||
  document.querySelector('.object-card p');

const materialElement = document.querySelector('#artwork-material');
const periodElement = document.querySelector('#artwork-period');


async function selectArtwork(key) {
  const nextArtwork = artworkCatalog[key];

  if (
    !nextArtwork ||
    nextArtwork.object === activeObject ||
    switching
  ) {
    return;
  }

  switching = true;

  // Load the requested model only when needed.
  try {
    await ensureArtworkLoaded(key);
  } catch (error) {
    console.error(`Could not open artwork "${key}":`, error);

    if (loader) loader.classList.add('hidden');

    if (descriptionElement) {
      descriptionElement.textContent =
        'This artwork could not be loaded. Check the model file and try again.';
    }

    switching = false;
    return;
  }

  // Hide the temporary loading overlay after the model is ready.
  if (loader) loader.classList.add('hidden');

  container.classList.add('changing');

  const previousObject = activeObject;

  gsap.to(previousObject.scale, {
    x: 0.8,
    y: 0.8,
    z: 0.8,
    duration: 0.25,
    ease: 'power2.in',
    onComplete: () => {
      previousObject.visible = false;

      activeObject = nextArtwork.object;
      activeObject.visible = true;
      activeObject.rotation.set(0, 0, 0);
      activeObject.scale.setScalar(0.8);

      if (titleElement) {
        titleElement.innerHTML = nextArtwork.title;
      }

      if (descriptionElement) {
        descriptionElement.textContent = nextArtwork.description;
      }

      if (materialElement) {
        materialElement.textContent = nextArtwork.material;
      }

      if (periodElement) {
        periodElement.textContent = nextArtwork.period;
      }

      galleryTabs.forEach((tab) => {
        const selected = tab.dataset.artwork === key;

        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-pressed', String(selected));
      });

      inspectionMode = false;
      inspectButton.innerHTML = 'INSPECT OBJECT <span>↗</span>';

      gsap.to(camera.position, {
        x: 0,
        y: 2.1,
        z: 7.8,
        duration: 0.55,
        ease: 'power2.inOut'
      });

      gsap.to(controls.target, {
        x: 0,
        y: 1.6,
        z: 0,
        duration: 0.55,
        ease: 'power2.inOut',
        onUpdate: () => controls.update()
      });

      gsap.to(activeObject.scale, {
        x: 1,
        y: 1,
        z: 1,
        duration: 0.55,
        ease: 'power3.out',
        onComplete: () => {
          switching = false;
          container.classList.remove('changing');
        }
      });
    }
  });
}


galleryTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    selectArtwork(tab.dataset.artwork);
  });
});

/* Phase 16: Connect collection cards to the 3D viewer */

document.querySelectorAll('[data-open-artwork]').forEach((button) => {
  button.addEventListener('click', () => {
    const artworkKey = button.dataset.openArtwork;

    const galleryTab = document.querySelector(
      `.gallery-tab[data-artwork="${artworkKey}"]`
    );

    if (!galleryTab) return;

    // Reuse the existing tab handler and lazy-loading behavior.
    galleryTab.click();

    // Bring the interactive artwork into view.
    document.querySelector('#exhibition')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  });
});

// Phase 8: Artwork collection navigation
const collectionNav = document.querySelector('.gallery-nav');
const collectionTabs = Array.from(
  document.querySelectorAll('.gallery-tab')
);

if (
  collectionNav &&
  collectionTabs.length > 0 &&
  !document.querySelector('.collection-pager')
) {
  const pager = document.createElement('div');
  pager.className = 'collection-pager';

  pager.innerHTML = `
    <button type="button" data-step="-1" aria-label="Previous artwork">
      ← PREVIOUS
    </button>

    <span class="collection-count" aria-live="polite"></span>

    <button type="button" data-step="1" aria-label="Next artwork">
      NEXT →
    </button>
  `;

  collectionNav.insertAdjacentElement('afterend', pager);

  let currentIndex = Math.max(
    collectionTabs.findIndex(tab => tab.classList.contains('active')),
    0
  );

  const count = pager.querySelector('.collection-count');

  function updateCollectionCount() {
    count.textContent =
      `${String(currentIndex + 1).padStart(2, '0')} / ` +
      `${String(collectionTabs.length).padStart(2, '0')}`;
  }

  pager.addEventListener('click', event => {
    const button = event.target.closest('button[data-step]');
    if (!button) return;

    const step = Number(button.dataset.step);

    currentIndex =
      (currentIndex + step + collectionTabs.length) %
      collectionTabs.length;

    collectionTabs[currentIndex].click();
    updateCollectionCount();
  });

  collectionTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      currentIndex = index;
      updateCollectionCount();
    });
  });

  updateCollectionCount();
}

lightButton.addEventListener('click', () => {
  lightsOn = !lightsOn;
  document.body.classList.toggle('lights-off', !lightsOn);
  lightButton.textContent = lightsOn ? 'LIGHT: ON' : 'LIGHT: OFF';

  gsap.to(keyLight, {
    intensity: lightsOn ? 150 : 12,
    duration: 0.8,
    ease: 'power2.inOut'
  });
  gsap.to(fillLight, {
    intensity: lightsOn ? 1.5 : 0.18,
    duration: 0.8,
    ease: 'power2.inOut'
  });
  gsap.to(rimLight, {
    intensity: lightsOn ? 1.75 : 0.08,
    duration: 0.8,
    ease: 'power2.inOut'
  });
});


inspectButton.addEventListener('click', () => {
  inspectionMode = !inspectionMode;
  inspectButton.innerHTML = inspectionMode
    ? 'EXIT INSPECTION <span>↙</span>'
    : 'INSPECT OBJECT <span>↗</span>';

  gsap.to(camera.position, {
    x: inspectionMode ? 0 : 0,
    y: inspectionMode ? 2.0 : 2.1,
    z: inspectionMode ? 5.0 : 7.8,
    duration: 1.2,
    ease: 'power3.inOut'
  });

  gsap.to(controls.target, {
    y: inspectionMode ? 1.85 : 1.6,
    duration: 1.2,
    ease: 'power3.inOut',
    onUpdate: () => controls.update()
  });
});

function resize() {
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (!width || !height) return;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  updateRenderQuality();
  renderer.setSize(width, height);
}

const resizeObserver = new ResizeObserver(resize);
resizeObserver.observe(container);


function animate() {
  requestAnimationFrame(animate);

  const t = clock.getElapsedTime();

  if (!prefersReducedMotion) {
    // Slowly rotate the currently selected artwork.
    if (!draggingObject && !switching) {
      activeObject.rotation.y += 0.0012;
    }

    // Subtle ambient dust movement.
    dustParticles.rotation.y = Math.sin(t * 0.04) * 0.035;
    dustParticles.position.y = Math.sin(t * 0.25) * 0.025;

    // Cinematic moving spotlight.
    keyLight.position.x = Math.sin(t * 0.42) * 2.8;
    keyLight.position.z = 2.5 + Math.cos(t * 0.35) * 1.6;
    keyLight.target.position.x = Math.sin(t * 0.32) * 0.45;
    keyLight.target.updateMatrixWorld();
  }

  controls.update();
  updateLightBeam();
  renderer.render(scene, camera);
}


animate();


gsap.from(pedestal.position, {
  y: -0.3,
  duration: 1.1,
  ease: 'power3.out'
});

/* PHASE 17 — Interactive Art Archive */

const archiveCards = Array.from(
  document.querySelectorAll('.collection-card')
);

const archiveSearch = document.querySelector('#collection-search');
const archiveFilter = document.querySelector('#collection-filter');
const savedOnlyButton = document.querySelector('#favorites-only');
const archiveResults = document.querySelector('#collection-results');
const archiveEmpty = document.querySelector('#collection-empty');

const artworkNames = {
  bust: 'The Bust',
  vase: 'The Vessel',
  torso: 'The Form'
};

let savedArtworkKeys = new Set();

try {
  const stored = JSON.parse(
    localStorage.getItem('noir-museum-favorites') || '[]'
  );

  if (Array.isArray(stored)) {
    savedArtworkKeys = new Set(
      stored.filter((key) => Object.hasOwn(artworkNames, key))
    );
  }
} catch (error) {
  console.warn('Saved artwork preferences could not be read.', error);
}

let showSavedOnly = false;

function syncFavoriteButtons() {
  document.querySelectorAll('[data-favorite]').forEach((button) => {
    const key = button.dataset.favorite;
    const isSaved = savedArtworkKeys.has(key);

    button.textContent = isSaved ? '★' : '☆';
    button.setAttribute('aria-pressed', String(isSaved));
    button.setAttribute(
      'aria-label',
      `${isSaved ? 'Remove saved' : 'Save'} ${artworkNames[key]}`
    );
    button.title = isSaved ? 'Remove from saved artworks' : 'Save artwork';
  });
}

function updateArchive() {
  const query = (archiveSearch?.value || '').trim().toLowerCase();
  const category = archiveFilter?.value || 'all';

  let visibleCount = 0;

  archiveCards.forEach((card) => {
    const artworkButton = card.querySelector('[data-open-artwork]');
    if (!artworkButton) return;

    const key = artworkButton.dataset.openArtwork;
    const title = artworkNames[key] || '';
    const cardCategory = card.dataset.category || '';

    const matchesSearch = `${title} ${cardCategory}`
      .toLowerCase()
      .includes(query);

    const matchesCategory =
      category === 'all' || category === cardCategory;

    const matchesSaved =
      !showSavedOnly || savedArtworkKeys.has(key);

    const visible =
      matchesSearch && matchesCategory && matchesSaved;

    card.hidden = !visible;

    if (visible) visibleCount++;
  });

  if (archiveResults) {
    archiveResults.textContent =
      `${visibleCount} ${visibleCount === 1 ? 'WORK' : 'WORKS'}`;
  }

  if (archiveEmpty) {
    archiveEmpty.hidden = visibleCount !== 0;
  }

  if (savedOnlyButton) {
    savedOnlyButton.setAttribute(
      'aria-pressed',
      String(showSavedOnly)
    );

    savedOnlyButton.textContent = showSavedOnly
      ? 'SHOW ALL WORKS ↗'
      : 'SHOW SAVED ☆';
  }
}

archiveSearch?.addEventListener('input', updateArchive);
archiveFilter?.addEventListener('change', updateArchive);

savedOnlyButton?.addEventListener('click', () => {
  showSavedOnly = !showSavedOnly;
  updateArchive();
});

document.querySelectorAll('[data-favorite]').forEach((button) => {
  button.addEventListener('click', () => {
    const key = button.dataset.favorite;

    if (!Object.hasOwn(artworkNames, key)) return;

    if (savedArtworkKeys.has(key)) {
      savedArtworkKeys.delete(key);
    } else {
      savedArtworkKeys.add(key);
    }

    try {
      localStorage.setItem(
        'noir-museum-favorites',
        JSON.stringify([...savedArtworkKeys])
      );
    } catch (error) {
      console.warn('Could not persist saved artworks.', error);
    }

    syncFavoriteButtons();
    updateArchive();
  });
});

// Subtle scroll-reveal for collection cards.
if ('IntersectionObserver' in window) {
  document.documentElement.classList.add('archive-reveal-enabled');

  const archiveObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  archiveCards.forEach((card) => archiveObserver.observe(card));
}

syncFavoriteButtons();
updateArchive();
