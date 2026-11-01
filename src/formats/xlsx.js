// .xlsx: un segment pe numele fiecărei foi și pe fiecare celulă nevidă, din toate foile (inclusiv cele ascunse).
// La scriere iese un registru NOU, construit doar din valori: fără comentarii, linkuri, nume definite sau metadate.
import * as XLSX from 'xlsx';
import { headerCategory } from './headers.js';

function cellText(cell) {
  if (cell.t === 'n') {
    // Telefonul salvat ca număr: formatul afișat („0722123456”) păstrează zeroul din față.
    const shown = (cell.w || '').replace(/\s/g, '');
    if (/^0\d+$/.test(shown) && Number(shown) === cell.v) return cell.w;
    if (/^7\d{8}$/.test(String(cell.v))) return '0' + cell.v;
    return String(cell.v);
  }
  if (cell.t === 'd') return cell.w ?? cell.v.toISOString().slice(0, 10);
  return cell.w ?? String(cell.v ?? '');
}

const read = (bytes) => XLSX.read(bytes, { type: 'array', cellNF: true, cellDates: true });

export function readXlsx(bytes) {
  const wb = read(bytes);
  const refs = [];
  const segments = [];
  const whole = [];
  for (const name of wb.SheetNames) {
    refs.push(['sheet', name]);
    segments.push(name);
    whole.push(null);
    const sheet = wb.Sheets[name];
    const headers = {};
    for (const addr of Object.keys(sheet)) {
      if (addr.startsWith('!')) continue;
      const { r, c } = XLSX.utils.decode_cell(addr);
      if (r === 0) headers[c] = headerCategory(cellText(sheet[addr]));
    }
    for (const addr of Object.keys(sheet)) {
      if (addr.startsWith('!')) continue;
      const text = cellText(sheet[addr]);
      if (text.trim() === '') continue;
      const { r, c } = XLSX.utils.decode_cell(addr);
      refs.push(['cell', name, addr]);
      segments.push(text);
      whole.push(r > 0 ? headers[c] || null : null);
    }
  }
  return { segments, whole, meta: { bytes, refs } };
}

// Numele de foaie: fără [ ] : * ? / \, cel mult 31 de caractere, unic.
function sheetName(text, used) {
  let n = text.replace(/[[\]:*?/\\]/g, '').trim().slice(0, 31) || 'Foaie';
  let k = 2;
  while (used.has(n.toLowerCase())) n = `${n.slice(0, 28)} ${k++}`;
  used.add(n.toLowerCase());
  return n;
}

export function writeXlsx(meta, segments) {
  const src = read(meta.bytes);
  const out = XLSX.utils.book_new();
  const used = new Set();
  const names = {};
  const cells = {};
  meta.refs.forEach((ref, i) => {
    if (ref[0] === 'sheet') names[ref[1]] = segments[i];
    else cells[ref[1] + '!' + ref[2]] = segments[i];
  });
  const hidden = [];
  src.SheetNames.forEach((name, idx) => {
    const ws = src.Sheets[name];
    const fresh = {};
    if (ws['!ref']) fresh['!ref'] = ws['!ref'];
    if (ws['!merges']) fresh['!merges'] = ws['!merges'];
    if (ws['!cols']) fresh['!cols'] = ws['!cols'].map((c) => (c ? { wch: c.wch, wpx: c.wpx, hidden: c.hidden } : c));
    for (const addr of Object.keys(ws)) {
      if (addr.startsWith('!')) continue;
      const cell = ws[addr];
      const seg = cells[name + '!' + addr];
      if (seg !== undefined && seg !== cellText(cell)) fresh[addr] = { t: 's', v: seg };
      else if (cell.t === 'd') fresh[addr] = { t: 'd', v: cell.v, z: cell.z || 'yyyy-mm-dd' };
      else fresh[addr] = { t: cell.t, v: cell.v, ...(cell.z ? { z: cell.z } : {}) };
    }
    XLSX.utils.book_append_sheet(out, fresh, sheetName(names[name] ?? name, used));
    hidden.push({ Hidden: src.Workbook?.Sheets?.[idx]?.Hidden || 0 });
  });
  out.Workbook = { Sheets: hidden };
  return new Uint8Array(XLSX.write(out, { type: 'array', bookType: 'xlsx', cellDates: true }));
}
