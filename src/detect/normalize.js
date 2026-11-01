// Normalizare pentru comparații: litere mici, sedila veche → virgulă, fără diacritice.
const CEDILLA = { 'ş': 'ș', 'ţ': 'ț', 'Ş': 'Ș', 'Ţ': 'Ț' };

export function fixCedilla(s) {
  return s.replace(/[şţŞŢ]/g, (c) => CEDILLA[c]);
}

export function fold(s) {
  return fixCedilla(s)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .normalize('NFC');
}
