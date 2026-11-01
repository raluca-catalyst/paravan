// Antetul unei coloane de tabel spune ce fel de date stau sub el („Nume”, „Telefon”, „Data nașterii”).
// Când antetul se potrivește, toată coloana se ascunde, chiar dacă regulile n-ar recunoaște valorile.
import { fold } from '../detect/normalize.js';

const RULES = [
  ['DATA_NASTERII', /\bnaster|\bnascut|\bbirth/],
  ['CNP', /\bcnp\b/],
  ['IBAN', /\biban\b|\bcont bancar/],
  ['EMAIL', /\be-?mail\b|\bmail\b/],
  ['TELEFON', /\btelefon|\btel\b|\bmobil|\bphone/],
  ['ADRESA', /\badres|\bdomicil|\bstrada\b|\baddress/],
  ['LOCALITATE', /\blocalitat|\boras\b|\bcity\b/],
  ['PERSOANA', /\bnume\b|\bprenume|\bnumele\b|\bpersoan|\bclient|\bangajat|\bparticipant|\bcandidat|\bbeneficiar|\bcontact\b|\btitular|\bpacient|\belev|\bstudent|\bparinte|\btutore|\bresponsabil|\bname\b/],
];

export function headerCategory(text) {
  const f = fold(String(text || '')).trim();
  if (!f || f.length > 40) return null;
  for (const [category, re] of RULES) if (re.test(f)) return category;
  return null;
}
