import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of, throwError } from 'rxjs';
import { AxiosError, AxiosHeaders } from 'axios';
import { GitHubCache } from './github.cache';
import { GitHubClient } from './github.client';
import { GitHubNotFoundError, GitHubRateLimitError } from './github.errors';

describe('GitHubClient', () => {
  const request = jest.fn();
  const http = { request } as unknown as HttpService;
  const config = {
    get: (key: string) => {
      const map: Record<string, unknown> = {
        'github.baseUrl': 'https://api.github.com',
        'github.token': 'token',
        'github.timeoutMs': 5000,
        'github.cacheTtlSeconds': 60,
      };
      return map[key];
    },
  } as unknown as ConfigService;
  const cache = new GitHubCache(config);
  let client: GitHubClient;

  beforeEach(() => {
    request.mockReset();
    cache.clear();
    client = new GitHubClient(http, config, cache);
  });

  it('searches and normalizes repositories', async () => {
    request.mockReturnValue(
      of({
        status: 200,
        headers: {
          'x-ratelimit-remaining': '4999',
          'x-ratelimit-reset': '1',
          'x-ratelimit-limit': '5000',
        },
        data: {
          total_count: 1,
          incomplete_results: false,
          items: [
            {
              id: 1,
              full_name: 'nestjs/nest',
              name: 'nest',
              description: 'fw',
              html_url: 'https://github.com/nestjs/nest',
              stargazers_count: 10,
              forks_count: 2,
              language: 'TypeScript',
              owner: { login: 'nestjs', avatar_url: 'a' },
            },
          ],
        },
      }),
    );

    const result = await client.searchRepositories('nestjs');
    expect(result.total).toBe(1);
    expect(result.items[0]?.fullName).toBe('nestjs/nest');
    expect(client.getRateLimit().remaining).toBe(4999);
  });

  it('uses cache on repeated GET', async () => {
    request.mockReturnValue(
      of({
        status: 200,
        headers: {},
        data: {
          total_count: 0,
          incomplete_results: false,
          items: [],
        },
      }),
    );

    await client.searchRepositories('x');
    await client.searchRepositories('x');
    expect(request).toHaveBeenCalledTimes(1);
  });

  it('maps 404 to GitHubNotFoundError', async () => {
    const error = new AxiosError('Not Found');
    error.response = {
      status: 404,
      statusText: 'Not Found',
      headers: new AxiosHeaders(),
      config: { headers: new AxiosHeaders() },
      data: {},
    };
    request.mockReturnValue(throwError(() => error));

    await expect(client.getRepository('a', 'b')).rejects.toBeInstanceOf(
      GitHubNotFoundError,
    );
  });

  it('maps rate limit to GitHubRateLimitError', async () => {
    const error = new AxiosError('Rate limit');
    error.response = {
      status: 403,
      statusText: 'Forbidden',
      headers: AxiosHeaders.from({
        'x-ratelimit-remaining': '0',
        'x-ratelimit-reset': '1700000000',
      }),
      config: { headers: new AxiosHeaders() },
      data: {},
    };
    request.mockReturnValue(throwError(() => error));

    await expect(client.getRepository('a', 'b')).rejects.toBeInstanceOf(
      GitHubRateLimitError,
    );
  });
});
