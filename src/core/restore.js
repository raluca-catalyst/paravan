// Pune la loc datele reale în locul etichetelor. Restul textului rămâne neatins.
import { tagRegex, parseTagMatch } from './tags.js';

export function restore(segments, key) {
  const values = new Map((key?.entities || []).map((e) => [e.tag, e.value]));
  const unknown = new Set();
  let replaced = 0;
  const out = segments.map((seg) => seg.replace(tagRegex(), (...args) => {
    const groups = args.slice(0, 7);
    groups.index = args[args.length - 2];
    const t = parseTagMatch(groups);
    if (values.has(t.tag)) {
      replaced++;
      return values.get(t.tag);
    }
    unknown.add(t.tag);
    return t.match;
  }));
  return { segments: out, replaced, unknownTags: [...unknown] };
}
