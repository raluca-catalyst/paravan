import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { readFile } from '../src/formats/index.js';
import { pseudonymize } from '../src/core/pseudonymize.js';
import { restore } from '../src/core/restore.js';

// Tot ce ar identifica persoanele din transcriptul de demo.
const SECRET = ['Ioana', 'Mărgineanu', 'Ioanei', 'Ioni', 'Sârbu', 'Vlad', 'Cosmina', 'Cosminei', 'Dragomir',
  '0745 318 902', 'cosmina.dragomir@exemplu-recrutare.ro', 'Brașov'];

for (const file of ['sesiune-coaching-fictiva.md', 'sesiune-coaching-fictiva.docx']) {
  describe(`acceptare: ${file}`, () => {
    it('nu rămâne nimic care identifică persoanele', async () => {
      const doc = await readFile(file, new Uint8Array(readFileSync(new URL(`../exemple/${file}`, import.meta.url))));
      const out = pseudonymize(doc.segments).segments.join('\n');
      for (const s of SECRET) expect(out.toLowerCase(), `a scăpat: ${s}`).not.toContain(s.toLowerCase());
    });

    it('restaurarea pune datele la loc; doar genitivele devin „lui …”', async () => {
      const doc = await readFile(file, new Uint8Array(readFileSync(new URL(`../exemple/${file}`, import.meta.url))));
      const p = pseudonymize(doc.segments);
      const back = restore(p.segments, p.key).segments;
      const norm = (s) => s.replace(/\blui \S+/g, 'X').replace(/\b(Ioanei|Cosminei)\b/g, 'X');
      expect(back.map(norm)).toEqual(doc.segments.map(norm));
    });
  });
}
