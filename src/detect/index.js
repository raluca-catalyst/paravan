// Strânge toate detecțiile și rezolvă suprapunerile: întâi ce a scris utilizatorul,
// apoi potrivirea mai lungă, apoi prioritatea categoriei.
import { fold } from './normalize.js';
import { detectPatterns } from './patterns.js';
import { detectNames } from './names.js';
import { detectPlaces } from './places.js';

const PRIORITY = ['CNP', 'CARD', 'IBAN', 'EMAIL', 'TELEFON', 'IP', 'ACT_IDENTITATE', 'NR_AUTO', 'DATA_NASTERII', 'ADRESA', 'FIRMA', 'PERSOANA', 'LOCALITATE'];

function rankOf(s) {
  // Un nume prins doar de plasa de siguranță cedează în fața unei localități de aceeași lungime.
  if (s.category === 'PERSOANA' && s.fallback) return PRIORITY.length;
  return PRIORITY.indexOf(s.category);
}

function manualSpans(text, manual) {
  const out = [];
  const folded = fold(text);
  const sameLength = folded.length === text.length;
  for (const { value, category } of manual) {
    const v = fold(value.trim());
    if (!v) continue;
    const hay = sameLength ? folded : text.toLowerCase();
    const needle = sameLength ? v : value.trim().toLowerCase();
    let from = 0;
    for (;;) {
      const i = hay.indexOf(needle, from);
      if (i < 0) break;
      const end = i + needle.length;
      const before = i === 0 ? '' : hay[i - 1];
      const after = end >= hay.length ? '' : hay[end];
      if (!/[\p{L}\d]/u.test(before) && !/[\p{L}\d]/u.test(after)) {
        out.push({ start: i, end, category, text: text.slice(i, end), base: text.slice(i, end), manual: true });
      }
      from = end;
    }
  }
  return out;
}

// opts.cell: textul e o celulă de tabel.
export function detect(text, manual = [], opts = {}) {
  const all = [...manualSpans(text, manual), ...detectPatterns(text), ...detectNames(text, opts), ...detectPlaces(text, opts)];
  all.sort((a, b) => (b.manual ? 1 : 0) - (a.manual ? 1 : 0)
    || (b.end - b.start) - (a.end - a.start)
    || rankOf(a) - rankOf(b));
  const taken = new Uint8Array(text.length);
  const chosen = [];
  for (const s of all) {
    let free = true;
    for (let i = s.start; i < s.end; i++) if (taken[i]) { free = false; break; }
    if (!free) continue;
    taken.fill(1, s.start, s.end);
    chosen.push(s);
  }
  return chosen.sort((a, b) => a.start - b.start);
}
