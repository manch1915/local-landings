import type { RateLimiter } from '../domain/lead';

/** Sliding window per key. One process is enough for a few landing pages. */
export class MemoryRateLimiter implements RateLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  hit(key: string, now: number): number {
    const from = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((time) => time > from);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      const oldest = recent[0] ?? now;
      return Math.max(1, Math.ceil((oldest + this.windowMs - now) / 1000));
    }

    recent.push(now);
    this.hits.set(key, recent);
    if (this.hits.size > 10_000) this.prune(from);
    return 0;
  }

  private prune(from: number): void {
    for (const [key, times] of this.hits) {
      if (times.every((time) => time <= from)) this.hits.delete(key);
    }
  }
}
