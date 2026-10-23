import { gsap } from 'gsap';

// Tiny client-side router. It does not rebuild the page: it shows/hides the
// existing sections, so the 3D scenes stay alive between pages.
const SLUG_TO_KEY = { bust: 'bust', vessel: 'vase', form: 'torso' };
const KEY_TO_SLUG = { bust: 'bust', vase: 'vessel', torso: 'form' };

const HASH_ROUTES = {
  '#home': '/',
  '#exhibition': '/exhibition',
  '#collection': '/collection',
  '#about': '/about',
  '#visit': '/about'
};

const PAGES = {
  '/': { name: 'home', sections: ['home', 'rooms'], title: 'NOIR — The Virtual Sculpture Museum' },
  '/exhibition': { name: 'exhibition', sections: ['exhibition'], title: 'Exhibition — NOIR' },
  '/collection': { name: 'collection', sections: ['collection'], title: 'Collection — NOIR' },
  '/about': { name: 'about', sections: ['about', 'visit'], title: 'About — NOIR' }
};
const NOT_FOUND = { name: '404', sections: ['not-found'], title: 'Room not found — NOIR' };
const ALL_SECTIONS = ['home', 'rooms', 'exhibition', 'collection', 'about', 'visit', 'not-found'];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let currentPath = null;

function injectSections() {
  const main = document.querySelector('main');
  const home = document.getElementById('home');
  if (!main || !home) return;

  home.insertAdjacentHTML(
    'afterend',
    `<section class="rooms" id="rooms" aria-label="Rooms of the museum">
      <a class="room" href="/exhibition"><span class="room-no">I</span><h2>Exhibition</h2><p>Three sculptures, lit and ready to turn in your hands.</p><span class="room-go">ENTER ↗</span></a>
      <a class="room" href="/collection"><span class="room-no">II</span><h2>Collection</h2><p>The archive. Search it, save from it, open any work.</p><span class="room-go">ENTER ↗</span></a>
      <a class="room" href="/about"><span class="room-no">III</span><h2>About</h2><p>Why the museum exists, and how to look at it.</p><span class="room-go">ENTER ↗</span></a>
    </section>`
  );

  main.insertAdjacentHTML(
    'beforeend',
    `<section class="route-404" id="not-found">
      <span class="section-kicker">ERROR 404</span>
      <h2>This room is <span>closed.</span></h2>
      <p>The page you are looking for does not exist in this museum.</p>
      <a class="text-link" href="/">RETURN TO THE ENTRANCE <span>↗</span></a>
    </section>`
  );
}

function parse(pathname) {
  const path = pathname.replace(/\/+$/, '') || '/';
  const deep = path.match(/^\/exhibition\/([\w-]+)$/);
  if (deep && SLUG_TO_KEY[deep[1]]) {
    return { page: PAGES['/exhibition'], path, key: SLUG_TO_KEY[deep[1]] };
  }
  return { page: PAGES[path] || NOT_FOUND, path };
}

function apply(route, animate) {
  const visible = new Set(route.page.sections);
  ALL_SECTIONS.forEach((id) => {
    document.getElementById(id)?.classList.toggle('is-route-hidden', !visible.has(id));
  });

  document.body.dataset.page = route.page.name;
  document.title = route.page.title;

  const first = route.path.split('/')[1] || '';
  document.querySelectorAll('.site-nav a').forEach((a) => {
    const section = new URL(a.href, location.origin).pathname.split('/')[1];
    if (section && section === first) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  document.querySelector('.topbar')?.classList.remove('nav-open');
  document.querySelector('.nav-toggle')?.setAttribute('aria-expanded', 'false');

  window.scrollTo(0, 0);

  if (route.key) {
    document.querySelector(`.gallery-tab[data-artwork="${route.key}"]`)?.click();
  }

  if (animate && !reducedMotion.matches) {
    gsap.fromTo(
      'main',
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', clearProps: 'opacity,transform' }
    );
  }
}

let busy = false;

// Dark curtain with the wordmark wipes up, the page swaps underneath, then it lifts.
function withCurtain(change) {
  const curtain = document.querySelector('.curtain');
  if (!curtain || busy || reducedMotion.matches) {
    change();
    return;
  }
  busy = true;
  gsap
    .timeline({ onComplete: () => { busy = false; } })
    .set(curtain, { pointerEvents: 'auto', clipPath: 'inset(100% 0% 0% 0%)' })
    .to(curtain, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.55, ease: 'power3.inOut' })
    .add(change)
    .to(curtain, { clipPath: 'inset(0% 0% 100% 0%)', duration: 0.65, ease: 'power3.inOut', delay: 0.1 })
    .set(curtain, { pointerEvents: 'none' });
}

function navigate(path) {
  if (path === currentPath || busy) return;
  withCurtain(() => {
    history.pushState({}, '', path);
    currentPath = path;
    apply(parse(path), false);
  });
}

export function initRouter() {
  injectSections();

  const curtain = document.createElement('div');
  curtain.className = 'curtain';
  curtain.setAttribute('aria-hidden', 'true');
  curtain.innerHTML = '<span>NOIR<i>.</i></span>';
  document.body.appendChild(curtain);

  document.addEventListener(
    'click',
    (event) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      // Collection cards go to the deep link instead of scrolling.
      const open = event.target.closest('[data-open-artwork]');
      if (open && KEY_TO_SLUG[open.dataset.openArtwork]) {
        event.preventDefault();
        event.stopPropagation();
        navigate(`/exhibition/${KEY_TO_SLUG[open.dataset.openArtwork]}`);
        return;
      }

      // Tabs and the pager keep the URL in sync without adding history entries.
      const tab = event.target.closest('.gallery-tab');
      if (tab && KEY_TO_SLUG[tab.dataset.artwork]) {
        const url = `/exhibition/${KEY_TO_SLUG[tab.dataset.artwork]}`;
        history.replaceState({}, '', url);
        currentPath = url;
        return;
      }

      const link = event.target.closest('a[href]');
      if (!link || link.target) return;
      const href = link.getAttribute('href');
      const dest =
        HASH_ROUTES[href] ?? (href.startsWith('/') && !href.startsWith('//') ? href : null);
      if (!dest) return;

      event.preventDefault();
      navigate(dest);
    },
    true
  );

  window.addEventListener('popstate', () => {
    withCurtain(() => {
      currentPath = location.pathname;
      apply(parse(location.pathname), false);
    });
  });

  currentPath = location.pathname;
  apply(parse(location.pathname), false);
}