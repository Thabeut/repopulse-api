import {
  buildHistorySeries,
  buildLanguageDistribution,
} from './analytics.utils';
import { RepositorySnapshot } from '../repositories/domain/repository.types';

describe('analytics.utils', () => {
  it('builds history series for a metric', () => {
    const snapshots: RepositorySnapshot[] = [
      {
        id: '1',
        repositoryId: 'r1',
        userId: 'u1',
        fullName: 'a/b',
        stars: 10,
        forks: 1,
        watchers: 2,
        openIssues: 3,
        capturedAt: '2026-01-01T00:00:00.000Z',
        source: 'save',
      },
      {
        id: '2',
        repositoryId: 'r1',
        userId: 'u1',
        fullName: 'a/b',
        stars: 12,
        forks: 1,
        watchers: 2,
        openIssues: 4,
        capturedAt: '2026-01-02T00:00:00.000Z',
        source: 'cron',
      },
    ];

    expect(buildHistorySeries(snapshots, 'stars')).toEqual([
      { t: '2026-01-01T00:00:00.000Z', v: 10 },
      { t: '2026-01-02T00:00:00.000Z', v: 12 },
    ]);
    expect(buildHistorySeries([], 'forks')).toEqual([]);
  });

  it('builds language distribution percentages', () => {
    const languages = buildLanguageDistribution({
      TypeScript: 750,
      JavaScript: 250,
    });
    expect(languages).toEqual([
      { name: 'TypeScript', bytes: 750, percent: 75 },
      { name: 'JavaScript', bytes: 250, percent: 25 },
    ]);
    expect(
      languages.reduce((sum, item) => sum + item.percent, 0),
    ).toBeCloseTo(100);
  });

  it('returns empty language distribution for empty map', () => {
    expect(buildLanguageDistribution({})).toEqual([]);
  });
});
