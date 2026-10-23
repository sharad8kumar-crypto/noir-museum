import { gsap } from 'gsap';

// Cinematic intro: darkness, a beam of light opens, NOIR rises letter by letter.
// Skips itself on reduced-motion, on deep links (#collection...) and on click/Esc.
const hash = location.hash;
const skip =
  matchMedia('(prefers-reduced-motion: reduce)').matches ||
  (hash && hash !== '#home') ||
  sessionStorage.getItem('noir-intro') === '1';

if (!skip) {
  sessionStorage.setItem('noir-intro', '1');

  const css = document.createElement('style');
  css.textContent = `
    .nx-intro{position:fixed;inset:0;z-index:10000;background:#050505;overflow:hidden;
      display:grid;place-items:center;color:#ece8df}
    .nx-beam{position:absolute;top:0;left:50%;width:70vw;height:100%;transform:translateX(-50%);
      transform-origin:50% 0;clip-path:polygon(47% 0,53% 0,100% 100%,0 100%);filter:blur(8px);
      background:linear-gradient(to bottom,rgba(255,250,240,.6),rgba(255,250,240,0) 88%)}
    .nx-pool{position:absolute;left:50%;bottom:-8vh;width:60vw;height:22vh;transform:translateX(-50%);
      background:radial-gradient(ellipse at center,rgba(255,250,240,.35),transparent 70%)}
    .nx-word{position:relative;display:flex;font:500 clamp(72px,16vw,240px)/1 var(--font-display,serif);
      letter-spacing:-.04em}
    .nx-word span{display:inline-block}
    .nx-sub{position:absolute;top:calc(50% + clamp(60px,10vw,140px));left:0;right:0;text-align:center;
      font:500 11px var(--font-body,sans-serif);letter-spacing:.42em;color:#a39e94}
    .nx-skip{position:absolute;right:6%;bottom:6%;font:500 11px var(--font-body,sans-serif);
      letter-spacing:.3em;color:#6f6b63}`;
  document.head.appendChild(css);

  const el = document.createElement('div');
  el.className = 'nx-intro';
  el.innerHTML = `<div class="nx-beam"></div><div class="nx-pool"></div>
    <div class="nx-word">${[...'NOIR'].map((c) => `<span>${c}</span>`).join('')}<span>.</span></div>
    <div class="nx-sub">THE VIRTUAL SCULPTURE MUSEUM</div>
    <div class="nx-skip">CLICK TO SKIP</div>`;
  document.body.appendChild(el);
  document.documentElement.style.overflow = 'hidden';

  const letters = el.querySelectorAll('.nx-word span');
  gsap.set('.nx-beam', { scaleY: 0, opacity: 0 });
  gsap.set('.nx-pool', { opacity: 0 });
  gsap.set(letters, { y: 60, opacity: 0, filter: 'blur(14px)' });
  gsap.set('.nx-sub, .nx-skip', { opacity: 0 });

  let done = false;
  const tl = gsap.timeline({ onComplete: finish });

  function finish() {
    if (done) return;
    done = true;
    tl.kill();
    gsap.to(el, {
      opacity: 0, scale: 1.04, duration: 0.9, ease: 'power2.inOut',
      onComplete: () => {
        el.remove();
        css.remove();
        document.documentElement.style.overflow = '';
        document.body.classList.add('intro-done');
      }
    });
  }
  el.addEventListener('click', finish);
  addEventListener('keydown', (e) => { if (e.key === 'Escape' || e.key === ' ') finish(); });

  const start = () => {
    tl.to('.nx-skip', { opacity: 1, duration: 0.6 }, 0.2)
      .to('.nx-beam', { opacity: 1, scaleY: 1, duration: 1.4, ease: 'power3.out' }, 0.3)
      .to('.nx-pool', { opacity: 1, duration: 1.2 }, 0.9)
      .to(letters, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1.1, stagger: 0.14, ease: 'power3.out' }, 1.0)
      .to('.nx-sub', { opacity: 1, duration: 0.9 }, 2.0)
      .to({}, { duration: 1.0 });
  };
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1500))]).then(start);
}