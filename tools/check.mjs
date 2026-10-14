import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { locales } from './build.mjs';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
const read = path => readFile(resolve(root, path), 'utf8');
check(await read('README.md') === 'Документация к проекту\n', 'README must contain only the requested sentence');
const requiredUI = ['documentation','guideLabel','language','theme','print','menu','contents','skip','search','searchPlaceholder','searchResults','noResults','groups','workflow','steps','firstLesson','uiNote','linkSection','zoom','originalSize','close','backTop','noScript','example','sampleTitle','sampleDescription','downloadCSV','downloadWAV','listenSample'];
let expectedSections;
let checkedLinks = 0;
for (const [locale] of locales) {
  const { default: content } = await import(pathToFileURL(resolve(root, 'content', `${locale}.mjs`)));
  for (const key of requiredUI) check(Boolean(content.ui[key]), `${locale}: missing UI ${key}`);
  check(content.ui.groups.length === 5 && content.ui.steps.length === 5, `${locale}: group/step parity`);
  const sectionIds = content.sections.map(section => section.id).join('|');
  expectedSections ??= sectionIds;
  check(sectionIds === expectedSections, `${locale}: section parity`);
  check(content.sections.every(section => section.title && /<(?:p|ol|div)\b/.test(section.body) && section.body.replace(/<[^>]*>/g, '').length >= 80), `${locale}: empty guide section`);
  const html = await read(`${locale}/index.html`);
  check(html.includes(`<html lang="${locale}">`), `${locale}: incorrect lang`);
  check(html.includes('UE 5.5-5.8'), `${locale}: missing versions`);
  check((html.match(/class="doc-section"/g) || []).length === 19, `${locale}: section count`);
  check((html.match(/class="screenshot"/g) || []).length === 5, `${locale}: five screenshots required`);
  check(!/[\u2013\u2014]/u.test(html), `${locale}: long dash`);
  check(!/class="(?:nav-number|section-index)"[^>]*>0\d/.test(html), `${locale}: leading zero in numbering`);
  check(!/\{\{|\b(?:P:|D:|C:)\//.test(html), `${locale}: placeholder or machine path`);
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  check(new Set(ids).size === ids.length, `${locale}: duplicate IDs`);
  for (const [, value] of html.matchAll(/\b(?:href|src|data-zoom)="([^"]+)"/g)) {
    if (/^(https?:|mailto:)/.test(value)) continue;
    checkedLinks++;
    const [file, fragment] = value.split('#');
    if (!file) { check(ids.includes(fragment), `${locale}: missing anchor ${fragment}`); continue; }
    const target = resolve(root, locale, decodeURIComponent(file));
    check(target.startsWith(root + '\\') || target.startsWith(root + '/'), `${locale}: escaping link ${value}`);
    try { const info = await stat(target); check(info.isFile() || (info.isDirectory() && Boolean(await stat(resolve(target, 'index.html')))), `${locale}: missing file ${value}`); }
    catch { failures.push(`${locale}: broken link ${value}`); }
  }
  for (const label of ['Generate new take', 'Generate selected', 'Choose Actor Manifest', 'Choose Returned WAV Folder', 'Restore From Publish Journal', 'Sources &amp; filters', 'Take review']) check(html.includes(label), `${locale}: missing real UI label ${label}`);
}
const csv = await readFile(resolve(root, 'assets/examples/first-line.csv'), 'utf8');
check(csv.replace(/^\uFEFF/u, '').trim() === 'LineId,CharacterId,Culture,Text,Context\r\nL-001,rowan,en,Keep your voice down.,At the city gate', 'Sample CSV mismatch');
const wav = await readFile(resolve(root, 'assets/examples/first-line.wav'));
check(wav.toString('ascii', 0, 4) === 'RIFF' && wav.toString('ascii', 8, 12) === 'WAVE', 'Sample is not RIFF WAV');
let pcm;
for (let offset = 12; offset + 8 <= wav.length;) {
  const kind = wav.toString('ascii', offset, offset + 4); const length = wav.readUInt32LE(offset + 4);
  if (kind === 'fmt ') pcm = { format: wav.readUInt16LE(offset + 8), channels: wav.readUInt16LE(offset + 10), rate: wav.readUInt32LE(offset + 12), bits: wav.readUInt16LE(offset + 22) };
  offset += 8 + length + (length % 2);
}
check(pcm?.format === 1 && pcm.bits === 16 && pcm.channels === 1 && pcm.rate === 24000, 'Sample WAV format mismatch');
async function scan(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.name.startsWith('.git') || entry.name === '.workspace') continue;
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await scan(path);
    else if (['.mjs','.js','.css','.html','.md','.txt','.xml','.svg'].includes(extname(path))) {
      const text = await readFile(path, 'utf8');
      check(!/[\u2013\u2014]/u.test(text), `Long dash: ${path}`);
      check(!/sk_[a-zA-Z0-9]{20,}/.test(text), `Possible secret: ${path}`);
    }
  }
}
await scan(root);
if (failures.length) { console.error(failures.join('\n')); process.exitCode = 1; }
else console.log(`PASS: ${locales.length} complete locales, 19 sections each, 5 screenshots each, ${checkedLinks} local links, exact README, sample PCM16 mono 24000 Hz, copy constraints.`);
