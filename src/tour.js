import { gsap } from 'gsap';

// Guided tour: drives the existing UI (tabs, INSPECT, RESET VIEW) on a timer and
// shows a caption. It never touches main.js, so it cannot break the 3D scene.
const STOPS = [
  { key: 'bust', name: 'Silent Monument',
    text: 'Look at the drapery. Every fold is carved from solid marble, yet it falls like soft cloth. The sculptor is teaching stone to behave like fabric.' },
  { key: 'vase', name: 'The Vessel',
    text: 'The dark figures were painted in clay slip before firing, so they stay sharp after thousands of years. Turn it slowly and read the story around its body.' },
  { key: 'torso', name: 'The Human Form',
    text: 'A fragment, yet complete. There is no head and no limbs, only weight, balance and muscle. Your eye fills in the rest.' }
];
const STOP_TIME = 13000;   // ms per sculpture
const ZOOM_AT = 4500;      // when the camera moves closer
const BACK_AT = 10000;     // when it moves back

const css = document.createElement('style');
css.textContent = `
  .nx-tour-pill{position:fixed;left:50%;bottom:28px;transform:translateX(-50%);z-index:900;display:flex;
    align-items:center;gap:12px;padding:14px 22px;background:rgba(10,10,9,.82);color:#ece8df;
    border:1px solid #3a3833;backdrop-filter:blur(10px);font:500 11px var(--font-body,sans-serif);
    letter-spacing:.3em;cursor:pointer}
  .nx-tour-pill:hover{border-color:#ece8df}
  body.nx-touring .nx-tour-pill{display:none!important}
  .nx-cap{position:fixed;left:0;right:0;margin:0 auto;bottom:7vh;z-index:900;width:min(640px,90vw);
    padding:22px 26px 26px;background:rgba(10,10,9,.82);border:1px solid #2a2926;color:#ece8df;
    backdrop-filter:blur(12px);opacity:0;pointer-events:none}
  .nx-cap.on{pointer-events:auto}
  .nx-cap small{display:block;font:500 10px var(--font-body,sans-serif);letter-spacing:.32em;color:#a39e94}
  .nx-cap h3{margin:8px 0 10px;font:500 28px/1 var(--font-display,serif);letter-spacing:-.02em}
  .nx-cap p{margin:0;font:400 15px/1.7 var(--font-body,sans-serif);color:#cfcabf}
  .nx-cap button{position:absolute;top:14px;right:16px;background:none;border:0;color:#a39e94;
    font:500 10px var(--font-body,sans-serif);letter-spacing:.3em;cursor:pointer}
  .nx-cap .bar{position:absolute;left:0;bottom:0;height:2px;width:100%;background:#ece8df;
    transform:scaleX(0);transform-origin:0 50%}`;
document.head.appendChild(css);

const pill = document.createElement('button');
pill.className = 'nx-tour-pill';
pill.type = 'button';
pill.textContent = '▶  BEGIN GUIDED TOUR';

const cap = document.createElement('div');
cap.className = 'nx-cap';
cap.innerHTML = '<button type="button">STOP ✕</button><small></small><h3></h3><p></p><div class="bar"></div>';
document.body.append(pill, cap);

const $ = (s) => document.querySelector(s);
const small = cap.querySelector('small'), h3 = cap.querySelector('h3');
const para = cap.querySelector('p'), bar = cap.querySelector('.bar');

let timers = [], touring = false;
const later = (fn, ms) => timers.push(setTimeout(fn, ms));

function stop(message) {
  if (!touring) return;
  touring = false;
  timers.forEach(clearTimeout);
  timers = [];
  gsap.killTweensOf(bar);
  document.body.classList.remove('nx-touring');
  $('.view-reset')?.click();
  if (message) {
    small.textContent = 'END OF TOUR';
    h3.textContent = 'Take your time.';
    para.textContent = 'Drag the sculpture, scroll to zoom, or open any work from the collection.';
    gsap.to(cap, { opacity: 1, duration: 0.5 });
    gsap.to(cap, { opacity: 0, duration: 0.8, delay: 5, onComplete: () => cap.classList.remove('on') });
  } else {
    gsap.to(cap, { opacity: 0, duration: 0.4, onComplete: () => cap.classList.remove('on') });
  }
}

function playStop(i) {
  if (!touring) return;
  if (i >= STOPS.length) return stop(true);
  const s = STOPS[i];
  $('.view-reset')?.click();
  $(`.gallery-tab[data-artwork="${s.key}"]`)?.click();

  small.textContent = `STOP ${String(i + 1).padStart(2, '0')} / ${String(STOPS.length).padStart(2, '0')}`;
  h3.textContent = s.name;
  para.textContent = s.text;
  cap.classList.add('on');
  gsap.fromTo(cap, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.8, delay: 0.6 });
  gsap.fromTo(bar, { scaleX: 0 }, { scaleX: 1, duration: STOP_TIME / 1000, ease: 'none' });

  later(() => $('#inspect')?.click(), ZOOM_AT);
  later(() => $('.view-reset')?.click(), BACK_AT);
  later(() => playStop(i + 1), STOP_TIME);
}

function begin() {
  if (touring) return;
  touring = true;
  document.body.classList.add('nx-touring');
  const onExhibition = document.body.dataset.page === 'exhibition';
  if (!onExhibition) location.hash = '#exhibition';
  later(() => {
    $('#scene')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    later(() => playStop(0), 700);
  }, onExhibition ? 100 : 1000);
}

pill.addEventListener('click', begin);
cap.querySelector('button').addEventListener('click', () => stop(false));
addEventListener('keydown', (e) => { if (e.key === 'Escape') stop(false); });
// touching the sculpture means the visitor wants control back
$('#scene')?.addEventListener('pointerdown', () => stop(false));