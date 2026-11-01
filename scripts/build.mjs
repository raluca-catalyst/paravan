// Construiește dist/paravan.html: un singur fișier, cu JS, CSS, fonturi și date incluse.
import { build } from 'esbuild';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root));

const result = await build({
  entryPoints: [new URL('src/ui/app.js', root).pathname.replace(/^\/(\w:)/, '$1')],
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  minify: true,
  write: false,
  legalComments: 'none',
  logLevel: 'warning',
  // pdf.js are ramuri pentru Node pe care browserul nu le atinge.
  external: ['canvas', 'path2d', 'fs', 'path', 'url', 'module', 'node:*', 'zlib', 'stream', 'http', 'https'],
});
let js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');

// Fonturile, ca base64, cu unicode-range-urile din @fontsource (latin + latin-ext).
const FONTS = [['jetbrains-mono', [400, 500, 700]], ['barlow', [400, 500, 600]]];
let fontCss = '';
for (const [pkg, weights] of FONTS) {
  for (const w of weights) {
    for (const subset of ['latin-ext', 'latin']) {
      const dir = `node_modules/@fontsource/${pkg}/`;
      const css = read(`${dir}${subset}-${w}.css`).toString();
      fontCss += css.replace(/url\(\.\/files\/([^)]+\.woff2)\)\s*format\(['"]woff2['"]\)(?:,\s*url\([^)]+\)\s*format\(['"]woff['"]\))?/g,
        (m, file) => `url(data:font/woff2;base64,${read(`${dir}files/${file}`).toString('base64')}) format('woff2')`);
    }
  }
}

const css = fontCss + read('src/ui/styles.css').toString();
const html = read('src/ui/index.html').toString()
  .replace('/*CSS*/', () => css)
  .replace('/*JS*/', () => js);

mkdirSync(new URL('dist/', root), { recursive: true });
writeFileSync(new URL('dist/paravan.html', root), html);
console.log(`dist/paravan.html: ${(html.length / 1024 / 1024).toFixed(1)} MB`);
