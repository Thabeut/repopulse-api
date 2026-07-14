import { NotFoundException } from '@nestjs/common';
import { RepositoriesFirestoreRepository } from '../../infrastructure/firestore/repositories.repository';
import { SnapshotsFirestoreRepository } from '../../infrastructure/firestore/snapshots.repository';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const repositories = {
    findById: jest.fn(),
    findMany: jest.fn(),
  };
  const snapshots = {
    findByRepositoryId: jest.fn(),
  };

  const service = new AnalyticsService(
    repositories as unknown as RepositoriesFirestoreRepository,
    snapshots as unknown as SnapshotsFirestoreRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns history series for owned repo', async () => {
    repositories.findById.mockResolvedValue({
      id: 'demo-user_a_b',
      userId: 'demo-user',
    });
    snapshots.findByRepositoryId.mockResolvedValue([
      {
        capturedAt: '2026-01-01T00:00:00.000Z',
        stars: 5,
        forks: 1,
        watchers: 1,
        openIssues: 0,
      },
    ]);

    await expect(
      service.getHistory('demo-user', 'demo-user_a_b', {
        metric: 'stars',
      }),
    ).resolves.toEqual({
      metric: 'stars',
      series: [{ t: '2026-01-01T00:00:00.000Z', v: 5 }],
    });
  });

  it('returns empty series when no snapshots', async () => {
    repositories.findById.mockResolvedValue({
      id: 'demo-user_a_b',
      userId: 'demo-user',
    });
    snapshots.findByRepositoryId.mockResolvedValue([]);

    await expect(
      service.getHistory('demo-user', 'demo-user_a_b', {
        metric: 'forks',
      }),
    ).resolves.toEqual({ metric: 'forks', series: [] });
  });

  it('throws when repository is not owned', async () => {
    repositories.findById.mockResolvedValue({
      id: 'other',
      userId: 'someone-else',
    });
    await expect(
      service.getLanguages('demo-user', 'other'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns language distribution for owned repo', async () => {
    repositories.findById.mockResolvedValue({
      id: 'demo-user_a_b',
      userId: 'demo-user',
      languages: { TypeScript: 80, JavaScript: 20 },
    });
    await expect(
      service.getLanguages('demo-user', 'demo-user_a_b'),
    ).resolves.toEqual({
      languages: [
        { name: 'TypeScript', bytes: 80, percent: 80 },
        { name: 'JavaScript', bytes: 20, percent: 20 },
      ],
    });
  });

  it('returns commit activity for owned repo', async () => {
    repositories.findById.mockResolvedValue({
      id: 'demo-user_a_b',
      userId: 'demo-user',
      commitActivity: [1, 2, 3],
    });
    await expect(
      service.getCommitActivity('demo-user', 'demo-user_a_b'),
    ).resolves.toEqual({ activity: [1, 2, 3] });
  });

  it('builds dashboard aggregates', async () => {
    repositories.findMany.mockResolvedValue({
      total: 2,
      items: [
        {
          id: '1',
          fullName: 'a/b',
          stars: 10,
          favorited: true,
          lastSyncedAt: '2026-01-01T00:00:00.000Z',
        },
        {
          id: '2',
          fullName: 'c/d',
          stars: 5,
          favorited: false,
          lastSyncedAt: null,
        },
      ],
    });

    await expect(service.getDashboard('demo-user')).resolves.toEqual({
      repositoryCount: 2,
      favoriteCount: 1,
      totalStars: 15,
      recentlySynced: [
        {
          id: '1',
          fullName: 'a/b',
          lastSyncedAt: '2026-01-01T00:00:00.000Z',
          stars: 10,
        },
      ],
    });
  });
});
