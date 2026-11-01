// .csv: un segment pe celulă; delimitatorul detectat se păstrează la scriere.
import Papa from 'papaparse';

export function readCsv(bytes) {
  const text = new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');
  // Ghicirea delimitatorului se încurcă la rândul gol de la final, deci ghicim pe text fără el.
  const guess = Papa.parse(text.replace(/(\r?\n)+$/, ''), { delimitersToGuess: [',', ';', '\t', '|'], preview: 20 });
  const parsed = Papa.parse(text, { delimiter: guess.meta.delimiter, skipEmptyLines: false });
  const rows = parsed.data;
  const cells = [];
  const segments = [];
  rows.forEach((row, r) => row.forEach((value, c) => {
    if (value !== '') { cells.push([r, c]); segments.push(value); }
  }));
  return { segments, meta: { rows, cells, delimiter: parsed.meta.delimiter, newline: parsed.meta.linebreak } };
}

export function writeCsv(meta, segments) {
  const rows = meta.rows.map((row) => row.slice());
  meta.cells.forEach(([r, c], i) => { rows[r][c] = segments[i]; });
  return new TextEncoder().encode(Papa.unparse(rows, { delimiter: meta.delimiter, newline: meta.newline }));
}
