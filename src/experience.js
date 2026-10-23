import './intro.js';
import './tour.js';
// NOIR experience layer: custom cursor, scroll progress bar, 3D card tilt.
// Injects its own CSS, so it does not depend on style.css.
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

const css = document.createElement('style');
css.textContent = `
  .nx-progress{position:fixed;top:0;left:0;height:2px;width:100%;background:#f4f2ed;
    transform:scaleX(0);transform-origin:0 50%;z-index:9998;pointer-events:none}
  .nx-dot,.nx-ring{position:fixed;top:0;left:0;pointer-events:none;z-index:9999;
    border-radius:50%;mix-blend-mode:difference;will-change:transform}
  .nx-dot{width:6px;height:6px;margin:-3px 0 0 -3px;background:#fff}
  .nx-ring{width:36px;height:36px;margin:-18px 0 0 -18px;border:1px solid rgba(255,255,255,.7);
    transition:width .25s,height .25s,margin .25s,background .25s}
  .nx-ring.hot{width:64px;height:64px;margin:-32px 0 0 -32px;background:rgba(255,255,255,.12)}
  html.nx-cursor,html.nx-cursor *{cursor:none!important}
  html.nx-cursor #scene,html.nx-cursor #scene *{cursor:grab!important}
`;
document.head.appendChild(css);

const bar = document.createElement('div');
bar.className = 'nx-progress';
document.body.appendChild(bar);
const updateBar = () => {
  const max = document.documentElement.scrollHeight - innerHeight;
  bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
};
addEventListener('scroll', updateBar, { passive: true });
addEventListener('resize', updateBar);
updateBar();

if (fine) {
  document.documentElement.classList.add('nx-cursor');
  const dot = document.createElement('div');
  const ring = document.createElement('div');
  dot.className = 'nx-dot';
  ring.className = 'nx-ring';
  document.body.append(ring, dot);

  let x = -100, y = -100, rx = -100, ry = -100;
  addEventListener('pointermove', (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  (function loop() {
    rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
    dot.style.transform = `translate(${x}px,${y}px)`;
    ring.style.transform = `translate(${rx}px,${ry}px)`;
    requestAnimationFrame(loop);
  })();

  const hot = 'a, button, input, select, [data-open-artwork], .collection-art';
  document.addEventListener('pointerover', (e) => {
    ring.classList.toggle('hot', !!e.target.closest(hot));
  });
}

// 3D tilt on collection cards (cards are created after load, so delegate).
let tilted = null;
document.addEventListener('pointermove', (e) => {
  const card = e.target.closest?.('.collection-art');
  if (tilted && tilted !== card) { tilted.style.transform = ''; tilted = null; }
  if (!card) return;
  const r = card.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width - 0.5;
  const py = (e.clientY - r.top) / r.height - 0.5;
  card.style.transition = 'transform .15s ease-out';
  card.style.transform = `perspective(900px) rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(0)`;
  tilted = card;
}, { passive: true });

// Scroll reveal: headings, rooms and cards fade up as they enter the screen.
if (!matchMedia('(prefers-reduced-motion: reduce)').matches && 'IntersectionObserver' in window) {
  const st = document.createElement('style');
  st.textContent = `
    .nx-rv{opacity:0;transform:translateY(28px);
      transition:opacity .9s ease,transform .9s cubic-bezier(.2,.7,.2,1)}
    .nx-rv.nx-in{opacity:1;transform:none}`;
  document.head.appendChild(st);

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('nx-in');
      io.unobserve(en.target);
    });
  }, { threshold: 0.12 });

  const sel = '.section-heading, .room, .collection-card, .about-content, .visit-section h2, .object-card';
  const scan = () => document.querySelectorAll(sel).forEach((el) => {
    if (el.dataset.nx) return;
    el.dataset.nx = '1';
    el.classList.add('nx-rv');
    io.observe(el);
  });
  scan();
  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; scan(); });
  }).observe(document.body, { childList: true, subtree: true });
}