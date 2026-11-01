// Capturi de ecran în ambele teme, după pseudonimizarea exemplului.
import { chromium } from '@playwright/test';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: 1300, height: 900 } });
await page.goto(pathToFileURL(join(root, 'dist/paravan.html')).href);
await page.setInputFiles('#file1', join(root, 'exemple/sesiune-coaching-fictiva.docx'));
await page.click('#run1');
await page.waitForSelector('#result1:not([hidden])');
await page.screenshot({ path: join(root, 'docs/screenshots/intunecat.png'), fullPage: true });
await page.click('#theme');
await page.screenshot({ path: join(root, 'docs/screenshots/luminos.png'), fullPage: true });
await page.click('#theme');
await browser.close();
