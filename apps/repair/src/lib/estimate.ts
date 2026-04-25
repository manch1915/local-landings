export type Property = 'new' | 'secondary';
export type Scope = 'cosmetic' | 'capital' | 'design';
export type Extra = 'demolition' | 'wiring' | 'heatedFloor' | 'designProject' | 'materials';

export interface EstimateInput {
  area: number;
  property: Property;
  scope: Scope;
  bathrooms: number;
  extras: Extra[];
}

/** Prices live in content (ru.yaml), so the client can change them without touching code. */
export interface PriceList {
  /** Labour per m² for each scope. */
  perSquareMeter: Record<Scope, number>;
  /** Bathroom turnkey, per bathroom. */
  bathroom: Record<Scope, number>;
  /** Old housing needs levelling and more prep work. */
  secondaryFactor: number;
  extras: {
    demolition: number;
    wiring: number;
    heatedFloor: number;
    designProject: number;
    materials: Record<Scope, number>;
  };
  /** Weeks: base + area / divisor. */
  duration: Record<Scope, { base: number; perWeek: number }>;
  /** ± spread of the final range, 0.1 = ±10%. */
  spread: number;
}

export interface EstimateLine {
  key: 'works' | 'bathrooms' | Extra;
  amount: number;
}

export interface Estimate {
  min: number;
  max: number;
  perSquareMeter: number;
  weeks: { min: number; max: number };
  lines: EstimateLine[];
}

export const AREA_LIMITS = { min: 15, max: 250 } as const;

function roundTo(value: number, step: number): number {
  return Math.round(value / step) * step;
}

export function clampArea(area: number): number {
  if (!Number.isFinite(area)) return AREA_LIMITS.min;
  return Math.min(AREA_LIMITS.max, Math.max(AREA_LIMITS.min, Math.round(area)));
}

export function estimate(input: EstimateInput, prices: PriceList): Estimate {
  const area = clampArea(input.area);
  const bathrooms = Math.min(4, Math.max(0, Math.round(input.bathrooms)));
  const factor = input.property === 'secondary' ? prices.secondaryFactor : 1;
  const extras = new Set(input.extras);

  const lines: EstimateLine[] = [
    { key: 'works', amount: prices.perSquareMeter[input.scope] * area * factor },
    { key: 'bathrooms', amount: prices.bathroom[input.scope] * bathrooms },
  ];

  // New builds come without old finishes, so there is nothing to tear down.
  if (extras.has('demolition') && input.property === 'secondary') {
    lines.push({ key: 'demolition', amount: prices.extras.demolition * area });
  }
  if (extras.has('wiring')) lines.push({ key: 'wiring', amount: prices.extras.wiring * area });
  if (extras.has('heatedFloor')) {
    lines.push({ key: 'heatedFloor', amount: prices.extras.heatedFloor * Math.max(1, bathrooms) });
  }
  if (extras.has('designProject')) {
    lines.push({ key: 'designProject', amount: prices.extras.designProject * area });
  }
  if (extras.has('materials')) {
    lines.push({ key: 'materials', amount: prices.extras.materials[input.scope] * area });
  }

  const total = lines.reduce((sum, line) => sum + line.amount, 0);
  const duration = prices.duration[input.scope];
  const weeks = duration.base + area / duration.perWeek;

  return {
    min: roundTo(total * (1 - prices.spread), 10_000),
    max: roundTo(total * (1 + prices.spread), 10_000),
    perSquareMeter: roundTo(total / area, 100),
    weeks: { min: Math.max(1, Math.floor(weeks)), max: Math.ceil(weeks * 1.2) },
    lines: lines.map((line) => ({ ...line, amount: roundTo(line.amount, 1_000) })),
  };
}

const rub = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });

/** 1 240 000 -> "1,24 млн ₽", 860 000 -> "860 тыс. ₽" */
export function formatRub(value: number): string {
  if (value >= 1_000_000) {
    const millions = (value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
    return `${millions} млн ₽`;
  }
  if (value >= 10_000) return `${rub.format(Math.round(value / 1_000))} тыс. ₽`;
  return `${rub.format(value)} ₽`;
}

/** "1,12–1,37 млн ₽" when both ends share a unit, otherwise "860 тыс. ₽ – 1,05 млн ₽". */
export function formatRubRange(min: number, max: number): string {
  if (min >= 1_000_000) {
    const fmt = (value: number) =>
      (value / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 2 });
    return `${fmt(min)}–${fmt(max)} млн ₽`;
  }
  if (max < 1_000_000 && min >= 10_000) {
    return `${rub.format(Math.round(min / 1_000))}–${rub.format(Math.round(max / 1_000))} тыс. ₽`;
  }
  return `${formatRub(min)} – ${formatRub(max)}`;
}
