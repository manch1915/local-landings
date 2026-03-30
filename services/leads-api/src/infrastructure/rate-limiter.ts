import type { RateLimiter } from '../domain/lead';

/**
 * Sliding window per key. One process is enough for a few landing pages.
 * The map is capped: when full, the oldest keys are evicted first.
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

    const recent = (this.hits.get(key) ?? []).filter((time) => time > from);
    // Re-insert so Map order tracks the most recently seen keys.
    this.hits.delete(key);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      const oldest = recent[0] ?? now;
      return Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
    }

    recent.push(now);
    this.hits.set(key, recent);
    this.evictOverflow();
    return 0;
  }

  private prune(from: number, now: number): void {
    this.lastPrune = now;
    for (const [key, times] of this.hits) {
      if (times.every((time) => time <= from)) this.hits.delete(key);
    }
  }

  private evictOverflow(): void {
    for (const key of this.hits.keys()) {
      if (this.hits.size <= this.maxKeys) break;
      this.hits.delete(key);
    }
  }
}
