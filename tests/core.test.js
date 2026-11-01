import { describe, it, expect } from 'vitest';
import { pseudonymize } from '../src/core/pseudonymize.js';
import { restore } from '../src/core/restore.js';
import { findTags } from '../src/core/tags.js';
import { detect } from '../src/detect/index.js';

describe('detect', () => {
  it('localitatea bate plasa de siguranță pe același cuvânt', () => {
    expect(detect('Locuiesc în Sibiu de mult.').map((s) => s.category)).toEqual(['LOCALITATE']);
  });
  it('tiparul mai lung bate numele din interior', () => {
    expect(detect('Lucrez la Delta Consult SRL acum.').map((s) => s.category)).toEqual(['FIRMA']);
  });
});

describe('pseudonymize + restore', () => {
  const first = pseudonymize(['Maria Popescu: Am vorbit cu Ion. Maria e ok.', 'Am sunat-o pe sora Mariei la 0722 123 456']);

  it('etichete consecvente, genitivul devine „lui [TAG]”, forma completă are varianta ei', () => {
    expect(first.segments[0]).toBe('[PERSOANA_1_B]: Am vorbit cu [PERSOANA_2]. [PERSOANA_1] e ok.');
    expect(first.segments[1]).toBe('Am sunat-o pe sora lui [PERSOANA_1] la [TELEFON_1]');
    expect(first.counts).toEqual({ PERSOANA: 2, TELEFON: 1 });
    expect(first.key.entities.find((e) => e.tag === '[PERSOANA_1]').value).toBe('Maria');
  });

  it('două Marii: prenumele singur primește etichetă proprie', () => {
    expect(pseudonymize(['Maria Popescu și Maria Ionescu. Maria a plecat.']).segments[0])
      .toBe('[PERSOANA_1] și [PERSOANA_2]. [PERSOANA_3] a plecat.');
  });

  it('adăugare manuală', () => {
    const man = pseudonymize(['Am vorbit cu bunica veta.'], { manual: [{ value: 'veta', category: 'PERSOANA' }] });
    expect(man.segments[0]).toBe('Am vorbit cu bunica [PERSOANA_1].');
  });

  it('restaurare tolerantă la ce face AI-ul cu etichetele', () => {
    const r = restore(['Rezumat: [persoana_1] și \\[PERSOANA\\_2\\] vorbesc; PERSOANA_1 sună la [TELEFON 1]. [PERSOANA_9] lipsește.'], first.key);
    expect(r.segments[0]).toBe('Rezumat: Maria și Ion vorbesc; Maria sună la 0722 123 456. [PERSOANA_9] lipsește.');
    expect(r.unknownTags).toEqual(['[PERSOANA_9]']);
  });

  it('varianta de formă se restaurează exact, și tolerant', () => {
    expect(restore(['[PERSOANA_1_B] a semnat, [persoana_1_b] la fel.'], first.key).segments[0])
      .toBe('Maria Popescu a semnat, Maria Popescu la fel.');
  });

  it('cheie greșită: nimic restaurat', () => {
    expect(restore(['[EMAIL_1] scrie'], first.key).replaced).toBe(0);
  });

  it('fișier deja pseudonimizat: numerotarea nu se ciocnește', () => {
    const again = pseudonymize(['[PERSOANA_1] a vorbit cu Ion.']);
    expect(again.alreadyTagged).toBe(true);
    expect(again.segments[0]).toBe('[PERSOANA_1] a vorbit cu [PERSOANA_2].');
  });

  it('dus-întors fără AI lasă textul identic', () => {
    const src = ['Coach: Cum a fost cu Andrei Marin la Cluj-Napoca? Scrie-i la andrei@ex.ro.'];
    const p = pseudonymize(src);
    expect(p.segments[0]).not.toContain('Andrei');
    expect(restore(p.segments, p.key).segments).toEqual(src);
  });

  it('findTags găsește variantele', () => {
    expect(findTags('x [PERSOANA_1] y persoana 2 z \\[EMAIL\\_3\\] w PERSOANA_4_C').map((t) => t.tag))
      .toEqual(['[PERSOANA_1]', '[EMAIL_3]', '[PERSOANA_4_C]']);
  });

  it('text mare în sub 5 secunde', () => {
    const big = Array(5000).fill('Am vorbit cu Maria Popescu despre mutarea în Sibiu, apoi am sunat la 0722 123 456. ').join('');
    const t0 = performance.now();
    pseudonymize([big]);
    expect(performance.now() - t0).toBeLessThan(5000);
  });
});
