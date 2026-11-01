// Detectează nume de persoane: liste, genitiv, titluri și etichete de câmp, etichete de vorbitor
// și plasa de siguranță pentru cuvintele cu literă mare care nu sunt cuvinte obișnuite (decizia Ralucăi, 1 nov 2026).
import { fold } from './normalize.js';
import { tokenize } from './tokens.js';
import {
  FIRST_FEMALE, FIRST_MALE, SURNAMES, DIMINUTIVES, COMMON_WORDS, NAME_COMMON_WORDS, NAME_COMMON_FREQUENT,
  ROLE_LABELS, ALLOWLIST, ACRONYMS, HINTS, FIELD_LABELS,
} from './data/index.js';

const CLITICS = new Set(['i', 'l', 'o', 'le', 'mi', 'm', 'ti', 'ne', 'va', 'v', 'si', 's', 'n', 'au', 'a', 'ai', 'am', 'ati', 'ar', 'as', 'or', 'ul', 'lui', 'ei', 'urile', 'ului', 'uri', 'ii', 'lor', 'ilor']);
const GENITIVE = [['eei', 'eea'], ['iei', 'ia'], ['căi', 'ca'], ['găi', 'ga'], ['ei', 'a']];
const SPEAKER_LABEL = /(^|\n)[ \t]*(\p{Lu}[\p{L}\p{M}'’-]*(?:[ \t]+\p{Lu}[\p{L}\p{M}'’-]*){0,2})[ \t]*:/gu;

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

const skipWord = (f) => ALLOWLIST.has(f) || ROLE_LABELS.has(f) || HINTS.has(f) || FIELD_LABELS.has(f);

function classify(tok, next, prev) {
  if (!tok.capitalized) return null;
  const f = fold(tok.text);
  if (skipWord(f)) return null;
  // Acronim sau cuvânt din lista de excepții cu terminație: „CV-ul”, „HR-ului”, „Excel-ul”.
  const parts = tok.text.split(/[-'’]/);
  if (parts.length > 1 && (skipWord(fold(parts[0])) || (parts[0] === parts[0].toUpperCase() && parts[0].length <= 3))
    && parts.slice(1).every((p) => CLITICS.has(fold(p)))) return null;
  const allCaps = tok.text === tok.text.toUpperCase();
  const listed = isListed(f);
  const common = isCommon(f);

  // După un titlu („Ing.”, „dna.”) sau o etichetă de câmp („Nume:”) urmează un nume.
  if (prev && HINTS.has(fold(prev.text)) && /^\.?\s+$/.test(tok.gap)) return { kind: 'hint' };
  if (prev && FIELD_LABELS.has(fold(prev.text)) && /^\s*:\s*$/.test(tok.gap)) return { kind: 'hint' };
  if (allCaps && !listed && (tok.text.length <= 3 || ACRONYMS.has(f))) return null; // acronime
  // Genitivul unui prenume feminin („Mariei”, „Andreei”) se ascunde mereu.
  const base = FIRST_FEMALE.has(f) || FIRST_MALE.has(f) ? null : genitiveBase(tok.text);
  if (base) return { kind: 'genitive', base };
  if (listed) {
    // Doar cuvintele foarte frecvente („Mare”, „Gata”, „Din”) sunt scutite la început de propoziție.
    if (!common || !NAME_COMMON_FREQUENT.has(f) || !tok.sentenceStart) return { kind: 'listed' };
    const nextIsName = next && next.capitalized && /^[ \t]+$/.test(next.gap) && isListed(fold(next.text));
    return nextIsName ? { kind: 'listed' } : null;
  }
  if (!common) return { kind: 'fallback' };
  return null;
}

// opts.cell: textul e o celulă de tabel.
export function detectNames(text, opts = {}) {
  const toks = tokenize(text, opts);
  const hits = toks.map((t, i) => classify(t, toks[i + 1], toks[i - 1]));

  // Eticheta de vorbitor („Popa:”, „Floare:”) e nume dacă unul dintre cuvinte e în listele de nume.
  for (const m of text.matchAll(SPEAKER_LABEL)) {
    const start = m.index + m[1].length + m[0].slice(m[1].length).indexOf(m[2]);
    const end = start + m[2].length;
    const inLabel = toks.map((t, i) => [t, i]).filter(([t]) => t.start >= start && t.end <= end);
    const anyListed = inLabel.some(([t]) => isListed(fold(t.text)) && !skipWord(fold(t.text)));
    if (anyListed) for (const [t, i] of inLabel) if (!skipWord(fold(t.text)) && !hits[i]) hits[i] = { kind: 'listed' };
  }

  // După un titlu sau o etichetă de câmp, și următoarele cuvinte cu literă mare lipite fac parte din nume.
  for (let i = 1; i < toks.length; i++) {
    if (!hits[i] && hits[i - 1] && hits[i - 1].kind === 'hint' && toks[i].capitalized && /^[ \t]+$/.test(toks[i].gap)
      && !skipWord(fold(toks[i].text))) {
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

export { skipWord };
