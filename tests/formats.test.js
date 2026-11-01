import { describe, it, expect } from 'vitest';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { readFile, readPasted, writeOutput } from '../src/formats/index.js';

const enc = (s) => new TextEncoder().encode(s);
const dec = (b) => new TextDecoder().decode(b);
const swap = (segs) => segs.map((s) => s.replace('Maria Popescu', '[PERSOANA_1]').replace('0722 123 456', '[TELEFON_1]'));

async function makeDocx() {
  const zip = new JSZip();
  const p = (t) => `<w:p><w:r><w:t xml:space="preserve">${t}</w:t></w:r></w:p>`;
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>');
  zip.file('word/document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${p('Am vorbit cu Maria Popescu.')}${p('Tel: 0722 123 456 &amp; altele')}</w:body></w:document>`);
  zip.file('word/footnotes.xml', `<?xml version="1.0"?><w:footnotes xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:footnote>${p('Notă: Ion Vasile')}</w:footnote></w:footnotes>`);
  return zip.generateAsync({ type: 'uint8array' });
}

function makeXlsx() {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Nume', 'CNP'], ['Maria Popescu', 1960523123458], ['total', 3]]), 'Clienti');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['0722 123 456']]), 'Ascuns');
  wb.Workbook = { Sheets: [{ Hidden: 0 }, { Hidden: 1 }] };
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
}

async function makePdf(text) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage();
  if (text) page.drawText(text, { x: 50, y: 700, size: 12, font: await pdf.embedFont(StandardFonts.Helvetica) });
  return pdf.save();
}

describe('formate', () => {
  it('md: un segment, iese tot .md', async () => {
    const doc = await readFile('note.md', enc('Am vorbit cu Maria Popescu la 0722 123 456.'));
    expect(doc.kind).toBe('md');
    const out = await writeOutput(doc, swap(doc.segments), 'anon');
    expect(out.filename).toBe('note-pseudonimizat.md');
    expect(dec(out.bytes)).toBe('Am vorbit cu [PERSOANA_1] la [TELEFON_1].');
    expect((await writeOutput(doc, doc.segments, 'restore')).filename).toBe('note-restaurat.md');
  });

  it('txt', async () => {
    const doc = await readFile('a.txt', enc('Maria Popescu'));
    expect((await writeOutput(doc, swap(doc.segments), 'anon')).filename).toBe('a-pseudonimizat.txt');
  });

  it('csv cu ; păstrează delimitatorul', async () => {
    const doc = await readFile('c.csv', enc('Nume;Telefon\nMaria Popescu;0722 123 456\n'));
    expect(doc.segments).toContain('Maria Popescu');
    const text = dec((await writeOutput(doc, swap(doc.segments), 'anon')).bytes);
    expect(text.split(/\r?\n/)[1]).toBe('[PERSOANA_1];[TELEFON_1]');
  });

  it('xlsx: toate foile, inclusiv cea ascunsă, și CNP-ul numeric', async () => {
    const doc = await readFile('t.xlsx', makeXlsx());
    expect(doc.segments).toContain('1960523123458');
    expect(doc.segments).toContain('0722 123 456');
    const out = await writeOutput(doc, swap(doc.segments).map((s) => (s === '1960523123458' ? '[CNP_1]' : s)), 'anon');
    expect(out.filename).toBe('t-pseudonimizat.xlsx');
    const wb = XLSX.read(out.bytes, { type: 'array' });
    expect(wb.SheetNames).toEqual(['Clienti', 'Ascuns']);
    expect(wb.Sheets.Clienti.A2.v).toBe('[PERSOANA_1]');
    expect(wb.Sheets.Clienti.B2.v).toBe('[CNP_1]');
    expect(wb.Sheets.Clienti.B3.v).toBe(3);
    expect(wb.Sheets.Ascuns.A1.v).toBe('[TELEFON_1]');
  });

  it('docx: paragrafe + note de subsol, iese .md', async () => {
    const doc = await readFile('s.docx', await makeDocx());
    expect(doc.segments).toEqual(['Am vorbit cu Maria Popescu.', 'Tel: 0722 123 456 & altele', 'Notă: Ion Vasile']);
    const out = await writeOutput(doc, swap(doc.segments), 'anon');
    expect(out.filename).toBe('s-pseudonimizat.md');
    expect(dec(out.bytes)).toBe('Am vorbit cu [PERSOANA_1].\n\nTel: [TELEFON_1] & altele\n\nNotă: Ion Vasile');
  });

  it('pdf cu text, iese .md', async () => {
    const doc = await readFile('p.pdf', await makePdf('Am vorbit cu Maria Popescu.'));
    expect(doc.segments.join(' ')).toContain('Maria Popescu');
    expect((await writeOutput(doc, doc.segments, 'anon')).filename).toBe('p-pseudonimizat.md');
  });

  it('pdf fără text: mesaj clar', async () => {
    await expect(readFile('scan.pdf', await makePdf(''))).rejects.toThrow('PDF-ul nu are text de citit');
  });

  it('erori clare', async () => {
    await expect(readFile('a.pptx', enc('x'))).rejects.toThrow('Format nesuportat');
    await expect(readFile('gol.txt', enc('   '))).rejects.toThrow('Fișierul e gol');
  });

  it('text lipit', () => {
    expect(readPasted('salut')).toMatchObject({ kind: 'md', name: 'text-lipit.md', segments: ['salut'] });
  });
});

async function docxWith(bodyXml) {
  const zip = new JSZip();
  zip.file('[Content_Types].xml', '<?xml version="1.0"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="xml" ContentType="application/xml"/></Types>');
  zip.file('word/document.xml', `<?xml version="1.0"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>${bodyXml}</w:body></w:document>`);
  return zip.generateAsync({ type: 'uint8array' });
}

describe('docx la pasul 3', () => {
  it('eticheta într-un singur fragment: iese .docx cu valoarea pusă la loc', async () => {
    const doc = await readFile('rez.docx', await docxWith('<w:p><w:r><w:t>[PERSOANA_1] a decis &amp; gata.</w:t></w:r></w:p>'));
    const out = await writeOutput(doc, ['Maria & Co a decis & gata.'], 'restore', { '[PERSOANA_1]': 'Maria & Co' });
    expect(out.filename).toBe('rez-restaurat.docx');
    const xml = await (await JSZip.loadAsync(out.bytes)).file('word/document.xml').async('string');
    expect(xml).toContain('Maria &amp; Co a decis &amp; gata.');
  });

  it('eticheta ruptă în două fragmente: iese .md', async () => {
    const doc = await readFile('rez.docx', await docxWith('<w:p><w:r><w:t>[PERSOANA</w:t></w:r><w:r><w:t>_1] a decis.</w:t></w:r></w:p>'));
    const out = await writeOutput(doc, ['Maria a decis.'], 'restore', { '[PERSOANA_1]': 'Maria' });
    expect(out.filename).toBe('rez-restaurat.md');
    expect(doc.meta.fallback).toBe(true);
  });
});
