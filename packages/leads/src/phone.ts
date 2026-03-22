const RU_TEMPLATE = '+7 (___) ___-__-__';

function digitsOf(value: string): string {
  return value.replace(/\D/g, '');
}

/** Local part of a Russian number: 10 digits after the country code. */
function ruLocalDigits(value: string): string {
  let digits = digitsOf(value);
  if (digits.startsWith('8') || digits.startsWith('7')) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** Progressive mask for typing: "9123" -> "+7 (912) 3". */
export function formatRuPhone(value: string): string {
  const local = ruLocalDigits(value);
  if (local.length === 0) return '';

  let out = '';
  let i = 0;
  for (const char of RU_TEMPLATE) {
    if (i >= local.length) break;
    if (char === '_') {
      out += local[i];
      i += 1;
    } else {
      out += char;
    }
  }
  return out;
}

export type PhoneRegion = 'ru' | 'intl';

/** Returns E.164 or null when the value can't be a real phone number. */
export function normalizePhone(value: string, region: PhoneRegion = 'ru'): string | null {
  const hasPlus = value.trim().startsWith('+');
  const digits = digitsOf(value);

  if (region === 'ru') {
    let local: string | undefined;
    if (digits.length === 10 && !hasPlus) local = digits;
    if (digits.length === 11 && (digits.startsWith('7') || (digits.startsWith('8') && !hasPlus))) {
      local = digits.slice(1);
    }
    // Russian numbers never start with 0, 1 or 2 after the country code.
    return local && /^[3-9]/.test(local) ? `+7${local}` : null;
  }

  return digits.length >= 10 && digits.length <= 15 ? `+${digits}` : null;
}
