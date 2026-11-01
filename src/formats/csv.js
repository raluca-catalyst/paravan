// .csv: un segment pe celulă; delimitatorul detectat se păstrează la scriere.
// Coloanele cu antet de date personale („Nume”, „Data nașterii”) se ascund întregi.
import Papa from 'papaparse';
import { decodeText } from './decode.js';
import { headerCategory } from './headers.js';

export function readCsv(bytes) {
  const text = decodeText(bytes);
  // Ghicirea delimitatorului se încurcă la rândul gol de la final, deci ghicim pe text fără el.
  const guess = Papa.parse(text.replace(/(\r?\n)+$/, ''), { delimitersToGuess: [',', ';', '\t', '|'], preview: 20 });
  const parsed = Papa.parse(text, { delimiter: guess.meta.delimiter, skipEmptyLines: false });
  const rows = parsed.data;
  const headers = (rows[0] || []).map(headerCategory);
  const cells = [];
  const segments = [];
  const whole = [];
  rows.forEach((row, r) => row.forEach((value, c) => {
    if (value === '') return;
    cells.push([r, c]);
    segments.push(value);
    whole.push(r > 0 ? headers[c] || null : null);
  }));
  return { segments, whole, meta: { rows, cells, delimiter: parsed.meta.delimiter, newline: parsed.meta.linebreak } };
}

export function writeCsv(meta, segments) {
  const rows = meta.rows.map((row) => row.slice());
  meta.cells.forEach(([r, c], i) => { rows[r][c] = segments[i]; });
  return new TextEncoder().encode(Papa.unparse(rows, { delimiter: meta.delimiter, newline: meta.newline }));
}
