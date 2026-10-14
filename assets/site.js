(() => {
  const $ = selector => document.querySelector(selector);
  const locale = $('#locale');
  const theme = $('#theme-toggle');
  const sidebar = $('#sidebar');
  const menu = $('#menu-toggle');
  const search = $('#search');
  const results = $('#search-results');
  const status = $('#search-status');
  const sections = [...document.querySelectorAll('.doc-section')];
  const navLinks = [...document.querySelectorAll('.nav-link')];
  const storageGet = key => { try { return localStorage.getItem(key); } catch { return null; } };
  const storageSet = (key, value) => { try { localStorage.setItem(key, value); } catch { /* Reading works without storage. */ } };
  const storedTheme = storageGet('voicedirector-theme');
  if (storedTheme === 'light' || storedTheme === 'dark') document.documentElement.dataset.theme = storedTheme;
  theme.addEventListener('click', () => {
    const value = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
    document.documentElement.dataset.theme = value;
    storageSet('voicedirector-theme', value);
  });
  locale.addEventListener('change', () => {
    const current = navLinks.find(link => link.classList.contains('active'));
    location.href = `../${locale.value}/${current ? current.hash : location.hash}`;
  });
  $('#print').addEventListener('click', () => window.print());
  let printDetails = [];
  window.addEventListener('beforeprint', () => {
    printDetails = [...document.querySelectorAll('details:not([open])')];
    printDetails.forEach(details => { details.open = true; });
  });
  window.addEventListener('afterprint', () => {
    printDetails.forEach(details => { details.open = false; }); printDetails = [];
  });
  const closeMenu = () => { sidebar.classList.remove('open'); menu.setAttribute('aria-expanded', 'false'); };
  menu.addEventListener('click', () => {
    const open = sidebar.classList.toggle('open');
    menu.setAttribute('aria-expanded', String(open));
    if (open) search.focus();
  });
  navLinks.forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('click', event => {
    if (sidebar.classList.contains('open') && !sidebar.contains(event.target) && !menu.contains(event.target)) closeMenu();
  });
  const normalize = value => value.normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase(document.documentElement.lang);
  const index = sections.map(section => ({ id: section.id, title: section.querySelector('h2').textContent, text: normalize(section.textContent) }));
  const clearSearch = () => { results.hidden = true; results.replaceChildren(); status.textContent = ''; };
  search.form.addEventListener('submit', event => event.preventDefault());
  search.addEventListener('input', () => {
    const words = normalize(search.value.trim()).split(/\s+/u).filter(Boolean);
    if (!words.length) { clearSearch(); return; }
    const matches = index.filter(item => words.every(word => item.text.includes(word)));
    results.replaceChildren();
    const label = document.body.dataset.searchLabel;
    status.textContent = `${label}: ${matches.length}`;
    if (!matches.length) {
      const message = document.createElement('p'); message.textContent = document.body.dataset.noResults; results.append(message);
    }
    for (const item of matches) {
      const link = document.createElement('a'); link.href = `#${item.id}`; link.textContent = item.title;
      link.addEventListener('click', () => { closeMenu(); search.value = ''; clearSearch(); const heading = document.getElementById(`${item.id}-title`); heading.tabIndex = -1; heading.focus({ preventScroll: true }); });
      results.append(link);
    }
    results.hidden = false;
  });
  search.addEventListener('keydown', event => {
    if (event.key === 'Escape') { search.value = ''; clearSearch(); }
    if (event.key === 'ArrowDown' || event.key === 'Enter') { const first = results.querySelector('a'); if (first) { event.preventDefault(); first.focus(); } }
  });
  results.addEventListener('keydown', event => {
    const links = [...results.querySelectorAll('a')]; const current = links.indexOf(document.activeElement);
    if (event.key === 'ArrowDown' && current >= 0) { event.preventDefault(); links[(current + 1) % links.length].focus(); }
    if (event.key === 'ArrowUp' && current >= 0) { event.preventDefault(); if (!current) search.focus(); else links[current - 1].focus(); }
    if (event.key === 'Escape') { search.focus(); clearSearch(); }
  });
  const updateActive = () => {
    let active = sections[0];
    for (const section of sections) { if (section.getBoundingClientRect().top <= 150) active = section; else break; }
    navLinks.forEach(link => { const selected = link.hash === `#${active.id}`; link.classList.toggle('active', selected); if (selected) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current'); });
  };
  let queued = false;
  window.addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { updateActive(); queued = false; }); } }, { passive: true });
  window.addEventListener('resize', updateActive); updateActive();
  const dialog = $('#image-dialog'); const image = $('#dialog-image'); const size = $('#image-size');
  let opener = null;
  document.querySelectorAll('[data-zoom]').forEach(button => button.addEventListener('click', () => {
    if (typeof dialog.showModal !== 'function') { window.open(button.dataset.zoom, '_blank', 'noopener'); return; }
    opener = button; image.src = button.dataset.zoom; image.alt = button.querySelector('img').alt;
    $('#image-title').textContent = image.alt; dialog.classList.remove('original'); size.setAttribute('aria-pressed', 'false');
    dialog.showModal(); $('#image-close').focus();
  }));
  size.addEventListener('click', () => { const original = dialog.classList.toggle('original'); size.setAttribute('aria-pressed', String(original)); });
  $('#image-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const rect = dialog.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close(); } });
  dialog.addEventListener('close', () => { image.removeAttribute('src'); if (opener) opener.focus({ preventScroll: true }); });
  document.addEventListener('keydown', event => {
    const editable = event.target.matches('input, textarea, select, [contenteditable="true"]');
    if (event.key === '/' && !editable && !dialog.open) { event.preventDefault(); if (matchMedia('(max-width: 900px)').matches) { sidebar.classList.add('open'); menu.setAttribute('aria-expanded', 'true'); } search.focus(); }
    if (event.key === 'Escape' && sidebar.classList.contains('open')) { closeMenu(); menu.focus(); }
  });
})();
