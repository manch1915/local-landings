import type { RateLimiter } from '../domain/lead';

/**
 * Sliding window per key. One process is enough for a few landing pages.
 * The map is capped: when it is full of live keys, new keys are refused
 * rather than evicting someone who is still inside their window.
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

    if (!this.hits.has(key) && this.hits.size >= this.maxKeys) {
      // Throttled, so a flood of new keys can't make every request a full scan.
      if (now - this.lastPrune > 1000) this.prune(from, now);
      if (this.hits.size >= this.maxKeys) return Math.ceil(this.windowMs / 1000);
    }

    const recent = (this.hits.get(key) ?? []).filter((time) => time > from);

    if (recent.length >= this.limit) {
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
