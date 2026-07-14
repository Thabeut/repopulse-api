import { NotFoundException } from '@nestjs/common';
import { RepositoriesFirestoreRepository } from '../../infrastructure/firestore/repositories.repository';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  const repositories = {
    findById: jest.fn(),
    findMany: jest.fn(),
  };

  const service = new AnalyticsService(
    repositories as unknown as RepositoriesFirestoreRepository,
  );

  beforeEach(() => {
    jest.clearAllMocks();
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

  it('throws when repo is missing', async () => {
    repositories.findById.mockResolvedValue(null);
    await expect(
      service.getLanguages('demo-user', 'missing'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('builds dashboard summary', async () => {
    repositories.findMany.mockResolvedValue({
      items: [
        {
          id: '1',
          favorited: true,
          stars: 10,
          lastSyncedAt: '2026-01-01T00:00:00.000Z',
          fullName: 'a/b',
        },
        {
          id: '2',
          favorited: false,
          stars: 5,
          lastSyncedAt: null,
          fullName: 'c/d',
        },
      ],
      total: 2,
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
