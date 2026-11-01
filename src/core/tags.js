// Etichetele [CATEGORIE_N] (și variantele de formă [CATEGORIE_N_B]) și recunoașterea
// variantelor pe care le produc AI-urile: litere mici, spațiu în loc de _, escape Markdown, fără paranteze.
export const CATEGORIES = ['PERSOANA', 'CNP', 'TELEFON', 'EMAIL', 'IBAN', 'CARD', 'ACT_IDENTITATE', 'DATA_NASTERII', 'ADRESA', 'LOCALITATE', 'NR_AUTO', 'IP', 'FIRMA'];

const CAT = CATEGORIES.map((c) => c.replace(/_/g, '\\\\?_')).join('|');
const SEP = '(?:\\\\?_|\\s)';
const SOURCE = `\\\\?\\[\\s*(${CAT})\\s*${SEP}\\s*(\\d+)(?:\\s*${SEP}\\s*([A-Za-z]))?\\s*\\\\?\\]`
  + `|(?<![\\p{L}\\d_\\\\])(${CAT})\\\\?_(\\d+)(?:\\\\?_([A-Za-z]))?(?![\\p{L}\\d])`;

export const tagRegex = () => new RegExp(SOURCE, 'giu');

export const tagOf = (category, n, variant = '') => `[${category}_${n}${variant ? '_' + variant : ''}]`;

// m: rezultatul unei potriviri cu tagRegex() (sau primele 7 argumente din replace).
export function parseTagMatch(m) {
  const bracket = m[1] !== undefined;
  const category = (bracket ? m[1] : m[4]).replace(/\\/g, '').toUpperCase();
  const n = Number(bracket ? m[2] : m[5]);
  const variant = ((bracket ? m[3] : m[6]) || '').toUpperCase();
  return { match: m[0], category, n, variant, index: m.index, tag: tagOf(category, n, variant) };
}

export function findTags(text) {
  return [...text.matchAll(tagRegex())].map(parseTagMatch);
}
