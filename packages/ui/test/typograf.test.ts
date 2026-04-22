import { describe, expect, it } from 'vitest';
import { typograf, typografDeep } from '../src/lib/typograf';

const show = (text: string) => text.replaceAll(String.fromCharCode(160), '·');

describe('typograf', () => {
  it('glues short prepositions to the next word', () => {
    expect(show(typograf('Ремонт квартир в Казани по смете'))).toBe(
      'Ремонт квартир в·Казани по·смете',
    );
  });

  it('handles chains of short words', () => {
    expect(show(typograf('и в то же время'))).toBe('и·в·то же·время');
  });

  it('keeps numbers with their units', () => {
    expect(show(typograf('от 6 500 ₽ за 54 м² и 3 года'))).toBe('от·6 500·₽ за·54·м² и·3·года');
  });

  it('does not touch words that merely start like a preposition', () => {
    expect(show(typograf('Вторичка новая'))).toBe('Вторичка новая');
  });
});

describe('typografDeep', () => {
  it('walks objects and arrays but leaves links alone', () => {
    const result = typografDeep({ title: 'Смета в договоре', links: ['https://t.me/a b'], n: 3 });
    expect(show(result.title)).toBe('Смета в·договоре');
    expect(result.links[0]).toBe('https://t.me/a b');
    expect(result.n).toBe(3);
  });
});
