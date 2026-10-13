/* Progressive enhancements. All content, case studies, and contact links
   remain usable without JavaScript. No third-party scripts or analytics. */
(() => {
  'use strict';
  const root = document.documentElement;
  const themeButton = document.querySelector('.theme-toggle');
  const menuButton = document.querySelector('.menu-toggle');
  const navigation = document.getElementById('navigation');
  const status = document.getElementById('status');
  let statusTimer;

  const sun = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/></svg>';
  const moon = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 13a9 9 0 0 1-10-10A9 9 0 1 0 21 13Z"/></svg>';
  const menu = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>';
  const close = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg>';

  function applyTheme(theme) {
    const safeTheme = theme === 'light' ? 'light' : 'dark';
    root.dataset.theme = safeTheme;
    const label = safeTheme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
    if (themeButton) {
      themeButton.innerHTML = safeTheme === 'dark' ? sun : moon;
      themeButton.setAttribute('aria-label', label);
      themeButton.title = label;
    }
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.content = safeTheme === 'dark' ? '#101310' : '#f7f8f2';
  }
  applyTheme(root.dataset.theme);
  if (themeButton) {
    themeButton.hidden = false;
    themeButton.addEventListener('click', () => {
      const theme = root.dataset.theme === 'dark' ? 'light' : 'dark';
      applyTheme(theme);
      try { localStorage.setItem('jm-portfolio-theme', theme); } catch (_) { /* Theme still works without persistence. */ }
    });
  }

  function setMenu(open, restoreFocus = false) {
    if (!menuButton || !navigation) return;
    navigation.classList.toggle('is-open', open);
    menuButton.setAttribute('aria-expanded', String(open));
    menuButton.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menuButton.innerHTML = open ? close : menu;
    if (restoreFocus) menuButton.focus();
  }
  if (menuButton && navigation) {
    menuButton.hidden = false;
    menuButton.addEventListener('click', event => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      setMenu(open);
      if (open && event.detail === 0) {
        const firstLink = navigation.querySelector('a');
        if (firstLink) firstLink.focus();
      }
    });
    navigation.addEventListener('click', event => {
      const anchor = event.target.closest('a[href^="#"]');
      if (!anchor || menuButton.getAttribute('aria-expanded') !== 'true') return;
      setMenu(false);
      // Move focus to the selected section rather than leave it in a hidden menu.
      const target = document.getElementById(anchor.hash.slice(1));
      if (target) {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        target.addEventListener('blur', () => target.removeAttribute('tabindex'), { once: true });
      }
    });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape' && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false, true);
    });
    document.addEventListener('click', event => {
      const fromHeader = event.composedPath().some(node => node instanceof Element && node.classList.contains('site-header'));
      if (!fromHeader && menuButton.getAttribute('aria-expanded') === 'true') setMenu(false);
    });
    const desktop = window.matchMedia('(min-width: 721px)');
    if (desktop.addEventListener) desktop.addEventListener('change', () => setMenu(false));
  }
  root.classList.add('js');

  const links = [...document.querySelectorAll('.nav-panel a[href^="#"]')];
  const sections = links.map(link => document.getElementById(link.hash.slice(1))).filter(Boolean);
  // Native scroll listener is throttled to one update per animation frame.
  let scheduled = false;
  function updateActiveSection() {
    let current = '';
    for (const section of sections) {
      if (section.getBoundingClientRect().top <= 180) current = section.id;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10) current = 'contact';
    for (const link of links) {
      if (link.hash === '#' + current) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
    scheduled = false;
  }
  window.addEventListener('scroll', () => {
    if (!scheduled) { scheduled = true; window.requestAnimationFrame(updateActiveSection); }
  }, { passive: true });
  window.addEventListener('resize', updateActiveSection, { passive: true });
  updateActiveSection();

  function announce(message) {
    if (!status) return;
    window.clearTimeout(statusTimer);
    status.textContent = message;
    status.classList.add('is-visible');
    statusTimer = window.setTimeout(() => status.classList.remove('is-visible'), 4500);
  }

  async function copyText(text) {
    if (window.isSecureContext && navigator.clipboard && navigator.clipboard.writeText) {
      try { await navigator.clipboard.writeText(text); return true; } catch (_) { /* Fall back below for restricted clipboard permissions. */ }
    }
    // Legacy fallback lets the offline HTML work in common desktop browsers.
    const previousFocus = document.activeElement;
    const field = document.createElement('textarea');
    field.value = text;
    field.readOnly = true;
    field.setAttribute('aria-label', 'Email address to copy');
    field.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0;';
    document.body.append(field);
    let success = false;
    try { field.select(); success = document.execCommand('copy'); } catch (_) { success = false; }
    field.remove();
    if (previousFocus && previousFocus.focus) previousFocus.focus({ preventScroll: true });
    return success;
  }
  document.querySelectorAll('[data-copy]').forEach(button => {
    button.hidden = false;
    button.addEventListener('click', async () => {
      const text = button.dataset.copy;
      if (!text) return;
      const success = await copyText(text);
      announce(success ? 'Email address copied to clipboard.' : 'Please select and copy the email address shown above.');
    });
  });

  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Include every case-study paragraph in browser printing, then restore state.
  let printStates = [];
  window.addEventListener('beforeprint', () => {
    printStates = [...document.querySelectorAll('details')].map(detail => [detail, detail.open]);
    printStates.forEach(([detail]) => { detail.open = true; });
  });
  window.addEventListener('afterprint', () => {
    printStates.forEach(([detail, open]) => { detail.open = open; });
    printStates = [];
  });
})();
