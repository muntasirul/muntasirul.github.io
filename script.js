/* Progressive enhancement. Career content and links work without JavaScript. */
(() => {
  'use strict';
  const root = document.documentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const themeButton = document.querySelector('.theme-toggle');
  let hasSavedTheme = false;
  try { hasSavedTheme = ['light', 'dark'].includes(localStorage.getItem('portfolio-theme')); } catch {}

  function setTheme(theme, save = false) {
    root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#070B14' : '#F6F8FC';
    themeButton?.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
    if (save) {
      hasSavedTheme = true;
      try { localStorage.setItem('portfolio-theme', theme); } catch {}
    }
  }
  if (themeButton) {
    themeButton.hidden = false;
    setTheme(root.dataset.theme);
    themeButton.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark', true));
    systemTheme.addEventListener('change', e => { if (!hasSavedTheme) setTheme(e.matches ? 'dark' : 'light'); });
  }

  // A non-modal mobile menu. Escape closes it and restores the toggle's focus.
  const header = document.querySelector('.site-header');
  const nav = document.querySelector('.site-nav');
  const menuButton = document.querySelector('.menu-toggle');
  const mobile = window.matchMedia('(max-width: 860px)');
  function setMenu(open) {
    header?.toggleAttribute('data-menu-open', open);
    menuButton?.setAttribute('aria-expanded', String(open));
    menuButton?.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (nav) nav.inert = mobile.matches && !open;
  }
  if (header && nav && menuButton) {
    header.dataset.enhanced = '';
    root.classList.add('nav-ready');
    menuButton.hidden = false;
    setMenu(false);
    menuButton.addEventListener('click', () => setMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', e => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') { setMenu(false); menuButton.focus(); }
    });
    document.addEventListener('click', e => { if (!header.contains(e.target)) setMenu(false); });
    mobile.addEventListener('change', () => setMenu(false));
  }

  // Read the visible section once per animation frame, not on every scroll event.
  const navLinks = [...document.querySelectorAll('.site-nav a')];
  const navTargets = navLinks.map(a => document.querySelector(a.hash));
  let scrollQueued = false;
  function updateActiveNav() {
    scrollQueued = false;
    let active = null;
    navTargets.forEach(target => { if (target && target.getBoundingClientRect().top <= 180) active = target.id; });
    navLinks.forEach(a => { if (a.hash === `#${active}`) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  }
  window.addEventListener('scroll', () => { if (!scrollQueued) { scrollQueued = true; requestAnimationFrame(updateActiveNav); } }, { passive: true });
  window.addEventListener('resize', updateActiveNav);
  updateActiveNav();

  // Filters never gate access to content; all three projects are visible by default.
  const filters = document.querySelector('.filters');
  const projects = [...document.querySelectorAll('.project[data-category]')];
  function filterProjects(category) {
    let count = 0;
    projects.forEach(project => { project.hidden = category !== 'all' && project.dataset.category !== category; if (!project.hidden) count++; });
    filters?.querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
    const countLabel = document.querySelector('.project-count');
    if (countLabel) countLabel.textContent = `${count} ${count === 1 ? 'project' : 'projects'}`;
  }
  if (filters) {
    filters.hidden = false;
    filters.addEventListener('click', e => { const button = e.target.closest('button[data-filter]'); if (button) filterProjects(button.dataset.filter); });
  }
  function revealHashTarget(hash) {
    if (!hash || hash === '#') return;
    const target = document.getElementById(hash.slice(1));
    if (target?.matches('.project') && target.hidden) filterProjects('all');
    target?.classList.remove('is-pending');
  }
  document.querySelectorAll('a[href^="#"]').forEach(a => a.addEventListener('click', () => revealHashTarget(a.hash)));
  window.addEventListener('hashchange', () => revealHashTarget(location.hash));
  revealHashTarget(location.hash);

  // Reveal only after an observer exists; no-script and unsupported browsers stay visible.
  let observer;
  if ('IntersectionObserver' in window && !motion.matches) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.remove('is-pending'); observer.unobserve(entry.target); }
      });
    }, { threshold: 0.06, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > window.innerHeight) {
        observer.observe(element);
        element.classList.add('is-pending');
      }
    });
  }
  motion.addEventListener('change', e => {
    if (e.matches) { observer?.disconnect(); document.querySelectorAll('.is-pending').forEach(el => el.classList.remove('is-pending')); }
  });
  window.addEventListener('beforeprint', () => document.querySelectorAll('.is-pending').forEach(el => el.classList.remove('is-pending')));

  // Clipboard feedback is truthful; the address stays selectable when copying is unavailable.
  const copyButton = document.querySelector('.copy-email');
  const copyStatus = document.querySelector('.copy-status');
  let feedbackTimer;
  if (copyButton && copyStatus) {
    copyButton.hidden = false;
    copyButton.addEventListener('click', async () => {
      clearTimeout(feedbackTimer);
      try {
        if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
        await navigator.clipboard.writeText(copyButton.dataset.email);
        copyStatus.textContent = 'Email copied. Let’s start a conversation.';
      } catch {
        copyStatus.textContent = 'Select and copy the email address, or click it to open your email app.';
      }
      feedbackTimer = setTimeout(() => { copyStatus.textContent = ''; }, 6000);
    });
  }
})();
