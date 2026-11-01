import { describe, it, expect } from 'vitest';
import { detectNames } from '../src/detect/names.js';
import { detectPlaces } from '../src/detect/places.js';
import { tokenize } from '../src/detect/tokens.js';

const names = (t) => detectNames(t).map((s) => s.text);

describe('tokenize', () => {
  it('știe ce cuvânt începe propoziția', () => {
    const toks = tokenize('Am vorbit cu Ana-Maria. Apoi - Ion: da');
    expect(toks.map((x) => x.text)).toEqual(['Am', 'vorbit', 'cu', 'Ana-Maria', 'Apoi', 'Ion', 'da']);
    // „- Ion” în mijlocul rândului nu începe propoziția; „da” vine după „:”.
    expect(toks.map((x) => x.sentenceStart)).toEqual([true, false, false, false, true, false, true]);
  });
});

describe('detectNames', () => {
  it('nume complet din listă', () => expect(names('Am vorbit cu Maria Popescu ieri.')).toEqual(['Maria Popescu']));
  it('nume străin în mijlocul propoziției', () => expect(names('Am vorbit cu Zsófia despre asta.')).toEqual(['Zsófia']));
  it('nume străin la început de propoziție', () => expect(names('Zsófia a zis că vine.')).toEqual(['Zsófia']));
  it('nu prinde cuvinte obișnuite la început de propoziție', () => expect(names('Săptămâna trecută a fost greu.')).toEqual([]));
  it('genitiv-dativ', () => {
    expect(names('I-am spus Mariei tot.')).toEqual(['Mariei']);
    expect(detectNames('I-am spus Mariei tot.')[0]).toMatchObject({ base: 'Maria', genitive: true });
  });
  it('genitiv la început de propoziție, chiar dacă seamănă cu un cuvânt', () => {
    expect(detectNames('Elenei nu i-a plăcut.')[0]).toMatchObject({ text: 'Elenei', base: 'Elena', genitive: true });
  });
  it('genitiv care apare și în lista de nume de familie', () => {
    expect(detectNames('Am vorbit despre părerea Ioanei.')[0]).toMatchObject({ base: 'Ioana', genitive: true });
  });
  it('diminutiv', () => expect(names('L-am sunat pe Ionuț.')).toEqual(['Ionuț']));
  it('variante de diacritice', () => expect(names('Stefan și Ştefan au venit.')).toEqual(['Stefan', 'Ştefan']));
  it('majuscule', () => expect(names('RAPORT: MARIA POPESCU, HR')).toEqual(['MARIA POPESCU']));
  it('etichete de vorbitor, fără roluri', () => expect(names('Coach: Cum te simți?\nMaria: Bine.')).toEqual(['Maria']));
  it('indicii de politețe', () => expect(names('Vorbesc cu dna. Zgârcea mâine.')).toEqual(['Zgârcea']));
  it('nume care sunt și cuvinte', () => expect(names('Floare la ureche, mi-a zis Floare Lupu.')).toEqual(['Floare Lupu']));
  it('excepțiile nu se ascund', () => expect(names('Folosesc ChatGPT și Excel zilnic.')).toEqual([]));
  it('verbe cu pronume legate', () => expect(names('Scrie-i mâine. Spune-mi ce a zis.')).toEqual([]));
});

describe('detectPlaces', () => {
  it('localități, inclusiv din două cuvinte', () => {
    expect(detectPlaces('Mă mut la Baia Mare din Sibiu.').map((s) => s.text)).toEqual(['Baia Mare', 'Sibiu']);
  });
});
