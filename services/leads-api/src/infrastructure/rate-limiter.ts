import type { RateLimiter } from '../domain/lead';

const OVERFLOW_KEY = '__overflow__';

/**
 * Sliding window per key. One process is enough for a few landing pages.
 * The map is capped: when it is full of live keys, new clients share one
 * overflow bucket with a larger limit instead of evicting live windows
 * or locking everyone out.
 */
export class MemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>();
  private lastPrune = 0;

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
    private readonly maxKeys = 10_000,
  ) {}

  hit(key: string, now: number): number {
    const from = now - this.windowMs;
    if (now - this.lastPrune > this.windowMs) this.prune(from, now);

    let limit = this.limit;
    if (!this.hits.has(key) && this.hits.size >= this.maxKeys) {
      // Throttled, so a flood of new keys can't make every request a full scan.
      if (now - this.lastPrune > 1000) this.prune(from, now);
      if (this.hits.size >= this.maxKeys) {
        key = OVERFLOW_KEY;
        limit = this.limit * 20;
      }
    }

    const recent = (this.hits.get(key) ?? []).filter((time) => time > from);

    if (recent.length >= limit) {
      this.hits.set(key, recent);
      const oldest = recent[0] ?? now;
      return Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
    }

    recent.push(now);
    this.hits.set(key, recent);
    return 0;
  }

  private prune(from: number, now: number): void {
    this.lastPrune = now;
    for (const [key, times] of this.hits) {
      if (times.every((time) => time <= from)) this.hits.delete(key);
    }
  }
}
