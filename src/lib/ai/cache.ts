// zeroto1.academy — AI Caching layer (Redis + resilient in-memory fallback)
// Returns cached generation for identical input to prevent redundant LLM cost & latency

import crypto from 'crypto';
import Redis from 'ioredis';
import { logAiEvent } from './logger';

interface MemoryCacheEntry {
  value: string;
  expiresAt: number;
}

class AiCache {
  private redisClient: Redis | null = null;
  private memoryCache: Map<string, MemoryCacheEntry> = new Map();
  private redisConnected: boolean = false;

  constructor() {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
      try {
        this.redisClient = new Redis(redisUrl, {
          lazyConnect: true,
          connectTimeout: 2000,
          maxRetriesPerRequest: 1,
          retryStrategy: () => null, // don't retry endlessly in local dev
        });

        this.redisClient.connect().then(() => {
          this.redisConnected = true;
          logAiEvent({ level: 'info', event: 'redis_connected' });
        }).catch(() => {
          this.redisConnected = false;
        });

        this.redisClient.on('error', () => {
          this.redisConnected = false;
        });
      } catch {
        this.redisConnected = false;
      }
    }
  }

  public hashKey(prefix: string, input: unknown): string {
    const str = typeof input === 'string' ? input : JSON.stringify(input);
    const hash = crypto.createHash('sha256').update(str).digest('hex').slice(0, 32);
    return `ai:${prefix}:${hash}`;
  }

  public async get<T>(key: string): Promise<T | null> {
    // 1. Try Redis if connected
    if (this.redisConnected && this.redisClient) {
      try {
        const val = await this.redisClient.get(key);
        if (val) {
          logAiEvent({
            level: 'info',
            event: 'cache_hit',
            cached: true,
            metadata: { key, storage: 'redis' },
          });
          return JSON.parse(val) as T;
        }
      } catch {
        // Fallback to memory
      }
    }

    // 2. Memory cache check
    const entry = this.memoryCache.get(key);
    if (entry) {
      if (entry.expiresAt > Date.now()) {
        logAiEvent({
          level: 'info',
          event: 'cache_hit',
          cached: true,
          metadata: { key, storage: 'memory' },
        });
        return JSON.parse(entry.value) as T;
      } else {
        this.memoryCache.delete(key);
      }
    }

    logAiEvent({
      level: 'debug',
      event: 'cache_miss',
      cached: false,
      metadata: { key },
    });
    return null;
  }

  public async set<T>(key: string, value: T, ttlSeconds: number = 86400): Promise<void> {
    const jsonStr = JSON.stringify(value);

    // Save in memory
    this.memoryCache.set(key, {
      value: jsonStr,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });

    // Save in Redis if connected
    if (this.redisConnected && this.redisClient) {
      try {
        await this.redisClient.setex(key, ttlSeconds, jsonStr);
      } catch {
        // Silently tolerate redis write failure
      }
    }
  }

  public clearMemory(): void {
    this.memoryCache.clear();
  }
}

export const aiCache = new AiCache();
