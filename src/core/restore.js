// Pune la loc datele reale în locul etichetelor. Restul textului rămâne neatins.
import { findTags, findLeftovers } from './tags.js';

export function restore(segments, key) {
  const values = new Map((key?.entities || []).map((e) => [e.tag, e.value]));
  const unknown = new Set();
  const leftovers = [];
  let replaced = 0;
  const out = segments.map((seg) => {
    let result = '';
    let pos = 0;
    for (const t of findTags(seg)) {
      result += seg.slice(pos, t.index);
      if (values.has(t.tag)) { result += values.get(t.tag); replaced++; } else { result += t.match; unknown.add(t.tag); }
      pos = t.index + t.match.length;
    }
    result += seg.slice(pos);
    // Ce seamănă a etichetă și a rămas în text, fără să fie o etichetă necunoscută deja raportată.
    for (const l of findLeftovers(result)) if (!findTags(l).some((t) => t.match === l)) leftovers.push(l);
    return result;
  });
  return { segments: out, replaced, unknownTags: [...unknown], leftovers };
}
