// Etichetele [CATEGORIE_N] (și variantele de formă [CATEGORIE_N_B]) și recunoașterea variantelor
// pe care le produc AI-urile: litere mici, diacritice adăugate („PERSOANĂ”), spațiu sau cratimă în loc de _,
// escape Markdown, varianta lipită („_1B”), fără paranteze.
import { fold } from '../detect/normalize.js';

export const CATEGORIES = ['PERSOANA', 'CNP', 'TELEFON', 'EMAIL', 'IBAN', 'CARD', 'ACT_IDENTITATE', 'DATA_NASTERII', 'ADRESA', 'LOCALITATE', 'NR_AUTO', 'IP', 'FIRMA'];

const CAT = CATEGORIES.map((c) => c.replace(/_/g, '\\\\?[_ -]')).join('|');
const SEP = '(?:\\\\?_|\\s|-)';
const SOURCE = `\\\\?\\[\\s*(${CAT})\\s*${SEP}\\s*(\\d+)(?:\\s*${SEP}?\\s*([A-Za-z]))?\\s*\\\\?\\]`
  + `|(?<![\\p{L}\\d_\\\\])(${CAT})\\\\?[_-](\\d+)(?:\\\\?_([A-Za-z]))?(?![\\p{L}\\d])`;
// Ce seamănă a etichetă, dar n-a fost recunoscut (de exemplu „PERSOANA_1ului”).
const LOOSE = `(?<![\\p{L}\\d])(?:${CAT})\\\\?[_-]\\d+[\\p{L}\\d_]*`;

export const tagRegex = () => new RegExp(SOURCE, 'giu');

export const tagOf = (category, n, variant = '') => `[${category}_${n}${variant ? '_' + variant : ''}]`;

// m: rezultatul unei potriviri cu tagRegex() (sau primele 7 argumente din replace).
export function parseTagMatch(m) {
  const bracket = m[1] !== undefined;
  const category = (bracket ? m[1] : m[4]).replace(/\\/g, '').replace(/[ -]/g, '_').toUpperCase();
  const n = Number(bracket ? m[2] : m[5]);
  const variant = ((bracket ? m[3] : m[6]) || '').toUpperCase();
  return { match: m[0], category, n, variant, index: m.index, tag: tagOf(category, n, variant) };
}

// Căutarea se face pe textul fără diacritice (aceeași lungime), ca „PERSOANĂ_1” să fie recunoscut;
// rezultatele trimit la pozițiile din textul original.
function searchable(text) {
  const f = fold(text);
  return f.length === text.length ? f : text;
}

export function findTags(text) {
  return [...searchable(text).matchAll(tagRegex())].map((m) => ({ ...parseTagMatch(m), match: text.slice(m.index, m.index + m[0].length) }));
}

export function findLeftovers(text) {
  return [...searchable(text).matchAll(new RegExp(LOOSE, 'giu'))].map((m) => text.slice(m.index, m.index + m[0].length));
}
