import { describe, it, expect } from 'vitest';
import { detectPatterns } from '../src/detect/patterns.js';

function cnpWithControl(first12) {
  const w = '279146358279';
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(first12[i]) * Number(w[i]);
  const r = sum % 11;
  return first12 + (r === 10 ? 1 : r);
}

const has = (text, category, value) =>
  expect(detectPatterns(text).some((s) => s.category === category && s.text === value)).toBe(true);

describe('detectPatterns', () => {
  it('CNP valid, nu și unul cu cifra de control greșită', () => {
    const cnp = cnpWithControl('196052312345');
    has(`CNP ${cnp}.`, 'CNP', cnp);
    const wrong = cnp.slice(0, 12) + ((Number(cnp[12]) + 1) % 10);
    expect(detectPatterns(`CNP ${wrong}`).some((s) => s.category === 'CNP')).toBe(false);
  });
  it('telefoane', () => {
    has('Sună-mă la 0722 123 456.', 'TELEFON', '0722 123 456');
    has('sau +40 722.123.456', 'TELEFON', '+40 722.123.456');
    has('fix 021 312 45 67', 'TELEFON', '021 312 45 67');
    has('în Franța +33 6 12 34 56 78', 'TELEFON', '+33 6 12 34 56 78');
  });
  it('email', () => has('scrie la maria.p@exemplu.ro', 'EMAIL', 'maria.p@exemplu.ro'));
  it('IBAN', () => has('IBAN RO49 AAAA 1B31 0075 9384 0000', 'IBAN', 'RO49 AAAA 1B31 0075 9384 0000'));
  it('card', () => has('card 4111 1111 1111 1111', 'CARD', '4111 1111 1111 1111'));
  it('act de identitate', () => {
    has('CI seria RX nr. 123456', 'ACT_IDENTITATE', 'RX nr. 123456');
    has('pașaport 051234567', 'ACT_IDENTITATE', '051234567');
  });
  it('data nașterii', () => {
    has('născută pe 12.03.1985 la', 'DATA_NASTERII', '12.03.1985');
    has('data nașterii: 3 martie 1985', 'DATA_NASTERII', '3 martie 1985');
  });
  it('adresă', () => has('locuiește pe str. Florilor nr. 12, bl. A3, ap. 45.', 'ADRESA', 'str. Florilor nr. 12, bl. A3, ap. 45'));
  it('număr auto', () => {
    has('mașina CJ 12 ABC', 'NR_AUTO', 'CJ 12 ABC');
    has('și B 123 XYZ', 'NR_AUTO', 'B 123 XYZ');
  });
  it('IP', () => has('IP 192.168.1.20', 'IP', '192.168.1.20'));
  it('firmă', () => has('lucrează la Delta Consult SRL de doi ani', 'FIRMA', 'Delta Consult SRL'));
  it('nu prinde text obișnuit', () => {
    expect(detectPatterns('am 3 copii și 2 câini, sa vedem')).toEqual([]);
    expect(detectPatterns('ședința din 12.03.2024')).toEqual([]);
    expect(detectPatterns('Am citit 2 cărți în 2024, pe 15 mai.')).toEqual([]);
  });
});
