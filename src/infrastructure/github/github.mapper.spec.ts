import { mapRepository, mapSearchItem } from './github.mapper';
import {
  GitHubCommitRaw,
  GitHubContributorRaw,
  GitHubReleaseRaw,
  GitHubRepoRaw,
  GitHubSearchItemRaw,
} from './github.types';

describe('github.mapper', () => {
  it('maps search item fields', () => {
    const raw: GitHubSearchItemRaw = {
      id: 1,
      full_name: 'vercel/next.js',
      name: 'next.js',
      description: 'desc',
      html_url: 'https://github.com/vercel/next.js',
      stargazers_count: 100,
      forks_count: 10,
      language: 'JavaScript',
      owner: { login: 'vercel', avatar_url: 'https://avatar' },
    };

    expect(mapSearchItem(raw)).toEqual({
      githubId: 1,
      fullName: 'vercel/next.js',
      name: 'next.js',
      description: 'desc',
      htmlUrl: 'https://github.com/vercel/next.js',
      stars: 100,
      forks: 10,
      language: 'JavaScript',
      owner: 'vercel',
      ownerAvatarUrl: 'https://avatar',
    });
  });

  it('maps full repository and clamps lists', () => {
    const repo: GitHubRepoRaw = {
      id: 42,
      name: 'nest',
      full_name: 'nestjs/nest',
      description: 'A progressive Node.js framework',
      html_url: 'https://github.com/nestjs/nest',
      default_branch: 'master',
      language: 'TypeScript',
      stargazers_count: 50,
      forks_count: 5,
      watchers_count: 50,
      subscribers_count: 20,
      open_issues_count: 3,
      fork: false,
      topics: ['nodejs'],
      license: { spdx_id: 'MIT', name: 'MIT License' },
      owner: { login: 'nestjs', avatar_url: 'https://avatar' },
    };

    const contributors: GitHubContributorRaw[] = Array.from(
      { length: 30 },
      (_, i) => ({
        login: `u${i}`,
        avatar_url: 'a',
        contributions: i,
        html_url: 'h',
      }),
    );

    const releases: GitHubReleaseRaw[] = [
      {
        tag_name: 'v1.0.0',
        name: 'One',
        published_at: '2026-01-01T00:00:00Z',
        html_url: 'https://release',
      },
    ];

    const commits: GitHubCommitRaw[] = [
      {
        sha: 'abc123',
        html_url: 'https://commit',
        commit: {
          message: 'feat: hello\n\nbody',
          author: { name: 'Dev', date: '2026-01-02T00:00:00Z' },
        },
        author: { login: 'dev' },
      },
    ];

    const mapped = mapRepository({
      repo,
      languages: { TypeScript: 1000 },
      contributors,
      releases,
      commits,
      commitActivity: [{ days: [], total: 7, week: 1 }],
    });

    expect(mapped.githubId).toBe(42);
    expect(mapped.stars).toBe(50);
    expect(mapped.watchers).toBe(20);
    expect(mapped.license).toBe('MIT');
    expect(mapped.contributors).toHaveLength(25);
    expect(mapped.recentCommits[0]?.message).toBe('feat: hello');
    expect(mapped.commitActivity).toEqual([7]);
  });
});
