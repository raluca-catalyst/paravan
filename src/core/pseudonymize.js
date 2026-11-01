// Înlocuiește datele personale cu etichete și construiește cheia.
import { detect } from '../detect/index.js';
import { fold } from '../detect/normalize.js';
import { findTags, tagOf } from './tags.js';

function entityKey(span) {
  const v = span.text;
  switch (span.category) {
    case 'CNP': case 'IBAN': case 'CARD':
      return v.replace(/[^\dA-Za-z]/g, '').toUpperCase();
    case 'TELEFON': {
      let d = v.replace(/\D/g, '');
      if (d.startsWith('0040')) d = '0' + d.slice(4);
      else if (d.startsWith('40') && d.length === 11) d = '0' + d.slice(2);
      return d;
    }
    case 'EMAIL':
      return v.toLowerCase();
    default:
      return fold(v);
  }
}

const words = (s) => fold(s).split(/[\s-]+/).filter(Boolean);

export function pseudonymize(segments, opts = {}) {
  const manual = opts.manual || [];
  const counters = {};
  let alreadyTagged = false;
  for (const seg of segments) {
    for (const t of findTags(seg)) {
      alreadyTagged = true;
      counters[t.category] = Math.max(counters[t.category] || 0, t.n);
    }
  }

  const detections = segments.map((s) => detect(s, manual));

  // Numele complete (2+ cuvinte), ca să știm cui aparține un prenume care apare singur.
  const fullNames = new Map(); // fold(base) -> cuvinte
  for (const spans of detections) {
    for (const s of spans) {
      if (s.category === 'PERSOANA' && words(s.base).length > 1) fullNames.set(fold(s.base), words(s.base));
    }
  }

  const personKey = (s) => {
    const w = words(s.base);
    if (w.length > 1) return 'full:' + fold(s.base);
    const owners = [...fullNames.entries()].filter(([, ws]) => ws.includes(w[0]));
    if (owners.length === 1) return 'full:' + owners[0][0];
    return (owners.length === 0 ? 'one:' : 'ambiguous:') + w[0];
  };

  const entities = new Map(); // category|key -> entitate
  const out = segments.map((seg, si) => {
    let result = '';
    let pos = 0;
    for (const s of detections[si]) {
      const key = s.category + '|' + (s.category === 'PERSOANA' ? personKey(s) : entityKey(s));
      let e = entities.get(key);
      if (!e) {
        counters[s.category] = (counters[s.category] || 0) + 1;
        e = { tag: tagOf(s.category, counters[s.category]), category: s.category, forms: new Map() };
        entities.set(key, e);
      }
      const form = s.base || s.text;
      e.forms.set(form, (e.forms.get(form) || 0) + 1);
      result += seg.slice(pos, s.start);
      result += s.genitive && !/lui\s$/i.test(result) ? 'lui ' + e.tag : e.tag;
      pos = s.end;
    }
    return result + seg.slice(pos);
  });

  const counts = {};
  const list = [];
  for (const e of entities.values()) {
    counts[e.category] = (counts[e.category] || 0) + 1;
    // Valoarea pusă la loc: forma folosită cel mai des; la egalitate, cea mai lungă.
    const value = [...e.forms.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)[0][0];
    list.push({ tag: e.tag, category: e.category, value, forms: [...e.forms.keys()] });
  }

  return {
    segments: out,
    key: { version: 1, source: opts.source || '', created: new Date().toISOString(), entities: list },
    counts,
    alreadyTagged,
  };
}
