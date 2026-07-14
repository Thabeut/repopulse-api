import { ConfigService } from '@nestjs/config';
import { GitHubCache } from './github.cache';

describe('GitHubCache', () => {
  it('stores and returns values within TTL', () => {
    const cache = new GitHubCache({
      get: () => 60,
    } as unknown as ConfigService);

    cache.set('k', { ok: true });
    expect(cache.get<{ ok: boolean }>('k')).toEqual({ ok: true });
  });

  it('returns undefined after expiry', () => {
    jest.useFakeTimers();
    const cache = new GitHubCache({
      get: () => 1,
    } as unknown as ConfigService);

    cache.set('k', 1);
    expect(cache.get<number>('k')).toBe(1);
    jest.advanceTimersByTime(1001);
    expect(cache.get<number>('k')).toBeUndefined();
    jest.useRealTimers();
  });

  it('disables caching when TTL is zero', () => {
    const cache = new GitHubCache({
      get: () => 0,
    } as unknown as ConfigService);

    cache.set('k', 1);
    expect(cache.get<number>('k')).toBeUndefined();
  });
});
