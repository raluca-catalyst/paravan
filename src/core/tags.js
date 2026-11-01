// Etichetele [CATEGORIE_N] și recunoașterea variantelor pe care le produc AI-urile.
export const CATEGORIES = ['PERSOANA', 'CNP', 'TELEFON', 'EMAIL', 'IBAN', 'CARD', 'ACT_IDENTITATE', 'DATA_NASTERII', 'ADRESA', 'LOCALITATE', 'NR_AUTO', 'IP', 'FIRMA'];

// Underscore-ul din categorie poate fi scăpat de Markdown („DATA\_NASTERII”).
const CAT = CATEGORIES.map((c) => c.replace(/_/g, '\\\\?_')).join('|');
const SOURCE = `\\\\?\\[\\s*(${CAT})\\s*(?:\\\\?_|\\s)\\s*(\\d+)\\s*\\\\?\\]|(?<![\\p{L}\\d_\\\\])(${CAT})\\\\?_(\\d+)(?![\\p{L}\\d])`;

export const tagRegex = () => new RegExp(SOURCE, 'giu');

export const tagOf = (category, n) => `[${category}_${n}]`;

export function parseTagMatch(m) {
  const category = (m[1] || m[3]).replace(/\\/g, '').toUpperCase();
  const n = Number(m[2] || m[4]);
  return { match: m[0], category, n, index: m.index, tag: tagOf(category, n) };
}

export function findTags(text) {
  return [...text.matchAll(tagRegex())].map(parseTagMatch);
}
