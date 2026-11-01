// Descarcă listele publice și scrie src/detect/data/*.json.
// Surse și licențe: DATA-LICENSES.md.
import { writeFileSync } from 'node:fs';
import nspell from 'nspell';
import roDictionary from 'dictionary-ro';
import { fold, fixCedilla } from '../src/detect/normalize.js';

const NAMES = 'https://raw.githubusercontent.com/andyhatestheworld/romanian-names-db/main/json/';
const LOCALITIES = 'https://raw.githubusercontent.com/romania/localitati/master/orase.csv';
const WORDS = 'https://raw.githubusercontent.com/hermitdave/FrequencyWords/master/content/2018/ro/ro_50k.txt';
const OUT = new URL('../src/detect/data/', import.meta.url);

// Prenume care sunt și cuvinte obișnuite în română.
const COMMON_FIRST_NAMES = ['floare', 'speranta', 'victoria', 'viorica', 'roza', 'ghiocel', 'bujor', 'dor', 'lacramioara', 'brindusa', 'zambila', 'margareta', 'pace'];
// Nume frecvente în subtitrări pentru că sunt nume de persoane, nu cuvinte românești: nu se tratează ca cuvinte.
const NOT_COMMON = new Set(['aaron', 'ali', 'bauer', 'bell', 'jan', 'jean', 'lois', 'lola', 'lucas', 'susan', 'silas', 'sisoe', 'dee', 'rosa', 'maxim', 'mira', 'costa', 'coste', 'cata', 'bob', 'duca', 'cica', 'angela', 'sorin', 'luminita', 'iris', 'crina', 'santa', 'paris']);

async function get(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${url}: ${r.status}`);
  return r.text();
}

const female = JSON.parse(await get(NAMES + 'prenume_femeie.json')).map(fold);
const male = JSON.parse(await get(NAMES + 'prenume_barbat.json')).map(fold);
const surnames = JSON.parse(await get(NAMES + 'nume_familie.json')).map(fold);

const csv = (await get(LOCALITIES)).split(/\r?\n/).slice(1);
const localities = [...new Set(csv.map((l) => l.split(',')[2]).filter(Boolean).map((n) => fixCedilla(n.trim())))]
  .sort((a, b) => b.length - a.length);

// Lista de frecvență vine din subtitrări și conține și nume străine (john, jack).
// Păstrăm doar cuvintele pe care dicționarul românesc hunspell le acceptă scrise cu literă mică.
const spell = nspell(roDictionary);
const wordLines = (await get(WORDS)).split(/\r?\n/);
const rank = new Map();
wordLines.forEach((l, i) => { const w = fold(l.split(' ')[0] || ''); if (w && !rank.has(w)) rank.set(w, i); });
// Numele-cuvinte foarte frecvente („din”, „mare”, „gata”) rămân scutite la început de propoziție.
const FREQUENT_RANK = 1000;
const commonAll = new Set(
  wordLines
    .map((l) => fixCedilla((l.split(' ')[0] || '').toLowerCase()))
    .filter((w) => /^\p{L}[\p{L}'-]*$/u.test(w) && spell.correct(w))
    .map(fold),
);

const firstNames = new Set([...female, ...male]);
const allNames = new Set([...firstNames, ...surnames]);
const nameCommon = new Set();
for (const s of surnames) {
  if (!firstNames.has(s) && !NOT_COMMON.has(s) && commonAll.has(s)) nameCommon.add(s);
}
for (const f of COMMON_FIRST_NAMES) if (allNames.has(f)) nameCommon.add(f);

const common = [...commonAll].filter((w) => !allNames.has(w) || nameCommon.has(w));

const write = (name, data) => writeFileSync(new URL(name, OUT), JSON.stringify(data));
write('first_female.json', [...new Set(female)].sort());
write('first_male.json', [...new Set(male)].sort());
write('surnames.json', [...new Set(surnames)].sort());
write('localities.json', localities);
write('common_words.json', common.sort());
write('name_common_words.json', [...nameCommon].sort());
write('name_common_frequent.json', [...nameCommon].filter((w) => (rank.get(w) ?? Infinity) < FREQUENT_RANK).sort());

console.log({ female: female.length, male: male.length, surnames: surnames.length, localities: localities.length, common: common.length, nameCommon: nameCommon.size });
console.log('nume care sunt și cuvinte:', [...nameCommon].sort().join(' '));
