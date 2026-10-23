import * as THREE from 'three';
import './experience.js';

// NOIR background
//  Layer 1: fixed B&W sculpture photo, relit by a light that follows the cursor
//           (surface normals are estimated from the photo's brightness).
//  Layer 2: the 3D point-cloud knot + wireframe shell (the original pattern).
const canvas = document.createElement('canvas');
canvas.id = 'bg3d';
canvas.setAttribute('aria-hidden', 'true');
// 'screen' blend: dark parts show the smoke (#atmo) underneath, bright parts add light.
canvas.style.mixBlendMode = 'screen';
// premium.css hides #bg3d unless body[data-page='home'] (router is not active), so force it on.
canvas.style.setProperty('display', 'block', 'important');
document.body.prepend(canvas);

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 760px)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, isMobile ? 1.25 : 1.5));
renderer.setClearColor(0x000000, 1);
renderer.autoClear = false;

/* ---------- Layer 1: photo + cursor light ---------- */
const bgScene = new THREE.Scene();
const bgCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const blank = new THREE.DataTexture(new Uint8Array([8, 8, 8, 255]), 1, 1);
blank.needsUpdate = true;

const U = {
  uT: { value: blank },
  uAsp: { value: 0.667 },
  uTexel: { value: new THREE.Vector2(1 / 1717, 1 / 2576) },
  uRes: { value: new THREE.Vector2(1, 1) },
  uC: { value: new THREE.Vector2() },
  uH: { value: 1000 },
  uLight: { value: new THREE.Vector2() },
  uMouse: { value: new THREE.Vector2() },
  uHero: { value: 1 },
  uTime: { value: 0 }
};

bgScene.add(new THREE.Mesh(
  new THREE.PlaneGeometry(2, 2),
  new THREE.ShaderMaterial({
    uniforms: U,
    depthTest: false,
    vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `
      #define FX 0.58   // sculpture position inside the photo
      #define FY 0.60
      uniform sampler2D uT;
      uniform float uAsp, uH, uHero, uTime;
      uniform vec2 uRes, uC, uLight, uMouse, uTexel;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      vec3 tex(vec2 s){ return texture2D(uT, vec2(clamp(s.x, 0., 1.), 1. - clamp(s.y, 0., 1.))).rgb; }
      float lum(vec2 s){ return dot(tex(s), vec3(.299, .587, .114)); }

      void main() {
        vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
        float h = uH, w = h * uAsp;
        vec2 o = vec2(uC.x - FX * w, uC.y - FY * h);
        vec2 uv = (p - o) / vec2(w, h);

        // tiny depth shift with the mouse (bright parts move more)
        uv += vec2(uMouse.x, uMouse.y) * (lum(uv) - .35) * .012;
        vec3 c = tex(uv);
        float d = lum(uv);

        // surface normal from brightness gradient
        vec2 e = uTexel * 3.;
        float dx = lum(uv + vec2(e.x, 0.)) - lum(uv - vec2(e.x, 0.));
        float dy = lum(uv + vec2(0., e.y)) - lum(uv - vec2(0., e.y));
        vec3 N = normalize(vec3(-dx * 7., -dy * 7., 1.));

        // light that follows the cursor
        vec3 L = normalize(vec3((uLight - p) / uH, .28));
        float diff = max(dot(N, L), 0.);
        float spec = pow(max(dot(N, normalize(L + vec3(0., 0., 1.))), 0.), 36.);
        float dist = length(p - uLight) / uRes.y;
        float att = exp(-dist * dist / (2. * .2 * .2));

        vec3 col = c * .75
                 + c * diff * att * 1.5
                 + vec3(spec) * att * .55 * smoothstep(.06, .4, d)
                 + vec3(.85, .84, .8) * att * .04;

        float m = smoothstep(0., .24, uv.x) * smoothstep(0., .10, 1. - uv.x)
                * smoothstep(0., .08, uv.y) * smoothstep(0., .08, 1. - uv.y);
        col *= m;

        float g = dot(col, vec3(.299, .587, .114));
        col = mix(vec3(g), col, .25) * vec3(1.03, 1.0, .96);

        vec2 q = p / uRes;
        col *= (.55 + .45 * smoothstep(.1, .6, q.x)) * mix(.88, 1., uHero);
        col *= 1. - .5 * pow(distance(q, vec2(.5)) * 1.2, 2.);
        col += (hash(p + uTime) - .5) * .03;
        gl_FragColor = vec4(max(col, vec3(0.)), 1.);
      }`
  })
));

new THREE.TextureLoader().load('/Images/bust-bg.webp', (tex) => {
  tex.anisotropy = 4;
  U.uT.value = tex;
  U.uAsp.value = tex.image.width / tex.image.height;
  U.uTexel.value.set(1 / tex.image.width, 1 / tex.image.height);
  if (reduced) frame(0);
});

/* ---------- Layer 2: original 3D pattern ---------- */
const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x080808, 6, 16);
const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
camera.position.set(0, 0, 9);

const group = new THREE.Group();
scene.add(group);

const points = new THREE.Points(
  new THREE.TorusKnotGeometry(2.2, 0.62, isMobile ? 220 : 380, 14, 2, 3),
  new THREE.PointsMaterial({
    color: 0xf4f2ed, size: 0.02, transparent: true,
    opacity: 0.4, depthWrite: false, sizeAttenuation: true
  })
);
const shell = new THREE.Mesh(
  new THREE.IcosahedronGeometry(3.6, 1),
  new THREE.MeshBasicMaterial({
    color: 0xffffff, wireframe: true, transparent: true,
    opacity: 0.06, depthWrite: false
  })
);
group.add(points, shell);

const PATTERN_X = 1.6; // pattern ko left/right karne ke liye ye number badlo

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.getDrawingBufferSize(U.uRes.value);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  group.position.x = isMobile ? 0 : PATTERN_X;
  group.scale.setScalar(isMobile ? 0.7 : 1.1);
  if (reduced) frame(0);
}
addEventListener('resize', resize);
resize();

/* ---------- Input + loop ---------- */
let tx = innerWidth * 0.66, ty = innerHeight * 0.4; // cursor target (css px)
let lx = tx, ly = ty, nx = 0, ny = 0, mx = 0, my = 0;

addEventListener('pointermove', (e) => {
  tx = e.clientX; ty = e.clientY;
  nx = (e.clientX / innerWidth - 0.5) * 2;
  ny = (e.clientY / innerHeight - 0.5) * 2;
}, { passive: true });

const sm = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function frame(t) {
  const s = t * 0.001;
  const dpr = renderer.getPixelRatio();
  const vh = innerHeight;

  lx += (tx - lx) * 0.12; ly += (ty - ly) * 0.12;
  mx += (nx - mx) * 0.05; my += (ny - my) * 0.05;

  // Photo stays fixed on screen; scroll never moves it.
  U.uH.value = (isMobile ? vh * 1.15 : vh * 1.45) * dpr;
  U.uC.value.set(
    (isMobile ? innerWidth * 0.5 : innerWidth * 0.73) * dpr,
    (isMobile ? vh * 0.5 : vh * 0.58) * dpr
  );
  U.uLight.value.set(lx * dpr, ly * dpr);
  U.uMouse.value.set(mx, my);
  U.uHero.value = 1 - sm(0, vh * 0.8, scrollY);
  U.uTime.value = (s % 100) * 0.1;

  const fade = Math.max(0, 1 - scrollY / (vh * 1.4));
  points.rotation.y = s * 0.08 + mx * 0.25;
  points.rotation.x = s * 0.04 + my * 0.15;
  shell.rotation.y = -s * 0.03;
  group.position.y = Math.sin(s * 0.4) * 0.12;
  points.material.opacity = 0.3 + 0.25 * fade;

  renderer.clear();
  renderer.render(bgScene, bgCam);
  renderer.clearDepth();
  renderer.render(scene, camera);
}

if (!reduced) {
  const loop = (t) => { if (!document.hidden) frame(t); requestAnimationFrame(loop); };
  requestAnimationFrame(loop);
}