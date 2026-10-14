(() => {
  const supported = ['en', 'ru', 'de', 'fr', 'es', 'pt-BR', 'zh-Hans', 'ja', 'ko'];
  let saved;
  try { saved = localStorage.getItem('voicedirector-language'); } catch { /* Optional preference. */ }
  const languages = saved && supported.includes(saved) ? [saved] : (navigator.languages || [navigator.language]);
  let selected = 'en';
  for (const language of languages) {
    const candidate = language.toLowerCase();
    const match = supported.find(locale => locale.toLowerCase() === candidate)
      || (candidate.startsWith('pt') ? 'pt-BR' : candidate.startsWith('zh') ? 'zh-Hans' : supported.find(locale => locale === candidate.split('-')[0]));
    if (match) { selected = match; break; }
  }
  location.replace(`${selected}/${location.hash}`);
})();
