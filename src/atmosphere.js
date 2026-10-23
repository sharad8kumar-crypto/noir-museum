import * as THREE from 'three';

// One fullscreen shader behind the whole site: drifting smoke, a pool of light
// that follows the cursor, faint vertical shafts. Rendered at low resolution
// (smoke is soft anyway), so it is cheap on every page.
const canvas = document.createElement('canvas');
canvas.id = 'atmo';
canvas.setAttribute('aria-hidden', 'true');
document.body.prepend(canvas);

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 760px)').matches;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false });
renderer.setPixelRatio(isMobile ? 0.4 : 0.6);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

const uniforms = {
  uTime: { value: 0 },
  uRes: { value: new THREE.Vector2(1, 1) },
  uMouse: { value: new THREE.Vector2(0.7, 0.55) },
  uScroll: { value: 0 },
  uDim: { value: 1 }
};

const material = new THREE.ShaderMaterial({
  uniforms,
  depthTest: false,
  depthWrite: false,
  vertexShader: `void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }`,
  fragmentShader: `
    uniform float uTime, uScroll, uDim;
    uniform vec2 uRes, uMouse;

    float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
                 mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }
    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.02 + vec2(17.0, 9.0); a *= 0.5; }
      return v;
    }

    // ---- stone wall: noise + marble veins, lit like a real surface ----
    float stoneH(vec2 q) {
      vec2 q0 = q;
      float h = 0.0, a = 0.5;
      for (int i = 0; i < 4; i++) { h += a * noise(q); q = q * 2.1 + 9.0; a *= 0.5; }
      float v = abs(sin((q0.x * 1.3 + q0.y * 0.8 + h * 3.0) * 3.1416));
      return h + pow(1.0 - v, 8.0) * 0.22;
    }

    void main() {
      float aspect = uRes.x / uRes.y;
      vec2 uv = gl_FragCoord.xy / uRes;
      vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
      float t = uTime * 0.035;

      vec2 q = p * 1.5 + vec2(0.0, uScroll * 0.0003);
      float w = fbm(q + vec2(t, -t * 0.6) + fbm(q * 1.7 - t) * 0.9);
      float smoke = smoothstep(0.34, 0.95, w);

      float d = length(p - (uMouse - 0.5) * vec2(aspect, 1.0) * 0.9);
      float pool = exp(-d * d * 2.4);

      float shaft = smoothstep(0.35, 0.9, fbm(vec2(p.x * 2.4 + t * 2.0, 0.5)))
                  * smoothstep(-0.5, 0.6, p.y) * 0.05;

      float vig = smoothstep(1.3, 0.25, length(p));
      vec2 sq = p * 2.6;
      float se = 0.01;
      float sdx = stoneH(sq + vec2(se, 0.0)) - stoneH(sq - vec2(se, 0.0));
      float sdy = stoneH(sq + vec2(0.0, se)) - stoneH(sq - vec2(0.0, se));
      vec3 sN = normalize(vec3(-sdx * 18.0, -sdy * 18.0, 1.0));
      vec2 mp = (uMouse - 0.5) * vec2(aspect, 1.0);
      vec2 dm = mp - p;
      vec3 sL = normalize(vec3(dm, 0.35));
      float sAtt = exp(-dot(dm, dm) * 3.2);
      vec2 kp = vec2(0.55 * aspect, 0.6);
      vec2 dk = kp - p;
      vec3 sK = normalize(vec3(dk, 0.8));
      float stone = max(dot(sN, sL), 0.0) * sAtt * 0.5
                  + max(dot(sN, sK), 0.0) * 0.18 * exp(-dot(dk, dk) * 0.5)
                  + stoneH(sq) * 0.03;
      float lum = (smoke * 0.15 + pool * (0.04 + smoke * 0.13) + shaft + stone * 0.35) * vig * uDim;

      vec3 base = vec3(0.039, 0.039, 0.035);
      gl_FragColor = vec4(base + vec3(0.93, 0.91, 0.86) * lum, 1.0);
    }`
});
scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material));

function resize() {
  renderer.setSize(window.innerWidth, window.innerHeight, false);
  const size = renderer.getDrawingBufferSize(new THREE.Vector2());
  uniforms.uRes.value.copy(size);
  if (reduced) renderer.render(scene, camera);
}
window.addEventListener('resize', resize);
resize();

const target = new THREE.Vector2(0.7, 0.55);
window.addEventListener(
  'pointermove',
  (e) => target.set(e.clientX / window.innerWidth, 1 - e.clientY / window.innerHeight),
  { passive: true }
);

const clock = new THREE.Clock();

function frame() {
  requestAnimationFrame(frame);
  uniforms.uTime.value = clock.getElapsedTime();
  uniforms.uScroll.value = window.scrollY;
  uniforms.uMouse.value.lerp(target, 0.04);
  // LIGHT: OFF in the header dims the whole atmosphere too.
  const dim = document.body.classList.contains('lights-off') ? 0.2 : 1;
  uniforms.uDim.value += (dim - uniforms.uDim.value) * 0.06;
  renderer.render(scene, camera);
}

if (reduced) renderer.render(scene, camera);
else frame();