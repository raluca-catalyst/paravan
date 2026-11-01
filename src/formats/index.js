// Citirea și scrierea fișierelor. Doc = { kind, name, segments, meta }.
import { readText, writeText } from './text.js';
import { readCsv, writeCsv } from './csv.js';
import { readXlsx, writeXlsx } from './xlsx.js';
import { readDocx } from './docx.js';
import { readPdf } from './pdf.js';

const KINDS = ['md', 'txt', 'csv', 'xlsx', 'docx', 'pdf'];
const MIME = {
  md: 'text/markdown;charset=utf-8',
  txt: 'text/plain;charset=utf-8',
  csv: 'text/csv;charset=utf-8',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

const ext = (name) => (name.match(/\.([^.]+)$/)?.[1] || '').toLowerCase();
const stem = (name) => name.replace(/\.[^.]+$/, '');

export async function readFile(name, bytes) {
  const kind = ext(name);
  if (!KINDS.includes(kind)) throw new Error('Format nesuportat');
  let read;
  if (kind === 'md' || kind === 'txt') read = readText(bytes);
  else if (kind === 'csv') read = readCsv(bytes);
  else if (kind === 'xlsx') read = readXlsx(bytes);
  else if (kind === 'docx') read = await readDocx(bytes);
  else read = await readPdf(bytes);
  if (read.segments.join('').trim() === '') throw new Error('Fișierul e gol');
  return { kind, name, segments: read.segments, meta: read.meta };
}

export function readPasted(text) {
  return { kind: 'md', name: 'text-lipit.md', segments: [text], meta: {} };
}

export async function writeOutput(doc, segments, step) {
  const suffix = step === 'anon' ? '-pseudonimizat' : '-restaurat';
  let outExt = doc.kind;
  let bytes;
  if (doc.kind === 'md' || doc.kind === 'txt') bytes = writeText(segments);
  else if (doc.kind === 'csv') bytes = writeCsv(doc.meta, segments);
  else if (doc.kind === 'xlsx') bytes = writeXlsx(doc.meta, segments);
  else {
    outExt = 'md';
    bytes = new TextEncoder().encode(segments.join('\n\n'));
  }
  return { filename: stem(doc.name) + suffix + '.' + outExt, bytes, mime: MIME[outExt] };
}
