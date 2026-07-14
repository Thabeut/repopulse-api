import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { firstValueFrom } from 'rxjs';
import { GitHubCache } from './github.cache';
import {
  GitHubNotFoundError,
  GitHubRateLimitError,
  GitHubUpstreamError,
} from './github.errors';
import { mapRepository, mapSearchItem } from './github.mapper';
import {
  GitHubCommitActivityWeekRaw,
  GitHubCommitRaw,
  GitHubContributorRaw,
  GitHubRateLimitInfo,
  GitHubReleaseRaw,
  GitHubRepoRaw,
  GitHubSearchResponseRaw,
  NormalizedRepository,
  NormalizedSearchItem,
} from './github.types';

@Injectable()
export class GitHubClient {
  private readonly logger = new Logger(GitHubClient.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly timeoutMs: number;
  private lastRateLimit: GitHubRateLimitInfo = {
    remaining: null,
    reset: null,
    limit: null,
  };

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
    private readonly cache: GitHubCache,
  ) {
    this.baseUrl =
      this.config.get<string>('github.baseUrl') ?? 'https://api.github.com';
    this.token = this.config.get<string>('github.token') ?? '';
    this.timeoutMs = this.config.get<number>('github.timeoutMs') ?? 10000;
  }

  getRateLimit(): GitHubRateLimitInfo {
    return { ...this.lastRateLimit };
  }

  async searchRepositories(
    q: string,
    page = 1,
    perPage = 20,
  ): Promise<{ total: number; items: NormalizedSearchItem[] }> {
    const path = '/search/repositories';
    const params = { q, page, per_page: Math.min(perPage, 30) };
    const data = await this.request<GitHubSearchResponseRaw>(
      'GET',
      path,
      params,
    );
    return {
      total: data.total_count,
      items: data.items.map(mapSearchItem),
    };
  }

  async getRepository(owner: string, name: string): Promise<GitHubRepoRaw> {
    return this.request<GitHubRepoRaw>(
      'GET',
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}`,
    );
  }

  async fetchFullRepository(
    owner: string,
    name: string,
    options?: { bypassCache?: boolean },
  ): Promise<NormalizedRepository> {
    const cacheKey = `full:${owner.toLowerCase()}/${name.toLowerCase()}`;
    if (!options?.bypassCache) {
      const cached = this.cache.get<NormalizedRepository>(cacheKey);
      if (cached) {
        return cached;
      }
    }

    const [repo, languages, contributors, releases, commits, commitActivity] =
      await Promise.all([
        this.getRepository(owner, name),
        this.getLanguages(owner, name),
        this.getContributors(owner, name),
        this.getReleases(owner, name),
        this.getCommits(owner, name),
        this.getCommitActivity(owner, name),
      ]);

    const normalized = mapRepository({
      repo,
      languages,
      contributors,
      releases,
      commits,
      commitActivity,
    });

    this.cache.set(cacheKey, normalized);
    return normalized;
  }

  async getLanguages(
    owner: string,
    name: string,
  ): Promise<Record<string, number>> {
    return this.request<Record<string, number>>(
      'GET',
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/languages`,
    );
  }

  async getContributors(
    owner: string,
    name: string,
    perPage = 25,
  ): Promise<GitHubContributorRaw[]> {
    return this.request<GitHubContributorRaw[]>(
      'GET',
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/contributors`,
      { per_page: perPage },
    );
  }

  async getReleases(
    owner: string,
    name: string,
    perPage = 10,
  ): Promise<GitHubReleaseRaw[]> {
    return this.request<GitHubReleaseRaw[]>(
      'GET',
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/releases`,
      { per_page: perPage },
    );
  }

  async getCommits(
    owner: string,
    name: string,
    perPage = 10,
  ): Promise<GitHubCommitRaw[]> {
    return this.request<GitHubCommitRaw[]>(
      'GET',
      `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/commits`,
      { per_page: perPage },
    );
  }

  async getCommitActivity(
    owner: string,
    name: string,
  ): Promise<GitHubCommitActivityWeekRaw[] | null> {
    try {
      const response = await this.requestRaw<GitHubCommitActivityWeekRaw[]>(
        'GET',
        `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/stats/commit_activity`,
      );
      if (response.status === 202) {
        return null;
      }
      return response.data;
    } catch (error) {
      if (error instanceof GitHubNotFoundError) {
        return null;
      }
      this.logger.warn(`commit_activity unavailable for ${owner}/${name}`);
      return null;
    }
  }

  private async request<T>(
    method: 'GET',
    path: string,
    params?: Record<string, string | number>,
    options?: { bypassCache?: boolean },
  ): Promise<T> {
    const cacheKey = this.buildCacheKey(method, path, params);
    if (method === 'GET' && !options?.bypassCache) {
      const cached = this.cache.get<T>(cacheKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    const response = await this.requestRaw<T>(method, path, params);
    if (method === 'GET') {
      this.cache.set(cacheKey, response.data);
    }
    return response.data;
  }

  private async requestRaw<T>(
    method: 'GET',
    path: string,
    params?: Record<string, string | number>,
  ): Promise<AxiosResponse<T>> {
    const url = `${this.baseUrl}${path}`;
    const config: AxiosRequestConfig = {
      method,
      url,
      params,
      timeout: this.timeoutMs,
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'RepoPulse',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      validateStatus: (status) => status >= 200 && status < 300,
    };

    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      attempt += 1;
      try {
        const response = await firstValueFrom(this.http.request<T>(config));
        this.captureRateLimit(response.headers as Record<string, unknown>);
        this.logger.debug(
          `${method} ${path} remaining=${this.lastRateLimit.remaining ?? '?'}`,
        );
        return response;
      } catch (error) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;
        this.captureRateLimit(
          (axiosError.response?.headers as Record<string, unknown>) ?? {},
        );

        if (status === 404) {
          throw new GitHubNotFoundError(`GitHub resource not found: ${path}`);
        }

        if (status === 403 || status === 429) {
          const remaining = this.lastRateLimit.remaining;
          if (remaining === 0 || status === 429) {
            throw new GitHubRateLimitError(this.lastRateLimit.reset);
          }
        }

        const retryable =
          !status ||
          status >= 500 ||
          axiosError.code === 'ECONNABORTED' ||
          axiosError.code === 'ETIMEDOUT';

        if (retryable && attempt < maxAttempts) {
          const delayMs = 100 * Math.pow(4, attempt - 1);
          await this.sleep(delayMs);
          continue;
        }

        throw new GitHubUpstreamError(
          axiosError.message || 'GitHub API request failed',
        );
      }
    }

    throw new GitHubUpstreamError('GitHub API request failed');
  }

  private buildCacheKey(
    method: string,
    path: string,
    params?: Record<string, string | number>,
  ): string {
    const query = params
      ? Object.keys(params)
          .sort()
          .map((key) => `${key}=${params[key]}`)
          .join('&')
      : '';
    return `${method}:${path}${query ? `?${query}` : ''}`;
  }

  private captureRateLimit(headers: Record<string, unknown>): void {
    const remaining = headers['x-ratelimit-remaining'];
    const reset = headers['x-ratelimit-reset'];
    const limit = headers['x-ratelimit-limit'];

    this.lastRateLimit = {
      remaining:
        remaining !== undefined ? Number(remaining) : this.lastRateLimit.remaining,
      reset: reset !== undefined ? Number(reset) : this.lastRateLimit.reset,
      limit: limit !== undefined ? Number(limit) : this.lastRateLimit.limit,
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
