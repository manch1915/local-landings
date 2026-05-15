import { describe, expect, it } from 'vitest';
import {
  byDay,
  filterSlots,
  isoWeekday,
  spotsLabel,
  upcoming,
  type Slot,
} from '../src/lib/schedule';

const slots: Slot[] = [
  { day: 3, time: '19:00', direction: 'box', trainer: 'marina', minutes: 55, spots: 1 },
  { day: 3, time: '07:30', direction: 'functional', trainer: 'ilya', minutes: 55, spots: 4 },
  { day: 3, time: '12:00', direction: 'stretch', trainer: 'marina', minutes: 55, spots: 6 },
  { day: 5, time: '08:00', direction: 'functional', trainer: 'ilya', minutes: 55, spots: 0 },
  { day: 1, time: '18:00', direction: 'trx', trainer: 'ilya', minutes: 55, spots: 3 },
];

// 21 October 2026 is a Wednesday.
const wednesday = (hours: number, minutes = 0) => new Date(2026, 9, 21, hours, minutes);

describe('isoWeekday', () => {
  it('maps Sunday to 7', () => {
    expect(isoWeekday(new Date(2026, 9, 25))).toBe(7);
    expect(isoWeekday(wednesday(10))).toBe(3);
  });
});

describe('byDay', () => {
  it('sorts each day by time and keeps empty days', () => {
    const days = byDay(slots);
    expect(days.get(3)?.map((slot) => slot.time)).toEqual(['07:30', '12:00', '19:00']);
    expect(days.get(7)).toEqual([]);
  });
});

describe('upcoming', () => {
  it('shows what is left today', () => {
    const result = upcoming(slots, wednesday(10));
    expect(result.isToday).toBe(true);
    expect(result.slots.map((slot) => slot.time)).toEqual(['12:00', '19:00']);
  });

  it('moves to the next day with classes after the last one', () => {
    const result = upcoming(slots, wednesday(21));
    expect(result).toMatchObject({ day: 5, isToday: false });
  });

  it('wraps around the week', () => {
    const saturday = new Date(2026, 9, 24, 9);
    expect(upcoming(slots, saturday).day).toBe(1);
  });

  it('respects the limit', () => {
    expect(upcoming(slots, wednesday(6), 2).slots).toHaveLength(2);
  });
});

describe('filterSlots', () => {
  it('keeps every slot without a filter', () => {
    expect(filterSlots(slots, null)).toHaveLength(5);
    expect(filterSlots(slots, 'functional')).toHaveLength(2);
  });
});

describe('spotsLabel', () => {
  it.each([
    [0, 'мест нет'],
    [1, '1 место'],
    [3, '3 места'],
    [5, '5 мест'],
    [11, '11 мест'],
    [21, '21 место'],
    [22, '22 места'],
  ])('%d -> %s', (spots, label) => {
    expect(spotsLabel(spots)).toBe(label);
  });
});
