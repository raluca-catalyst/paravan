// .md și .txt: tot fișierul e un singur segment.
export function readText(bytes) {
  const text = new TextDecoder('utf-8').decode(bytes).replace(/^﻿/, '');
  return { segments: [text], meta: {} };
}

export function writeText(segments) {
  return new TextEncoder().encode(segments.join(''));
}
