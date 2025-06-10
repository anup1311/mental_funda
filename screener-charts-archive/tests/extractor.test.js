import { normalizeLabel, isYearHeader } from '../src/extractor.js';

test('normalizeLabel strips and lowercases', () => {
  expect(normalizeLabel('  Sales (Cr) ')).toBe('sales cr');
  expect(normalizeLabel('Net Profit')).toBe('net profit');
  expect(normalizeLabel('OPM %')).toBe('opm %');
});

test('isYearHeader matches years and not months', () => {
  expect(isYearHeader('2014')).toBe(true);
  expect(isYearHeader('FY23')).toBe(true);
  expect(isYearHeader('2014-15')).toBe(true);
  expect(isYearHeader('Mar 2023')).toBe(false);
  expect(isYearHeader('TTM')).toBe(false);
  expect(isYearHeader('Q4')).toBe(false);
});

// For extractPL, you would use jsdom to mock DOM and test extraction logic.
// Example (pseudo):
// document.body.innerHTML = `<table>...</table>`;
// expect(extractPL()).toEqual({ years: [...], sales: [...], ... }); 