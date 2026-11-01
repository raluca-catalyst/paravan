// .xlsx: un segment pe celulă nevidă, din toate foile (inclusiv cele ascunse).
// La scriere: celulele schimbate devin text, celelalte își păstrează tipul, formulele rămân doar cu valoarea.
import * as XLSX from 'xlsx';

function cellText(cell) {
  // Numerele lungi (CNP, telefon) se citesc din valoare, nu din afișare, care poate fi „1.96E+12”.
  if (cell.t === 'n') return String(cell.v);
  return cell.w ?? String(cell.v ?? '');
}

export function readXlsx(bytes) {
  const wb = XLSX.read(bytes, { type: 'array' });
  const cells = [];
  const segments = [];
  for (const name of wb.SheetNames) {
    const sheet = wb.Sheets[name];
    for (const addr of Object.keys(sheet)) {
      if (addr.startsWith('!')) continue;
      const text = cellText(sheet[addr]);
      if (text.trim() === '') continue;
      cells.push([name, addr]);
      segments.push(text);
    }
  }
  return { segments, meta: { bytes, cells } };
}

export function writeXlsx(meta, segments) {
  const wb = XLSX.read(meta.bytes, { type: 'array' });
  delete wb.Props;
  delete wb.Custprops;
  meta.cells.forEach(([name, addr], i) => {
    const cell = wb.Sheets[name][addr];
    delete cell.f;
    if (cellText(cell) !== segments[i]) wb.Sheets[name][addr] = { t: 's', v: segments[i] };
  });
  return new Uint8Array(XLSX.write(wb, { type: 'array', bookType: 'xlsx' }));
}
