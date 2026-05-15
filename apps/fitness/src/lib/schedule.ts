/** 1 = Monday … 7 = Sunday, as in ISO weeks. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export interface Slot {
  day: Weekday;
  /** "07:30" */
  time: string;
  direction: string;
  trainer: string;
  minutes: number;
  spots: number;
}

export function isoWeekday(date: Date): Weekday {
  const day = date.getDay();
  return (day === 0 ? 7 : day) as Weekday;
}

function minutesOf(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function sortSlots(slots: Slot[]): Slot[] {
  return [...slots].sort((a, b) => a.day - b.day || minutesOf(a.time) - minutesOf(b.time));
}

export function byDay(slots: Slot[]): Map<Weekday, Slot[]> {
  const days = new Map<Weekday, Slot[]>();
  for (let day = 1; day <= 7; day++) days.set(day as Weekday, []);
  for (const slot of sortSlots(slots)) days.get(slot.day)?.push(slot);
  return days;
}

export function filterSlots(slots: Slot[], direction: string | null): Slot[] {
  return direction ? slots.filter((slot) => slot.direction === direction) : slots;
}

export interface Upcoming {
  /** Which day the list belongs to: today, or the next day that has classes. */
  day: Weekday;
  isToday: boolean;
  slots: Slot[];
}

/**
 * Classes still ahead today. Late in the evening, when today is over,
 * shows the next day with classes instead of an empty card.
 */
export function upcoming(slots: Slot[], now: Date, limit = 3): Upcoming {
  const today = isoWeekday(now);
  const current = now.getHours() * 60 + now.getMinutes();
  const days = byDay(slots);

  const left = (days.get(today) ?? []).filter((slot) => minutesOf(slot.time) > current);
  if (left.length > 0) return { day: today, isToday: true, slots: left.slice(0, limit) };

  for (let offset = 1; offset <= 7; offset++) {
    const day = (((today - 1 + offset) % 7) + 1) as Weekday;
    const list = days.get(day) ?? [];
    if (list.length > 0) return { day, isToday: false, slots: list.slice(0, limit) };
  }
  return { day: today, isToday: true, slots: [] };
}

export function spotsLabel(spots: number): string {
  if (spots === 0) return 'мест нет';
  const mod10 = spots % 10;
  const mod100 = spots % 100;
  if (mod10 === 1 && mod100 !== 11) return `${spots} место`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${spots} места`;
  return `${spots} мест`;
}
