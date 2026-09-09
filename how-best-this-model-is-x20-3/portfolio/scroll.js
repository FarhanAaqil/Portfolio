(() => {
  'use strict';
  const root = document.documentElement;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const desktop = matchMedia('(min-width: 769px)');
  const toggle = document.querySelector('.motion-toggle');
  let enabled = !reduced.matches;
  let frame = 0;
  const hero = document.querySelector('.hero');
  const heroContent = document.querySelector('.hero-content');
  const orbit = document.querySelector('.hero-orbit');
  const about = document.querySelector('#about .exp-card p');
  // Preserve the paragraph's text and line breaks for assistive technology.
  const walker = document.createTreeWalker(about, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const fragment = document.createDocumentFragment();
    node.textContent.split(/(\s+)/).forEach(text => {
      if (!text.trim()) fragment.append(document.createTextNode(text));
      else {
        const span = document.createElement('span');
        span.className = 'word';
        span.textContent = text;
        fragment.append(span);
      }
    });
    node.replaceWith(fragment);
  });
  const words = [...about.querySelectorAll('.word')];
  const cards = [...document.querySelectorAll('.project-card')];
  const sections = [...document.querySelectorAll('section[id]')];
  const links = [...document.querySelectorAll('.nav-links a')];
  const clamp = value => Math.min(1, Math.max(0, value));
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });
  document.querySelectorAll('.reveal, section > h2, section > .section-label, .contact-inner').forEach(el => {
    el.classList.add('reveal');
    revealObserver.observe(el);
  });

  function measure() {
    cards.forEach(card => {
      // Only pin panels that fit entirely below navigation; tall content stays scrollable.
      card.classList.toggle('is-stack', enabled && desktop.matches && card.offsetHeight < innerHeight - 140);
    });
    schedule();
  }
  function paint() {
    frame = 0;
    const height = innerHeight;
    root.style.setProperty('--scroll', clamp(scrollY / Math.max(1, root.scrollHeight - height)));
    let current = '';
    sections.forEach(section => { if (section.getBoundingClientRect().top < height * .45) current = section.id; });
    links.forEach(link => {
      if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    if (!enabled) return;
    const heroProgress = clamp(-hero.getBoundingClientRect().top / hero.offsetHeight);
    heroContent.style.transform = desktop.matches ? `translateY(${heroProgress * 110}px)` : '';
    heroContent.style.opacity = 1 - heroProgress * .65;
    orbit.style.setProperty('--orbit', `${-20 + heroProgress * 140}deg`);
    const bounds = about.getBoundingClientRect();
    const reading = clamp((height * .9 - bounds.top) / (bounds.height + height * .3));
    words.forEach((word, index) => word.classList.toggle('lit', index / words.length <= reading));
    cards.forEach((card, index) => {
      const next = cards[index + 1];
      const progress = next && card.classList.contains('is-stack') ? clamp((height - next.getBoundingClientRect().top) / (height - 100)) : 0;
      card.style.setProperty('--card-scale', 1 - progress * .045);
      card.style.setProperty('--card-light', 1 - progress * .3);
    });
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(paint); }
  function setMotion(value) {
    enabled = value;
    root.classList.toggle('motion-enabled', enabled);
    root.classList.toggle('motion-disabled', !enabled);
    toggle.textContent = enabled ? 'Motion: on' : 'Motion: off';
    toggle.setAttribute('aria-pressed', String(enabled));
    heroContent.style.transform = '';
    heroContent.style.opacity = '';
    orbit.style.removeProperty('--orbit');
    cards.forEach(card => { card.style.removeProperty('--card-scale'); card.style.removeProperty('--card-light'); });
    measure();
  }
  toggle.addEventListener('click', () => setMotion(!enabled));
  reduced.addEventListener('change', () => setMotion(!reduced.matches));
  desktop.addEventListener('change', measure);
  addEventListener('scroll', schedule, { passive: true });
  addEventListener('resize', measure, { passive: true });
  new ResizeObserver(measure).observe(document.querySelector('.projects-grid'));
  document.fonts.ready.then(measure);
  setMotion(enabled);

  const menu = document.querySelector('.menu-toggle');
  const navLinks = document.querySelector('.nav-links');
  const closeMenu = () => { menu.setAttribute('aria-expanded', 'false'); navLinks.classList.remove('is-open'); };
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    navLinks.classList.toggle('is-open', open);
  });
  links.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') { closeMenu(); } });
  desktop.addEventListener('change', closeMenu);
  document.querySelectorAll('a[target="_blank"]').forEach(link => link.rel = 'noopener noreferrer');
})();
