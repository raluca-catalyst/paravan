// Transformă exemplul .md în .docx, un paragraf pe rând nevid.
import { readFileSync, writeFileSync } from 'node:fs';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const src = new URL('../exemple/sesiune-coaching-fictiva.md', import.meta.url);
const out = new URL('../exemple/sesiune-coaching-fictiva.docx', import.meta.url);
const lines = readFileSync(src, 'utf8').split(/\r?\n/).filter((l) => l.trim() !== '');

const doc = new Document({
  creator: 'Paravan',
  sections: [{ children: lines.map((l) => new Paragraph({ children: [new TextRun(l)] })) }],
});
writeFileSync(out, await Packer.toBuffer(doc));
console.log('scris', out.pathname);
