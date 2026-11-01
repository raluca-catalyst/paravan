// Cazuri pe care regulile NU au fost reglate. Nu se editează ca să treacă testul.
import { describe, it, expect } from 'vitest';
import { pseudonymize } from '../src/core/pseudonymize.js';
import { readFile } from '../src/formats/index.js';

const CASES = [
  ['Am vorbit ieri cu Zsófia despre program.', 'Zsófia'],
  ['Kovács a întârziat iar la ședință.', 'Kovács'],
  ['Colegul meu, Mehmet, pleacă în concediu.', 'Mehmet'],
  ['Ana-Maria Ionescu a confirmat participarea.', 'Ana-Maria'],
  ['Mesaj de la ANDREEA VLĂDESCU: vin mâine.', 'VLĂDESCU'],
  ['„Gata”, a zis Bogdan, „am terminat.”', 'Bogdan'],
  ['A sunat (Raluca) să întrebe de factură.', 'Raluca'],
  ['Laurențiu\na răspuns pe email.', 'Laurențiu'],
  ['Petrică și Petruța sunt frați.', 'Petruța'],
  ['I-am dat cheile lui Tudor Enache.', 'Enache'],
  ['Elenei nu i-a plăcut propunerea.', 'Elenei'],
  ['Discuția cu Dl. Ciobanu a mers bine.', 'Ciobanu'],
  ['Am primit mesaj de la Ştefania Şerban.', 'Şerban'],
  ['Maria Pop și Maria Rus au venit. Maria a plecat prima.', 'Maria'],
  ['Clienta, pe nume Xenia, a cerut amânare.', 'Xenia'],
  ['sora ei, Oltea, locuiește în Zalău.', 'Zalău'],
];

describe('cazuri grele', () => {
  for (const [sentence, secret] of CASES) {
    it(`ascunde „${secret}”`, () => {
      const out = pseudonymize([sentence]).segments[0];
      expect(out, out).not.toContain(secret);
    });
  }

  it('nume într-o celulă CSV', async () => {
    const doc = await readFile('c.csv', new TextEncoder().encode('id,persoana\n1,Grigore Untaru\n'));
    expect(pseudonymize(doc.segments).segments.join('|')).not.toContain('Untaru');
  });
});
