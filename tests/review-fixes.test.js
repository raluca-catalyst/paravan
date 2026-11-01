// Scăpările găsite la verificarea finală (1 nov 2026). Fiecare test a picat înainte de reparație.
import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { pseudonymize } from '../src/core/pseudonymize.js';
import { restore } from '../src/core/restore.js';
import { readFile, writeOutput } from '../src/formats/index.js';

const anon = (t) => pseudonymize([t]).segments[0];
const leaks = (text, secret) => expect(anon(text), anon(text)).not.toContain(secret);

describe('C1: un nume deja găsit se ascunde peste tot', () => {
  it('Floare, a doua oară, la început de propoziție', () => leaks('Am vorbit cu Floare. Floare a zis că nu vine.', 'Floare'));
  it('Negru după „Domnul”', () => leaks('Domnul Negru a sunat. Negru e supărat.', 'Negru'));
});

describe('C2: nume de familie care sunt și cuvinte', () => {
  it('Popa la început de propoziție', () => leaks('Popa mi-a spus că pleacă.', 'Popa'));
  it('Ciobanu la început de propoziție', () => leaks('Ciobanu a întârziat.', 'Ciobanu'));
  it('eticheta de vorbitor', () => { leaks('Popa: Bună ziua.', 'Popa'); leaks('Floare: Bună.', 'Floare'); });
  it('după două puncte', () => { leaks('Coach: Floare, ce mai faci?', 'Floare'); leaks('Maria: Negru m-a sunat', 'Negru'); });
  it('listă cu liniuțe', () => leaks('- Popa\n- Ionescu', 'Popa'));
  it('după titlu profesional', () => {
    const out = anon('Ing. Popa a semnat.');
    expect(out).not.toContain('Popa');
    expect(out).toContain('Ing.');
  });
  it('după eticheta de câmp', () => leaks('Nume: Negru Ion', 'Negru'));
  it('cuvintele foarte frecvente rămân la început de propoziție', () => {
    expect(anon('Mare păcat. Gata, am terminat. Din păcate nu vine.')).toBe('Mare păcat. Gata, am terminat. Din păcate nu vine.');
  });
  it('celule de tabel', async () => {
    const doc = await readFile('c.csv', new TextEncoder().encode('id;familie\n1;Negru\n2;Floare\n3;Popa\n'));
    const out = pseudonymize(doc.segments, { cells: true }).segments.join('|');
    for (const s of ['Negru', 'Floare', 'Popa']) expect(out).not.toContain(s);
  });
});

describe('C3: xlsx iese registru nou', () => {
  it('fără comentarii, linkuri și nume de foaie cu date personale', async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['Nume', 'Email'], ['Maria Popescu', 'scrie']]);
    ws.B2.l = { Target: 'mailto:maria.popescu@gmail.com' };
    ws.A1.c = [{ a: 'x', t: 'Lista de la Ion Ionescu, tel 0733111222' }];
    XLSX.utils.book_append_sheet(wb, ws, 'Maria Popescu');
    const doc = await readFile('t.xlsx', new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' })));
    const p = pseudonymize(doc.segments, { cells: true, whole: doc.whole });
    const out = await writeOutput(doc, p.segments, 'anon');
    const zip = await JSZip.loadAsync(out.bytes);
    const all = (await Promise.all(Object.values(zip.files).filter((f) => !f.dir).map((f) => f.async('string')))).join('\n');
    for (const s of ['Popescu', 'Ionescu', '0733111222', 'maria.popescu@gmail.com']) expect(all).not.toContain(s);
    // la restaurare, numele foii revine
    const back = await writeOutput(doc, restore(p.segments, p.key).segments, 'restore');
    expect(XLSX.read(back.bytes, { type: 'array' }).SheetNames).toEqual(['Maria Popescu']);
  });
  it('datele calendaristice neatinse rămân date', async () => {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['Ziua'], [new Date(Date.UTC(2026, 10, 12))]], { cellDates: true }), 'S');
    const doc = await readFile('d.xlsx', new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx', cellDates: true })));
    const out = await writeOutput(doc, doc.segments, 'anon');
    const cell = XLSX.read(out.bytes, { type: 'array', cellDates: true }).Sheets.S.A2;
    expect(cell.v instanceof Date).toBe(true);
  });
});

describe('Important', () => {
  it('I1: telefon salvat ca număr în Excel', async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([['Telefon'], [722123456]]);
    ws.A2.z = '0000000000';
    XLSX.utils.book_append_sheet(wb, ws, 'S');
    const doc = await readFile('t.xlsx', new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' })));
    const out = pseudonymize(doc.segments, { cells: true, whole: doc.whole }).segments.join('|');
    expect(out).not.toContain('722123456');
  });
  it('I2: coloana „Data nașterii” se ascunde toată', async () => {
    const doc = await readFile('c.csv', new TextEncoder().encode('Nume,Data nașterii\nIon Pop,12.03.1985\n'));
    const out = pseudonymize(doc.segments, { cells: true, whole: doc.whole }).segments;
    expect(out.join('|')).not.toContain('12.03.1985');
    expect(out).toContain('Data nașterii');
  });
  it('I3: CSV exportat de Excel în română (windows-1250)', async () => {
    const bytes = new Uint8Array([...'Nume\nM'].map((c) => c.charCodeAt(0)).concat([0xe3], [...'rginean '].map((c) => c.charCodeAt(0)), [0xaa], [...'tefan\n'].map((c) => c.charCodeAt(0))));
    const doc = await readFile('c.csv', bytes);
    expect(doc.segments).toContain('Mărginean Ştefan'); // sedila din fișier rămâne neschimbată
  });
  it('I4: text în forma Unicode descompusă (NFD)', async () => {
    const doc = await readFile('a.txt', new TextEncoder().encode('Am vorbit cu Ștefan Mărginean și cu Țuțu.'.normalize('NFD')));
    const out = pseudonymize(doc.segments).segments[0];
    expect(out).not.toContain('tefan');
    expect(out).not.toContain('rginean');
  });
  it('I5: nume scurte scrise cu majuscule', () => {
    leaks('JOHN SMITH a venit.', 'SMITH');
    leaks('Am vorbit cu NAGY.', 'NAGY');
    expect(anon('Am trimis CV-ul la HR și la ANAF.')).toBe('Am trimis CV-ul la HR și la ANAF.');
  });
  it('I8: etichete stricate de AI se restaurează sau se raportează', () => {
    const p = pseudonymize(['Maria Popescu și Maria Popescu, apoi Maria. Tel 0722 123 456.']);
    const r = restore(['[PERSOANĂ_1] și [PERSOANA_1B] și [TELEFON-1]. Apoi PERSOANA_1ului.'], p.key);
    expect(r.segments[0]).toContain('Maria Popescu și Maria și 0722 123 456');
    expect(r.leftovers).toEqual(['PERSOANA_1ului']);
  });
  it('I9: genitivul Andreei', () => {
    const p = pseudonymize(['Am vorbit cu Andreea Popescu. I-am dat Andreei cartea.']);
    expect(p.key.entities.map((e) => e.value)).not.toContain('Andrea');
  });
});
