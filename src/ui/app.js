// Interfața Paravan: leagă cei trei pași de pseudonimizare, formate și restaurare.
import { readFile, readPasted, writeOutput } from '../formats/index.js';
import { pseudonymize } from '../core/pseudonymize.js';
import { restore } from '../core/restore.js';

const $ = (id) => document.getElementById(id);

const LABELS = {
  PERSOANA: ['nume', 'nume'], TELEFON: ['telefon', 'telefoane'], EMAIL: ['email', 'emailuri'], CNP: ['CNP', 'CNP-uri'],
  IBAN: ['IBAN', 'IBAN-uri'], CARD: ['card', 'carduri'], ACT_IDENTITATE: ['act de identitate', 'acte de identitate'],
  DATA_NASTERII: ['dată de naștere', 'date de naștere'], ADRESA: ['adresă', 'adrese'], LOCALITATE: ['localitate', 'localități'],
  NR_AUTO: ['număr auto', 'numere auto'], IP: ['IP', 'IP-uri'], FIRMA: ['firmă', 'firme'],
};
const PREVIEW_LIMIT = 30000;

const state = { doc: null, manual: [], result: null, key: null, restored: null };

function countLabel(category, n) {
  const [one, many] = LABELS[category] || [category, category];
  if (n === 1) return `1 ${one}`;
  const de = n % 100 === 0 || n % 100 >= 20 ? 'de ' : '';
  return `${n} ${de}${many}`;
}

function setMsg(id, text, isError = false) {
  const el = $(id);
  el.textContent = text;
  el.classList.toggle('err', isError);
}

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

function renderPreview(segments) {
  let text = segments.join('\n\n');
  let cut = false;
  if (text.length > PREVIEW_LIMIT) { text = text.slice(0, PREVIEW_LIMIT); cut = true; }
  $('preview').innerHTML = escapeHtml(text).replace(/\[[A-Z_]+_\d+(?:_[A-Z]+)?\]/g, (t) => `<span class="tag">${t}</span>`)
    + (cut ? '\n\n(previzualizare scurtată)' : '');
}

function download(bytes, filename, mime) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

async function busy(button, fn) {
  if (button.disabled) return;
  const label = button.textContent;
  button.disabled = true;
  button.textContent = 'Se lucrează…';
  await new Promise((r) => setTimeout(r, 20)); // lasă butonul să se redeseneze
  try { await fn(); } finally { button.disabled = false; button.textContent = label; }
}

async function docFrom(fileInput, textarea) {
  const file = fileInput.files[0];
  if (file) return readFile(file.name, new Uint8Array(await file.arrayBuffer()));
  if (textarea.value.trim()) return readPasted(textarea.value);
  return null;
}

function runPseudonymize() {
  const r = pseudonymize(state.doc.segments, { manual: state.manual, source: state.doc.name });
  state.result = r;
  state.key = r.key;
  $('chips').innerHTML = Object.entries(r.counts).map(([c, n]) => `<span class="chip">${countLabel(c, n)}</span>`).join('')
    || '<span class="chip">nicio dată personală găsită</span>';
  renderPreview(r.segments);
  $('result1').hidden = false;
  $('key-state').textContent = 'cheia de la pasul 1, din memorie';
  setMsg('msg1', r.alreadyTagged ? 'Fișierul pare deja pseudonimizat. Etichetele noi continuă numerotarea, ca să nu se încurce.' : '');
  $('step2').classList.add('active');
}

$('run1').addEventListener('click', () => busy($('run1'), async () => {
  try {
    const doc = await docFrom($('file1'), $('paste1'));
    if (!doc) { setMsg('msg1', 'Alege un fișier sau lipește un text.', true); return; }
    state.doc = doc;
    state.manual = [];
    runPseudonymize();
  } catch (e) {
    setMsg('msg1', e.message || 'Nu am putut citi fișierul.', true);
  }
}));

$('rerun').addEventListener('click', () => busy($('rerun'), async () => {
  const value = $('manual').value.trim();
  if (!value || !state.doc) return;
  state.manual.push({ value, category: 'PERSOANA' });
  $('manual').value = '';
  runPseudonymize();
}));

$('dl-anon').addEventListener('click', async () => {
  const out = await writeOutput(state.doc, state.result.segments, 'anon');
  download(out.bytes, out.filename, out.mime);
});

$('dl-key').addEventListener('click', () => {
  const name = state.doc.name.replace(/\.[^.]+$/, '') + '-cheie.json';
  download(new TextEncoder().encode(JSON.stringify(state.key, null, 2)), name, 'application/json');
});

$('copy-prompt').addEventListener('click', async () => {
  const text = $('prompt').textContent;
  try { await navigator.clipboard.writeText(text); } catch {
    const r = document.createRange(); r.selectNodeContents($('prompt'));
    const s = getSelection(); s.removeAllRanges(); s.addRange(r); document.execCommand('copy');
  }
  $('copy-prompt').textContent = 'Copiat';
  setTimeout(() => { $('copy-prompt').textContent = 'Copiază'; }, 1500);
});

$('key3').addEventListener('change', () => {
  const f = $('key3').files[0];
  $('key-state').textContent = f ? f.name : 'cheia de la pasul 1, din memorie';
});

$('run3').addEventListener('click', () => busy($('run3'), async () => {
  $('dl-restored').hidden = true;
  try {
    let key = state.key;
    const keyFile = $('key3').files[0];
    if (keyFile) key = JSON.parse(await keyFile.text());
    if (!key || !Array.isArray(key.entities)) { setMsg('msg3', 'Încarcă cheia de la pasul 1.', true); return; }
    const doc = await docFrom($('file3'), $('paste3'));
    if (!doc) { setMsg('msg3', 'Alege rezultatul de la AI sau lipește-l.', true); return; }
    const r = restore(doc.segments, key);
    if (r.replaced === 0) { setMsg('msg3', 'Cheia nu se potrivește cu acest fișier: nu am găsit nicio etichetă din cheie.', true); return; }
    state.restored = { doc, segments: r.segments, values: Object.fromEntries(key.entities.map((e) => [e.tag, e.value])) };
    $('dl-restored').hidden = false;
    $('step3').classList.add('active');
    const unknown = r.unknownTags.length ? ` Etichete care nu sunt în cheie, lăsate neatinse: ${r.unknownTags.join(', ')}.` : '';
    setMsg('msg3', `Am pus la loc ${r.replaced} ${r.replaced === 1 ? 'dată' : 'date'}.${unknown}`);
  } catch (e) {
    setMsg('msg3', e instanceof SyntaxError ? 'Fișierul cheii nu e valid.' : (e.message || 'Nu am putut citi fișierul.'), true);
  }
}));

$('dl-restored').addEventListener('click', async () => {
  const { doc, segments, values } = state.restored;
  const out = await writeOutput(doc, segments, 'restore', values);
  download(out.bytes, out.filename, out.mime);
  if (doc.meta.fallback) setMsg('msg3', 'Am salvat ca .md, ca să nu stric documentul Word.');
});

// Numele fișierului ales și tragerea fișierelor peste zonă.
for (const [input, label] of [['file1', 'file1-name'], ['file3', 'file3-name']]) {
  $(input).addEventListener('change', () => {
    const f = $(input).files[0];
    if (f) $(label).innerHTML = `<b>${escapeHtml(f.name)}</b> · ales`;
  });
  const zone = $(input).parentElement;
  zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('over'); });
  zone.addEventListener('dragleave', () => zone.classList.remove('over'));
  zone.addEventListener('drop', (e) => {
    e.preventDefault();
    zone.classList.remove('over');
    if (e.dataTransfer.files.length) { $(input).files = e.dataTransfer.files; $(input).dispatchEvent(new Event('change')); }
  });
}

// Tema
if (localStorage.getItem('paravan-tema') === 'luminos') document.body.classList.add('light');
$('theme').addEventListener('click', () => {
  const light = document.body.classList.toggle('light');
  localStorage.setItem('paravan-tema', light ? 'luminos' : 'intunecat');
});
