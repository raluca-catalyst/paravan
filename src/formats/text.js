// .md și .txt: tot fișierul e un singur segment.
import { decodeText } from './decode.js';

export function readText(bytes) {
  return { segments: [decodeText(bytes)], meta: {} };
}

export function writeText(segments) {
  return new TextEncoder().encode(segments.join(''));
}
