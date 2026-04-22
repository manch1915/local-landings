const NBSP = String.fromCharCode(160);

// Short words that shouldn't hang at the end of a line.
const SHORT_WORDS =
  'в|во|и|с|со|к|ко|о|об|у|а|на|по|не|ни|за|до|из|от|для|без|при|но|же|я|мы|вы|их|его|её|a|an|the|to|of|in|on|at|by|or|and';
const HANGING = new RegExp(String.raw`(?<=^|[\s(«"])(${SHORT_WORDS})\s+`, 'giu');
const UNIT =
  /(\d)\s+(м²|м|₽|%|см|мм|кг|мин|ч|лет|года?|недел[ьи]|нед\.|тыс\.|млн|дн(?:я|ей)?|раз|занятий|уроков?)(?=$|[\s.,;:!?)»])/gu;
const DASH_AFTER_NUMBER = /(\d)\s+–\s+(\d)/g;

/** Russian-style non-breaking spaces for headings and body copy. */
export function typograf(text: string): string {
  return text
    .replace(HANGING, `$1${NBSP}`)
    .replace(UNIT, `$1${NBSP}$2`)
    .replace(DASH_AFTER_NUMBER, `$1${NBSP}–${NBSP}$2`);
}

/** Applies typograf to every string in a content object, skipping URLs. */
export function typografDeep<T>(value: T): T {
  if (typeof value === 'string') {
    return (/^(https?:|tel:|mailto:|\/)/.test(value) ? value : typograf(value)) as T;
  }
  if (Array.isArray(value)) return value.map((item: unknown) => typografDeep(item)) as T;
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [key, typografDeep(item)]),
    ) as T;
  }
  return value;
}
