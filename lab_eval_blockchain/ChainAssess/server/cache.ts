// Simple in-memory TTL cache to avoid hammering the blockchain RPC

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class Cache {
  private store = new Map<string, CacheEntry<unknown>>();
  private readonly defaultTtlMs: number;
  private readonly maxSize: number;

  constructor(defaultTtlMs = 30_000, maxSize = 1000) {
    this.defaultTtlMs = defaultTtlMs;
    this.maxSize = maxSize;

    // Periodic cleanup every 60 seconds
    setInterval(() => this.cleanup(), 60_000);
  }

  get<T>(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.data as T;
  }

  set<T>(key: string, data: T, ttlMs?: number): void {
    // Evict oldest entries if over max size
    if (this.store.size >= this.maxSize) {
      const firstKey = Array.from(this.store.keys())[0];
      if (firstKey) this.store.delete(firstKey);
    }

    this.store.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTtlMs),
    });
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  invalidatePattern(prefix: string): void {
    for (const key of Array.from(this.store.keys())) {
      if (key.startsWith(prefix)) {
        this.store.delete(key);
      }
    }
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of Array.from(this.store.entries())) {
      if (now > entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }
}
