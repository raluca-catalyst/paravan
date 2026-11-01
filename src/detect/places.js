// Detectează localitățile din România (listă publică), inclusiv cele din mai multe cuvinte.
import { fold } from './normalize.js';
import { tokenize } from './tokens.js';
import { LOCALITIES, COMMON_WORDS } from './data/index.js';

// Index: primul cuvânt (fold) → localitățile care încep cu el, ca liste de cuvinte, cele lungi primele.
const INDEX = new Map();
for (const name of LOCALITIES) {
  const words = name.split(/\s+/).map(fold);
  if (!INDEX.has(words[0])) INDEX.set(words[0], []);
  INDEX.get(words[0]).push(words);
}
for (const list of INDEX.values()) list.sort((a, b) => b.length - a.length);

export function detectPlaces(text, opts = {}) {
  const toks = tokenize(text, opts);
  const spans = [];
  for (let i = 0; i < toks.length; i++) {
    const t = toks[i];
    if (!t.capitalized) continue;
    const candidates = INDEX.get(fold(t.text));
    if (!candidates) continue;
    for (const words of candidates) {
      if (i + words.length > toks.length) continue;
      let ok = true;
      for (let k = 1; k < words.length && ok; k++) {
        const n = toks[i + k];
        ok = /^[ \t]+$/.test(n.gap) && fold(n.text) === words[k];
      }
      if (!ok) continue;
      if (words.length === 1 && t.sentenceStart && COMMON_WORDS.has(words[0])) break;
      const end = toks[i + words.length - 1].end;
      spans.push({ start: t.start, end, category: 'LOCALITATE', text: text.slice(t.start, end) });
      i += words.length - 1;
      break;
    }
  }
  return spans;
}
