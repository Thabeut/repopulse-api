import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface CacheEntry<T> {
  expiresAt: number;
  value: T;
}

@Injectable()
export class GitHubCache {
  private readonly logger = new Logger(GitHubCache.name);
  private readonly store = new Map<string, CacheEntry<unknown>>();
  private readonly ttlMs: number;

  constructor(private readonly config: ConfigService) {
    const seconds = this.config.get<number>('github.cacheTtlSeconds') ?? 120;
    this.ttlMs = Math.max(0, seconds) * 1000;
  }

  get<T>(key: string): T | undefined {
    if (this.ttlMs === 0) {
      return undefined;
    }

    const entry = this.store.get(key);
    if (!entry) {
      this.logger.debug(`MISS ${key}`);
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      this.logger.debug(`MISS ${key}`);
      return undefined;
    }

    this.logger.debug(`HIT ${key}`);
    return entry.value as T;
  }

  set<T>(key: string, value: T): void {
    if (this.ttlMs === 0) {
      return;
    }
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  delete(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }
}
