import { describe, expect, it } from 'vitest';
import {
  clampArea,
  estimate,
  formatRub,
  formatRubRange,
  type PriceList,
} from '../src/lib/estimate';

const prices: PriceList = {
  perSquareMeter: { cosmetic: 6500, capital: 14000, design: 22000 },
  bathroom: { cosmetic: 90000, capital: 180000, design: 280000 },
  secondaryFactor: 1.15,
  extras: {
    demolition: 1200,
    wiring: 2400,
    heatedFloor: 45000,
    designProject: 1800,
    materials: { cosmetic: 4500, capital: 7000, design: 9000 },
  },
  duration: {
    cosmetic: { base: 3, perWeek: 25 },
    capital: { base: 7, perWeek: 12 },
    design: { base: 10, perWeek: 10 },
  },
  spread: 0.1,
};

describe('estimate', () => {
  it('prices a capital renovation of a 54 m² flat in an old building', () => {
    const result = estimate(
      {
        area: 54,
        property: 'secondary',
        scope: 'capital',
        bathrooms: 1,
        extras: ['demolition', 'wiring'],
      },
      prices,
    );
    // works 869 400 + bathroom 180 000 + demolition 64 800 + wiring 129 600 = 1 243 800
    expect(result.min).toBe(1_120_000);
    expect(result.max).toBe(1_370_000);
    expect(result.perSquareMeter).toBe(23_000);
    expect(result.weeks).toEqual({ min: 11, max: 14 });
  });

  it('skips demolition for a new build', () => {
    const result = estimate(
      { area: 40, property: 'new', scope: 'cosmetic', bathrooms: 1, extras: ['demolition'] },
      prices,
    );
    expect(result.lines.map((line) => line.key)).toEqual(['works', 'bathrooms']);
  });

  it('adds materials at the rate of the chosen scope', () => {
    const base = {
      area: 50,
      property: 'new' as const,
      bathrooms: 0,
      extras: ['materials' as const],
    };
    const cosmetic = estimate({ ...base, scope: 'cosmetic' }, prices);
    const design = estimate({ ...base, scope: 'design' }, prices);
    expect(cosmetic.lines.at(-1)).toEqual({ key: 'materials', amount: 225_000 });
    expect(design.lines.at(-1)).toEqual({ key: 'materials', amount: 450_000 });
  });

  it('keeps the range ordered and grows with the area', () => {
    const small = estimate(
      { area: 30, property: 'new', scope: 'design', bathrooms: 1, extras: [] },
      prices,
    );
    const big = estimate(
      { area: 120, property: 'new', scope: 'design', bathrooms: 2, extras: [] },
      prices,
    );
    expect(small.min).toBeLessThan(small.max);
    expect(big.min).toBeGreaterThan(small.max);
    expect(big.weeks.max).toBeGreaterThan(small.weeks.max);
  });

  it('clamps nonsense input instead of returning NaN', () => {
    expect(clampArea(Number.NaN)).toBe(15);
    expect(clampArea(9000)).toBe(250);
    const result = estimate(
      { area: -5, property: 'new', scope: 'cosmetic', bathrooms: 99, extras: [] },
      prices,
    );
    expect(Number.isFinite(result.min)).toBe(true);
    expect(result.lines[1]?.amount).toBe(360_000);
  });
});

describe('formatRub', () => {
  it.each([
    [1_240_000, '1,24 млн ₽'],
    [2_000_000, '2 млн ₽'],
    [860_000, '860 тыс. ₽'],
    [4_500, '4 500 ₽'],
  ])('formats %d', (value, expected) => {
    expect(formatRub(value).replace(/\s/g, ' ')).toBe(expected);
  });
});

describe('formatRubRange', () => {
  it.each([
    [1_120_000, 1_370_000, '1,12–1,37 млн ₽'],
    [350_000, 430_000, '350–430 тыс. ₽'],
    [900_000, 1_100_000, '900 тыс. ₽ – 1,1 млн ₽'],
  ])('formats %d..%d', (min, max, expected) => {
    expect(formatRubRange(min, max).replace(/\s/g, ' ')).toBe(expected);
  });
});
