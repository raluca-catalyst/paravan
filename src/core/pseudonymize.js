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

// 1 → B, 2 → C, … 25 → Z, apoi BB, CC.
const variantLetter = (i) => String.fromCharCode(65 + ((i - 1) % 25) + 1).repeat(Math.floor((i - 1) / 25) + 1);

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

  // Prima trecere: entitățile, numerotate în ordinea apariției, și formele fiecăreia.
  const entities = new Map(); // category|key -> entitate
  const occurrences = detections.map((spans) => spans.map((s) => {
    const key = s.category + '|' + (s.category === 'PERSOANA' ? personKey(s) : entityKey(s));
    let e = entities.get(key);
    if (!e) {
      counters[s.category] = (counters[s.category] || 0) + 1;
      e = { n: counters[s.category], category: s.category, forms: new Map() };
      entities.set(key, e);
    }
    const form = s.base || s.text;
    e.forms.set(form, (e.forms.get(form) || 0) + 1);
    return { span: s, entity: e, form };
  }));

  // Forma folosită cel mai des primește eticheta de bază; celelalte forme primesc variante (_B, _C),
  // ca dezanonimizarea să pună la loc exact forma din original („Ioana Mărgineanu” vs. „Ioana”).
  const counts = {};
  const list = [];
  for (const e of entities.values()) {
    counts[e.category] = (counts[e.category] || 0) + 1;
    const ordered = [...e.forms.entries()].sort((a, b) => b[1] - a[1] || b[0].length - a[0].length).map(([f]) => f);
    e.tags = new Map();
    ordered.forEach((form, i) => {
      const variant = i === 0 ? '' : variantLetter(i);
      const tag = tagOf(e.category, e.n, variant);
      e.tags.set(form, tag);
      list.push({ tag, category: e.category, value: form });
    });
  }

  // A doua trecere: textul cu etichete.
  const out = segments.map((seg, si) => {
    let result = '';
    let pos = 0;
    for (const { span, entity, form } of occurrences[si]) {
      const tag = entity.tags.get(form);
      result += seg.slice(pos, span.start);
      result += span.genitive && !/lui\s$/i.test(result) ? 'lui ' + tag : tag;
      pos = span.end;
    }
    return result + seg.slice(pos);
  });

  return {
    segments: out,
    key: { version: 1, source: opts.source || '', created: new Date().toISOString(), entities: list },
    counts,
    alreadyTagged,
  };
}
