// .docx: un segment pe paragraf, din corp, antete, subsoluri, note de subsol și comentarii.
// Citire cu expresii regulate peste XML, ca să meargă la fel în browser și în Node.
import JSZip from 'jszip';

const PARTS = [/^word\/document\.xml$/, /^word\/header\d*\.xml$/, /^word\/footer\d*\.xml$/, /^word\/footnotes\.xml$/, /^word\/endnotes\.xml$/, /^word\/comments\.xml$/];

export function decodeXml(s) {
  return s.replace(/&(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);/gi, (m, e) => {
    const map = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
    if (map[e.toLowerCase()]) return map[e.toLowerCase()];
    return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  });
}

function paragraphText(p) {
  let out = '';
  for (const m of p.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>|<w:tab\/>|<w:br\/>/g)) {
    if (m[0].startsWith('<w:tab')) out += '\t';
    else if (m[0].startsWith('<w:br')) out += '\n';
    else out += decodeXml(m[1]);
  }
  return out;
}

export async function readDocx(bytes) {
  const zip = await JSZip.loadAsync(bytes);
  const names = Object.keys(zip.files);
  const segments = [];
  for (const re of PARTS) {
    for (const name of names.filter((n) => re.test(n)).sort()) {
      const xml = await zip.file(name).async('string');
      for (const m of xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) {
        const t = paragraphText(m[0]);
        if (t.trim() !== '') segments.push(t);
      }
    }
  }
  return { segments, meta: { bytes } };
}

const encodeXml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Pasul 3: pune valorile la loc direct în .docx, dacă fiecare etichetă stă într-un singur <w:t>.
// Întoarce null când o etichetă e ruptă între fragmente (atunci se salvează .md, ca să nu stricăm documentul).
export async function writeDocxRestored(meta, values, tagRegex, parseTagMatch) {
  const zip = await JSZip.loadAsync(meta.bytes);
  const swap = (text) => text.replace(tagRegex(), (...args) => {
    const g = args.slice(0, 7);
    const t = parseTagMatch(g);
    return Object.hasOwn(values, t.tag) ? values[t.tag] : t.match;
  });
  const count = (text) => [...text.matchAll(tagRegex())].length;
  const names = Object.keys(zip.files).filter((n) => PARTS.some((re) => re.test(n)));
  for (const name of names) {
    let xml = await zip.file(name).async('string');
    for (const m of xml.matchAll(/<w:p[ >][\s\S]*?<\/w:p>/g)) {
      const pieces = [...m[0].matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)].map((x) => decodeXml(x[1]));
      if (count(pieces.join('')) !== pieces.reduce((n, p) => n + count(p), 0)) return null;
    }
    xml = xml.replace(/(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g, (m, open, body, close) => open + encodeXml(swap(decodeXml(body))) + close);
    zip.file(name, xml);
  }
  return zip.generateAsync({ type: 'uint8array' });
}
