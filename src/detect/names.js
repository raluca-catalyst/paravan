// Detectează nume de persoane: liste, genitiv, indicii de politețe și plasa de siguranță
// pentru cuvintele cu literă mare care nu sunt cuvinte obișnuite (decizia Ralucăi, 1 nov 2026).
import { fold } from './normalize.js';
import { tokenize } from './tokens.js';
import {
  FIRST_FEMALE, FIRST_MALE, SURNAMES, DIMINUTIVES, COMMON_WORDS, NAME_COMMON_WORDS, ROLE_LABELS, ALLOWLIST,
} from './data/index.js';

const CLITICS = new Set(['i', 'l', 'o', 'le', 'mi', 'm', 'ti', 'ne', 'va', 'v', 'si', 's', 'n', 'au', 'a', 'ai', 'am', 'ati', 'ar', 'as', 'or', 'ul', 'lui', 'ei', 'urile']);
const HINTS = new Set(['dl', 'dna', 'd-l', 'd-na', 'domnul', 'doamna', 'domnului', 'doamnei', 'dr', 'dra', 'd-ra', 'domnisoara']);
const GENITIVE = [['iei', 'ia'], ['căi', 'ca'], ['găi', 'ga'], ['ei', 'a']];

const isListed = (f) => {
  const one = (p) => FIRST_FEMALE.has(p) || FIRST_MALE.has(p) || SURNAMES.has(p) || DIMINUTIVES.has(p);
  return one(f) || (f.includes('-') && f.split('-').every(one));
};

function isCommon(f) {
  if (COMMON_WORDS.has(f) || NAME_COMMON_WORDS.has(f)) return true;
  const parts = f.split(/[-'’]/);
  if (parts.length < 2) return false;
  const [first, ...rest] = parts;
  return (COMMON_WORDS.has(first) || CLITICS.has(first)) && rest.every((p) => CLITICS.has(p));
}

function genitiveBase(word) {
  const lower = word.toLowerCase();
  for (const [suf, rep] of GENITIVE) {
    if (lower.endsWith(suf) && lower.length > suf.length + 1) {
      const stem = word.slice(0, word.length - suf.length);
      const isUpper = word === word.toUpperCase();
      const base = stem + (isUpper ? rep.toUpperCase() : rep);
      if (FIRST_FEMALE.has(fold(base))) return base;
    }
  }
  return null;
}

function classify(tok, next, prev) {
  if (!tok.capitalized) return null;
  const f = fold(tok.text);
  if (ALLOWLIST.has(f) || ROLE_LABELS.has(f)) return null;
  const allCaps = tok.text === tok.text.toUpperCase();
  const listed = isListed(f);
  const common = isCommon(f);

  if (prev && HINTS.has(fold(prev.text)) && /^\.?\s+$/.test(tok.gap)) return { kind: 'hint' };
  if (allCaps && !listed && tok.text.length <= 5) return null; // acronime
  // Genitivul unui prenume feminin („Mariei”, „Elenei”) se ascunde mereu: lista de nume de familie
  // conține și forme de genitiv, iar dicționarul poate accepta forma ca pe un cuvânt.
  const base = FIRST_FEMALE.has(f) || FIRST_MALE.has(f) ? null : genitiveBase(tok.text);
  if (base) return { kind: 'genitive', base };
  if (listed) {
    if (!common) return { kind: 'listed' };
    if (!tok.sentenceStart) return { kind: 'listed' };
    const nextIsName = next && next.capitalized && /^[ \t]+$/.test(next.gap) && isListed(fold(next.text));
    return nextIsName ? { kind: 'listed' } : null;
  }
  if (!common) return { kind: 'fallback' };
  return null;
}

export function detectNames(text) {
  const toks = tokenize(text);
  const hits = toks.map((t, i) => classify(t, toks[i + 1], toks[i - 1]));

  // După un indiciu („dna.”), și următoarele cuvinte cu literă mare lipite fac parte din nume.
  for (let i = 1; i < toks.length; i++) {
    if (!hits[i] && hits[i - 1] && hits[i - 1].kind === 'hint' && toks[i].capitalized && /^[ \t]+$/.test(toks[i].gap)) {
      hits[i] = { kind: 'hint' };
    }
  }

  const spans = [];
  for (let i = 0; i < toks.length; i++) {
    if (!hits[i]) continue;
    let j = i;
    while (j + 1 < toks.length && hits[j + 1] && /^(?:[ \t]|-)$/.test(toks[j + 1].gap)) j++;
    const group = toks.slice(i, j + 1);
    const start = group[0].start;
    const end = group[group.length - 1].end;
    const genitive = hits[j].kind === 'genitive';
    const span = { start, end, category: 'PERSOANA', text: text.slice(start, end) };
    span.fallback = group.every((_, k) => hits[i + k].kind === 'fallback');
    if (genitive) {
      span.genitive = true;
      span.base = text.slice(start, group[group.length - 1].start) + hits[j].base;
    } else {
      span.base = span.text;
    }
    spans.push(span);
    i = j;
  }
  return spans;
}
