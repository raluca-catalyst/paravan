// .pdf: textul extras, pe rânduri. Worker-ul pdf.js rulează în același fir,
// ca aplicația să meargă și deschisă direct din fișier (file://).
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
import * as pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs';

globalThis.pdfjsWorker = pdfWorker;

export async function readPdf(bytes) {
  const task = pdfjs.getDocument({ data: bytes.slice(), useWorkerFetch: false, isEvalSupported: false, disableFontFace: true, verbosity: 0 });
  const doc = await task.promise;
  const segments = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    let line = '';
    for (const item of content.items) {
      line += item.str ?? '';
      if (item.hasEOL) { if (line.trim()) segments.push(line); line = ''; }
    }
    if (line.trim()) segments.push(line);
  }
  await task.destroy();
  if (segments.join('').trim() === '') throw new Error('PDF-ul nu are text de citit');
  return { segments, meta: {} };
}
