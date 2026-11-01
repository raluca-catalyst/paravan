// Împarte textul în cuvinte și marchează ce cuvânt începe o propoziție.
const WORD = /[\p{L}\p{M}]+(?:['’-][\p{L}\p{M}]+)*/gu;

// opts.cell: textul e o celulă de tabel, deci primul cuvânt nu e un început de propoziție.
export function tokenize(text, opts = {}) {
  const out = [];
  let prevEnd = 0;
  for (const m of text.matchAll(WORD)) {
    const start = m.index;
    const end = start + m[0].length;
    const gap = text.slice(prevEnd, start);
    const sentenceStart = out.length === 0 ? !opts.cell : /[\n.!?…:]/.test(gap);
    const capitalized = /^\p{Lu}/u.test(m[0]);
    out.push({ text: m[0], start, end, sentenceStart, capitalized, gap });
    prevEnd = end;
  }
  return out;
}
