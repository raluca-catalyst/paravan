// Detectori pe tipare fixe: coduri, contacte, adrese, firme.
// Întorc Span-uri { start, end, category, text } (end exclusiv); suprapunerile se rezolvă în detect().

const COUNTIES = 'AB AG AR BC BH BN BR BT BV BZ CJ CL CS CT CV DB DJ GJ GL GR HD HR IF IL IS MH MM MS NT OT PH SB SJ SM SV TL TM TR VL VN VS'.split(' ');
const MONTHS = 'ianuarie|februarie|martie|aprilie|mai|iunie|iulie|august|septembrie|octombrie|noiembrie|decembrie';
const DATE = `\\d{1,2}[./-]\\d{1,2}[./-]\\d{4}|\\d{1,2}\\s+(?:${MONTHS})\\s+\\d{4}`;

function span(text, start, end, category) {
  return { start, end, category, text: text.slice(start, end) };
}

function all(re, text, fn) {
  const out = [];
  for (const m of text.matchAll(re)) {
    const s = fn(m);
    if (s) out.push(s);
  }
  return out;
}

export function isValidCNP(d) {
  if (!/^[1-8]\d{12}$/.test(d)) return false;
  const w = '279146358279';
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += Number(d[i]) * Number(w[i]);
  const r = sum % 11;
  return Number(d[12]) === (r === 10 ? 1 : r);
}

function luhn(d) {
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = Number(d[d.length - 1 - i]);
    if (i % 2 === 1) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}

function ibanOk(raw) {
  const s = raw.replace(/\s/g, '');
  if (s.length < 15 || s.length > 34) return false;
  const moved = s.slice(4) + s.slice(0, 4);
  let rem = 0;
  for (const ch of moved) {
    const v = /\d/.test(ch) ? ch : String(ch.charCodeAt(0) - 55);
    for (const c of v) rem = (rem * 10 + Number(c)) % 97;
  }
  return rem === 1;
}

const detectors = [
  // CNP
  (t) => all(/(?<!\d)[1-8]\d{12}(?!\d)/g, t, (m) => (isValidCNP(m[0]) ? span(t, m.index, m.index + 13, 'CNP') : null)),

  // Card: 13-19 cifre, cu spații sau cratime, Luhn valid, nu CNP.
  (t) => all(/(?<![\d+])\d(?:[ -]?\d){12,18}(?!\d)/g, t, (m) => {
    const d = m[0].replace(/\D/g, '');
    return luhn(d) && !isValidCNP(d) ? span(t, m.index, m.index + m[0].length, 'CARD') : null;
  }),

  // IBAN: verificat mod 97, scurtat de la coadă dacă a prins un grup în plus.
  (t) => all(/(?<![\p{L}\d])[A-Z]{2}\d{2}(?: ?[A-Z\d]{4}){2,7}(?: ?[A-Z\d]{1,4})?(?![\p{L}\d])/gu, t, (m) => {
    let v = m[0];
    while (v.length >= 15) {
      if (ibanOk(v)) return span(t, m.index, m.index + v.length, 'IBAN');
      const cut = v.lastIndexOf(' ');
      if (cut < 0) break;
      v = v.slice(0, cut);
    }
    return null;
  }),

  // Email
  (t) => all(/[\p{L}\d._%+-]+@[\p{L}\d-]+(?:\.[\p{L}\d-]+)*\.\p{L}{2,}/gu, t, (m) => span(t, m.index, m.index + m[0].length, 'EMAIL')),

  // Telefon: mobil RO, fix RO, internațional.
  (t) => [
    /(?<![\d+])(?:\+40|0040|0)[ .-]?7\d{2}(?:[ .-]?\d{3}){2}(?!\d)/g,
    /(?<![\d+])(?:\+40|0040|0)[ .-]?[23]\d(?:[ .-]?\d){7}(?!\d)/g,
    /(?<![\d+])\+(?!40)\d{1,3}(?:[ .-]?\d){7,12}(?!\d)/g,
  ].flatMap((re) => all(re, t, (m) => span(t, m.index, m.index + m[0].length, 'TELEFON'))),

  // Act de identitate: serie + număr după cuvinte-cheie; pașaport.
  (t) => all(/(?:[Ss]eria|[Ss]erie|CI|C\.I\.|[Bb]uletin(?:ul)?|[Cc]arte(?:a)? de identitate)(?![\p{L}])[^\n]{0,20}?(?<![\p{L}])([A-Z]{2}\s*(?:nr\.?|num[ăa]r(?:ul)?)?\s*\d{6})(?!\d)/dgu, t,
    (m) => span(t, m.indices[1][0], m.indices[1][1], 'ACT_IDENTITATE')),
  (t) => all(/[Pp]a[șsş]aport(?:ul)?[^\d\n]{0,15}(\d{9})(?!\d)/dgu, t, (m) => span(t, m.indices[1][0], m.indices[1][1], 'ACT_IDENTITATE')),

  // Data nașterii: o dată la cel mult 25 de caractere după cuvântul-cheie.
  (t) => all(new RegExp(`(?:n[ăa]scut[ăa]?|data na[șsş]terii|(?<![\\p{L}])n\\.)[^\\n]{0,25}?(${DATE})`, 'dgiu'), t,
    (m) => span(t, m.indices[1][0], m.indices[1][1], 'DATA_NASTERII')),

  // Adresă: cuvânt de stradă + nume + componente (nr., bl., sc., et., ap.).
  // Fără flag-ul i: altfel \p{Lu} ar prinde și litere mici.
  (t) => all(/(?<![\p{L}])(?:[Ss]tr\.|[Ss]trada|[Bb]d\.|[Bb]-dul|[Bb]ulevardul|[Cc]alea|[ȘSşs]os\.|[ȘSşs]oseaua|[Aa]leea|[Pp]ia[țtţ]a|[Ii]ntrarea)\s+[\p{Lu}\d][\p{L}\d-]*(?:\s+[\p{Lu}\d][\p{L}\d-]*){0,4}(?:,?\s*(?:[Nn]r|[Bb]l|[Ss]c|[Ee]t|[Aa]p|[Nn]um[ăa]r(?:ul)?)\.?\s*[\p{L}\d-]+)*/gu, t,
    (m) => span(t, m.index, m.index + m[0].length, 'ADRESA')),
  (t) => all(/(?<![\p{L}])[Nn]r\.?\s*\d+\p{L}?(?:,?\s*(?:[Bb]l|[Ss]c|[Ee]t|[Aa]p)\.?\s*[\p{L}\d-]+)+/gu, t,
    (m) => span(t, m.index, m.index + m[0].length, 'ADRESA')),

  // Număr de înmatriculare
  (t) => all(new RegExp(`(?<![\\p{L}\\d])(?:B\\s?\\d{2,3}|(?:${COUNTIES.join('|')})\\s?\\d{2})\\s?[A-Z]{3}(?![\\p{L}\\d])`, 'gu'), t,
    (m) => span(t, m.index, m.index + m[0].length, 'NR_AUTO')),

  // IP
  (t) => all(/(?<![\d.])(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)(?!\d|\.\d)/g, t,
    (m) => span(t, m.index, m.index + m[0].length, 'IP')),
  (t) => all(/(?<![\p{L}\d:])(?:[0-9a-fA-F]{0,4}:){3,7}[0-9a-fA-F]{1,4}(?![\p{L}\d:])/gu, t,
    (m) => span(t, m.index, m.index + m[0].length, 'IP')),

  // Firmă: 1-5 cuvinte cu literă mare + formă juridică (sensibil la majuscule).
  (t) => all(/(?<![\p{L}\d])(?:[\p{Lu}\d&][\p{L}\d&'-]*\s+){1,5}(?:S\.R\.L\.|SRL-D|SRL|S\.A\.|SA|PFA|I\.I\.|II|Grup|Group)(?![\p{L}])/gu, t,
    (m) => span(t, m.index, m.index + m[0].length, 'FIRMA')),
];

export function detectPatterns(text) {
  return detectors.flatMap((d) => d(text));
}
