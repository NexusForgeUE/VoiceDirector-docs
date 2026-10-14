import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const locales = [
  ['en', 'English'], ['ru', 'Русский'], ['de', 'Deutsch'], ['fr', 'Français'],
  ['es', 'Español'], ['pt-BR', 'Português (Brasil)'], ['zh-Hans', '简体中文'],
  ['ja', '日本語'], ['ko', '한국어'],
];
const ids = ['start', 'install', 'first-take', 'script', 'datatable', 'voices', 'kokoro', 'elevenlabs', 'jobs', 'takes', 'publish', 'game', 'localization', 'actor', 'settings', 'backup', 'troubleshooting', 'faq', 'support'];
const groups = [[0, 3], [3, 5], [5, 9], [9, 14], [14, 19]];
const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const baseURL = 'https://nexusforgeue.github.io/VoiceDirector-docs/';
const screenshotSizes = {};
const assetVersions = {};

function figure(name, content) {
  if (!['lines', 'voices', 'jobs', 'publish', 'settings'].includes(name)) throw new Error(`Unknown screenshot: ${name}`);
  const caption = escape(content.captions[name]);
  const [width, height] = screenshotSizes[name];
  return `<figure class="screenshot"><button type="button" class="shot-open" data-zoom="../assets/screenshots/${name}.png" aria-label="${escape(content.ui.zoom)}: ${caption}"><img src="../assets/screenshots/${name}.png" alt="${caption}" width="${width}" height="${height}" loading="lazy"><span class="zoom-hint">${escape(content.ui.zoom)} <span aria-hidden="true">↗</span></span></button><figcaption>${caption}</figcaption></figure>`;
}

function sample(content) {
  const u = content.ui;
  return `<div class="sample-box"><div><span class="eyebrow">${escape(u.example)}</span><h3>${escape(u.sampleTitle)}</h3><p>${escape(u.sampleDescription)}</p></div><div class="sample-actions"><a class="button primary" href="../assets/examples/first-line.csv" download="VoiceDirector-first-line.csv">${escape(u.downloadCSV)}</a><a class="button" href="../assets/examples/first-line.wav" download="VoiceDirector-first-line.wav">${escape(u.downloadWAV)}</a></div><audio controls preload="none" src="../assets/examples/first-line.wav" aria-label="${escape(u.listenSample)}"><a href="../assets/examples/first-line.wav">${escape(u.downloadWAV)}</a></audio></div>`;
}

function nav(content) {
  return groups.map(([from, to], group) => `<div class="nav-group"><p>${escape(content.ui.groups[group])}</p>${content.sections.slice(from, to).map((section, offset) => `<a href="#${section.id}" class="nav-link"><span class="nav-number" aria-hidden="true">${from + offset + 1}</span>${escape(section.title)}</a>`).join('')}</div>`).join('');
}

function render(content, locale) {
  if (content.sections.map(section => section.id).join('|') !== ids.join('|')) throw new Error(`Section parity failed: ${locale}`);
  const u = content.ui;
  const body = content.sections.map(section => `<section id="${section.id}" class="doc-section" aria-labelledby="${section.id}-title"><div class="section-heading"><span class="section-index" aria-hidden="true">${ids.indexOf(section.id) + 1}</span><h2 id="${section.id}-title">${escape(section.title)}</h2><a href="#${section.id}" class="anchor-link" aria-label="${escape(u.linkSection)}">#</a></div>${section.body.replace(/\{\{shot:([a-z]+)\}\}/g, (_, name) => figure(name, content)).replace('{{sample}}', sample(content))}</section>`).join('\n');
  const options = locales.map(([code, label]) => `<option value="${code}"${code === locale ? ' selected' : ''}>${label}</option>`).join('');
  const alternateLinks = locales.map(([code]) => `<link rel="alternate" hreflang="${code}" href="${baseURL}${code}/">`).join('\n');
  return `<!doctype html>
<html lang="${locale}">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark light"><meta name="theme-color" content="#23232a">
<title>VoiceDirector | ${escape(u.documentation)}</title><meta name="description" content="${escape(content.description)}">
<link rel="canonical" href="${baseURL}${locale}/">${alternateLinks}
<link rel="icon" type="image/svg+xml" href="../assets/voice-director.svg">
<link rel="stylesheet" href="../assets/site.css?v=${assetVersions['site.css']}"><script src="../assets/site.js?v=${assetVersions['site.js']}" defer></script>
<noscript><style>.search,.locale-picker,.icon-button,.print-button,.menu-toggle{display:none}@media(max-width:900px){.sidebar{position:static;transform:none;visibility:visible;width:auto;height:auto;box-shadow:none;border-right:0;border-bottom:1px solid var(--border)}}</style></noscript>
</head>
<body data-no-results="${escape(u.noResults)}" data-search-label="${escape(u.searchResults)}">
<a class="skip-link" href="#content">${escape(u.skip)}</a>
<header class="site-header"><a class="brand" href="#top"><img src="../assets/voice-director.svg" width="36" height="36" alt=""><span>Voice<span class="brand-light">Director</span></span></a><span class="header-divider"></span><span class="header-label">${escape(u.documentation)}</span><div class="header-actions"><span class="version">1.0.0</span><label class="locale-picker"><span class="sr-only">${escape(u.language)}</span><select id="locale">${options}</select></label><button type="button" class="icon-button" id="theme-toggle" aria-label="${escape(u.theme)}" title="${escape(u.theme)}"><span aria-hidden="true">◐</span></button><button type="button" class="print-button" id="print">${escape(u.print)}</button><button type="button" class="menu-toggle" id="menu-toggle" aria-controls="sidebar" aria-expanded="false">${escape(u.menu)}</button></div></header>
<div class="layout"><aside class="sidebar" id="sidebar"><form class="search" role="search"><label for="search">${escape(u.search)}</label><div class="search-field"><span aria-hidden="true">⌕</span><input id="search" type="search" placeholder="${escape(u.searchPlaceholder)}" autocomplete="off"><kbd aria-hidden="true">/</kbd></div><div id="search-results" class="search-results" hidden></div><p class="sr-only" id="search-status" role="status" aria-live="polite"></p></form><nav aria-label="${escape(u.contents)}">${nav(content)}</nav><div class="sidebar-footer"><span class="status-dot" aria-hidden="true"></span>UE 5.5-5.8 · Windows x64</div></aside>
<main id="content" tabindex="-1"><div id="top" class="hero"><div class="eyebrow">${escape(u.guideLabel)}</div><h1>${escape(content.title)}</h1><p class="hero-description">${escape(content.description)}</p><div class="hero-meta"><span class="pill purple">VoiceDirector 1.0.0</span><span class="pill">UE 5.5-5.8</span><span class="pill">Windows x64</span></div><div class="workflow" aria-label="${escape(u.workflow)}">${u.steps.map((step, index) => `<div><span>${index + 1}</span>${escape(step)}</div>`).join('')}</div><a class="button primary hero-cta" href="#first-take">${escape(u.firstLesson)} <span aria-hidden="true">↗</span></a><p class="ui-note">${escape(u.uiNote)}</p></div>${body}<footer class="page-footer"><a href="#top">${escape(u.backTop)} ↑</a><span>© NexusForgeUE · VoiceDirector</span><a href="https://github.com/NexusForgeUE/VoiceDirector-docs">GitHub</a></footer></main></div>
<dialog id="image-dialog" aria-labelledby="image-title"><div class="dialog-toolbar"><span id="image-title"></span><div><button type="button" id="image-size" aria-pressed="false">${escape(u.originalSize)}</button><button type="button" id="image-close" aria-label="${escape(u.close)}">${escape(u.close)} <span aria-hidden="true">×</span></button></div></div><div class="image-scroll"><img id="dialog-image" alt=""></div></dialog>
<noscript><div class="no-script">${escape(u.noScript)} <span>${locales.map(([code, label]) => `<a href="../${code}/">${label}</a>`).join(' · ')}</span></div></noscript>
</body></html>\n`;
}

export async function build() {
  for (const name of ['site.css', 'site.js', 'locale.js']) {
    assetVersions[name] = createHash('sha256').update(await readFile(resolve(root, 'assets', name))).digest('hex').slice(0, 12);
  }
  for (const name of ['lines', 'voices', 'jobs', 'publish', 'settings']) {
    const buffer = await readFile(resolve(root, 'assets/screenshots', `${name}.png`));
    screenshotSizes[name] = [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
  }
  for (const [locale] of locales) {
    const { default: content } = await import(pathToFileURL(resolve(root, 'content', `${locale}.mjs`)));
    const html = render(content, locale);
    if (/[\u2013\u2014]/u.test(html)) throw new Error(`Long dash in ${locale}`);
    if (/\{\{/.test(html)) throw new Error(`Unrendered placeholder in ${locale}`);
    await mkdir(resolve(root, locale), { recursive: true });
    await writeFile(resolve(root, locale, 'index.html'), html);
    console.log(`${locale}: ${content.sections.length} sections, ${html.length} characters`);
  }
  await writeFile(resolve(root, 'index.html'), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="description" content="VoiceDirector documentation in nine languages. Unreal Engine 5.5-5.8."><title>VoiceDirector Documentation</title><link rel="icon" href="assets/voice-director.svg"><link rel="stylesheet" href="assets/site.css?v=${assetVersions['site.css']}"></head><body><main class="language-home"><img src="assets/voice-director.svg" width="64" height="64" alt=""><h1>VoiceDirector</h1><p>Documentation · UE 5.5-5.8 · Windows x64</p><nav aria-label="Language">${locales.map(([code, label]) => `<a class="button" lang="${code}" href="${code}/">${label}</a>`).join('')}</nav></main><script src="assets/locale.js?v=${assetVersions['locale.js']}"></script></body></html>\n`);
  await writeFile(resolve(root, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locales.map(([locale]) => `<url><loc>${baseURL}${locale}/</loc></url>`).join('')}</urlset>\n`);
  await writeFile(resolve(root, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${baseURL}sitemap.xml\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await build();
