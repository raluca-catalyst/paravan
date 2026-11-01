import { test, expect } from '@playwright/test';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../../', import.meta.url));
const page_url = pathToFileURL(join(root, 'dist/paravan.html')).href;
const example = join(root, 'exemple/sesiune-coaching-fictiva.docx');

async function download(page, selector) {
  const [d] = await Promise.all([page.waitForEvent('download'), page.click(selector)]);
  const path = await d.path();
  return { name: d.suggestedFilename(), text: readFileSync(path, 'utf8') };
}

test('cei trei pași, fără internet', async ({ page, context }) => {
  const external = [];
  page.on('request', (r) => { if (!/^(file|data|blob):/.test(r.url())) external.push(r.url()); });
  await page.goto(page_url);
  await expect(page.locator('h1')).toContainText('Paravan');
  expect(external).toEqual([]);
  await context.setOffline(true);

  // Pasul 1
  await page.setInputFiles('#file1', example);
  await page.click('#run1');
  await expect(page.locator('#preview')).toContainText('[PERSOANA_1]');
  await expect(page.locator('#preview')).not.toContainText('Ioana');
  await expect(page.locator('#chips')).toContainText('nume');

  await page.fill('#manual', 'joi');
  await page.click('#rerun');
  await expect(page.locator('#preview')).not.toContainText('joi peste');

  const anon = await download(page, '#dl-anon');
  expect(anon.name).toMatch(/-pseudonimizat\.md$/);
  expect(anon.text).not.toContain('Ioana');
  const key = await download(page, '#dl-key');
  expect(JSON.parse(key.text).entities.length).toBeGreaterThan(3);

  // Pasul 3, cu cheia din memorie și o etichetă stricată de „AI”
  await page.fill('#paste3', 'Rezumat: ' + anon.text.replace('[PERSOANA_1]', '[persoana_1]'));
  await page.click('#run3');
  const restored = await download(page, '#dl-restored');
  expect(restored.text).toContain('Ioana');
  expect(restored.text).not.toContain('[persoana_1]');

  // Cheie greșită, după reîncărcare
  await page.reload();
  const dir = mkdtempSync(join(tmpdir(), 'paravan-'));
  const wrong = join(dir, 'alta-cheie.json');
  writeFileSync(wrong, JSON.stringify({ version: 1, entities: [{ tag: '[EMAIL_1]', category: 'EMAIL', value: 'x@y.ro' }] }));
  await page.fill('#paste3', '[PERSOANA_1] a zis că vine.');
  await page.setInputFiles('#key3', wrong);
  await page.click('#run3');
  await expect(page.locator('#msg3')).toContainText('Cheia nu se potrivește');

  // Tema
  await page.click('#theme');
  await expect(page.locator('body')).toHaveClass(/light/);
});

test('PDF cu text, deschis din fișier', async ({ page }) => {
  const { PDFDocument, StandardFonts } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const p = pdf.addPage();
  p.drawText('Am vorbit cu Grigore Untaru la 0722 123 456.', { x: 50, y: 700, size: 12, font: await pdf.embedFont(StandardFonts.Helvetica) });
  const dir = mkdtempSync(join(tmpdir(), 'paravan-'));
  const file = join(dir, 'nota.pdf');
  writeFileSync(file, await pdf.save());
  await page.goto(page_url);
  await page.setInputFiles('#file1', file);
  await page.click('#run1');
  await expect(page.locator('#preview')).toContainText('[TELEFON_1]');
  await expect(page.locator('#preview')).not.toContainText('Untaru');
});

test('format nesuportat: mesaj clar', async ({ page }) => {
  const dir = mkdtempSync(join(tmpdir(), 'paravan-'));
  const file = join(dir, 'prezentare.pptx');
  writeFileSync(file, 'x');
  await page.goto(page_url);
  await page.setInputFiles('#file1', file);
  await page.click('#run1');
  await expect(page.locator('#msg1')).toContainText('Format nesuportat');
});

test('numele fișierului nu duce date la AI; mesajele de la pasul 3', async ({ page }) => {
  const dir = mkdtempSync(join(tmpdir(), 'paravan-'));
  const file = join(dir, 'Sedinta Maria Popescu.md');
  writeFileSync(file, 'Am vorbit cu Maria Popescu despre plan.');
  await page.goto(page_url);
  await page.setInputFiles('#file1', file);
  await page.click('#run1');
  const anon = await download(page, '#dl-anon');
  expect(anon.name).not.toContain('Popescu');
  expect(anon.name).toMatch(/-pseudonimizat\.md$/);

  await page.fill('#paste3', 'Rezumat: [PERSOANA_1] vine. Apoi PERSOANA_1ului i-am scris.');
  await page.click('#run3');
  await expect(page.locator('#msg3')).toContainText('Sedinta Maria Popescu.md');
  await expect(page.locator('#msg3')).toContainText('PERSOANA_1ului');
});
