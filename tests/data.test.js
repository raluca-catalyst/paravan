import { describe, it, expect } from 'vitest';
import { fold } from '../src/detect/normalize.js';
import {
  FIRST_FEMALE, FIRST_MALE, SURNAMES, DIMINUTIVES, COMMON_WORDS,
  NAME_COMMON_WORDS, LOCALITIES, ROLE_LABELS, ALLOWLIST,
} from '../src/detect/data/index.js';

describe('normalizare', () => {
  it('fold scoate diacriticele, inclusiv sedila veche', () => {
    expect(fold('Ştefan ŢUŢUIANU')).toBe('stefan tutuianu');
    expect(fold('Ștefan Țuțuianu')).toBe('stefan tutuianu');
  });
});

describe('date', () => {
  it('are listele de nume', () => {
    expect(FIRST_FEMALE.has('maria')).toBe(true);
    expect(FIRST_MALE.size).toBeGreaterThan(550);
    expect(SURNAMES.size).toBeGreaterThan(9500);
  });
  it('are localitățile, cele lungi primele', () => {
    expect(LOCALITIES).toContain('Baia Mare');
    expect(LOCALITIES.length).toBeGreaterThan(10000);
    expect(LOCALITIES[0].length).toBeGreaterThanOrEqual(LOCALITIES[LOCALITIES.length - 1].length);
  });
  it('cuvintele obișnuite nu conțin nume', () => {
    expect(COMMON_WORDS.has('saptamana')).toBe(true);
    expect(COMMON_WORDS.has('maria')).toBe(false);
  });
  it('știe numele care sunt și cuvinte obișnuite', () => {
    expect(NAME_COMMON_WORDS.has('floare')).toBe(true);
  });
  it('are diminutive, roluri și excepții', () => {
    expect(DIMINUTIVES.has('ionut')).toBe(true);
    expect(DIMINUTIVES.size).toBeGreaterThanOrEqual(120);
    expect(ROLE_LABELS.has('coach')).toBe(true);
    expect(ALLOWLIST.has('chatgpt')).toBe(true);
  });
});
