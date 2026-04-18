import { describe, expect, it } from 'vitest';
import { formatRuPhone, normalizePhone } from '../src/phone';

describe('formatRuPhone', () => {
  it.each([
    ['', ''],
    ['9', '+7 (9'],
    ['912', '+7 (912'],
    ['9123', '+7 (912) 3'],
    ['9123456789', '+7 (912) 345-67-89'],
    ['89123456789', '+7 (912) 345-67-89'],
    ['+7 (912) 345-67-891111', '+7 (912) 345-67-89'],
    ['+7 (812', '+7 (812'],
    ['8', '+7 ('],
    ['+7 (8', '+7 (8'],
    ['+7 ', ''],
  ])('formats %j as %j', (raw, expected) => {
    expect(formatRuPhone(raw)).toBe(expected);
  });

  it('reads a typed leading 8 as the country code', () => {
    let value = '';
    for (const digit of '89123456789') value = formatRuPhone(value + digit);
    expect(value).toBe('+7 (912) 345-67-89');
  });

  it('keeps Kazan landline codes that start with 8', () => {
    let value = '';
    for (const digit of '88432114790') value = formatRuPhone(value + digit);
    expect(value).toBe('+7 (843) 211-47-90');
  });

  it('is stable when applied to its own output', () => {
    const once = formatRuPhone('9123456789');
    expect(formatRuPhone(once)).toBe(once);
  });
});

describe('normalizePhone', () => {
  it.each([
    ['+7 (912) 345-67-89', '+79123456789'],
    ['8 912 345 67 89', '+79123456789'],
    ['9123456789', '+79123456789'],
    ['+7 (843) 200-10-10', '+78432001010'],
  ])('accepts Russian number %j', (raw, expected) => {
    expect(normalizePhone(raw, 'ru')).toBe(expected);
  });

  it.each(['+7 (912) 345', '123', '+7 (112) 345-67-89', '+44 20 7946 0958'])(
    'rejects %j for the ru region',
    (raw) => {
      expect(normalizePhone(raw, 'ru')).toBeNull();
    },
  );

  it('accepts international numbers outside Russia', () => {
    expect(normalizePhone('+44 20 7946 0958', 'intl')).toBe('+442079460958');
    expect(normalizePhone('+374 91 123456', 'intl')).toBe('+37491123456');
    expect(normalizePhone('12345', 'intl')).toBeNull();
  });
});
