// Textul vine în UTF-8 sau, la exporturile din Excel în română, în windows-1250.
export function decodeText(bytes) {
  let text;
  try {
    text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    text = new TextDecoder('windows-1250').decode(bytes);
  }
  return text.replace(/^﻿/, '');
}
