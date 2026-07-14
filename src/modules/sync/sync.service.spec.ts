import { ConfigService } from '@nestjs/config';
import { GitHubClient } from '../../infrastructure/github/github.client';
import { FirestoreService } from '../../infrastructure/firestore/firestore.service';
import { RepositoriesFirestoreRepository } from '../../infrastructure/firestore/repositories.repository';
import { RepositoriesService } from '../repositories/repositories.service';
import { SavedRepository } from '../repositories/domain/repository.types';
import { SyncService } from './sync.service';

describe('SyncService', () => {
  const config = {
    get: (key: string) => {
      const map: Record<string, unknown> = {
        'sync.concurrency': 2,
        'sync.minIntervalMinutes': 30,
      };
      return map[key];
    },
  };
  const firestore = { isConfigured: jest.fn() };
  const repositoryStore = { findAllForSync: jest.fn() };
  const repositoriesService = { syncExisting: jest.fn() };
  const github = { getRateLimit: jest.fn().mockReturnValue({ remaining: 100 }) };

  const service = new SyncService(
    config as unknown as ConfigService,
    firestore as unknown as FirestoreService,
    repositoryStore as unknown as RepositoriesFirestoreRepository,
    repositoriesService as unknown as RepositoriesService,
    github as unknown as GitHubClient,
  );

  const freshRepo = (overrides: Partial<SavedRepository> = {}): SavedRepository => ({
    id: 'demo-user_nestjs_nest',
    userId: 'demo-user',
    githubId: 1,
    owner: 'nestjs',
    ownerAvatarUrl: 'a',
    name: 'nest',
    fullName: 'nestjs/nest',
    description: null,
    htmlUrl: 'https://github.com/nestjs/nest',
    defaultBranch: 'master',
    primaryLanguage: 'TypeScript',
    languages: {},
    topics: [],
    license: null,
    stars: 1,
    forks: 0,
    watchers: 1,
    openIssues: 0,
    isFork: false,
    favorited: false,
    contributors: [],
    releases: [],
    recentCommits: [],
    commitActivity: [],
    lastSyncedAt: new Date().toISOString(),
    syncStatus: 'idle',
    lastSyncError: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
    firestore.isConfigured.mockReturnValue(true);
  });

  it('returns early when firestore is not configured', async () => {
    firestore.isConfigured.mockReturnValue(false);
    const result = await service.runAll();
    expect(result.failed).toBe(0);
    expect(result.errors[0]?.message).toMatch(/not configured/i);
    expect(repositoryStore.findAllForSync).not.toHaveBeenCalled();
  });

  it('skips repos synced within the min interval', async () => {
    repositoryStore.findAllForSync.mockResolvedValue([freshRepo()]);
    const result = await service.runAll();
    expect(result.skipped).toBe(1);
    expect(result.synced).toBe(0);
    expect(repositoriesService.syncExisting).not.toHaveBeenCalled();
  });

  it('syncs due repositories and continues after failures', async () => {
    const due = freshRepo({
      id: 'a',
      fullName: 'a/b',
      lastSyncedAt: '2020-01-01T00:00:00.000Z',
    });
    const dueFail = freshRepo({
      id: 'c',
      fullName: 'c/d',
      lastSyncedAt: '2020-01-01T00:00:00.000Z',
    });
    repositoryStore.findAllForSync.mockResolvedValue([due, dueFail]);
    repositoriesService.syncExisting
      .mockResolvedValueOnce(due)
      .mockRejectedValueOnce(new Error('boom'));

    const result = await service.runAll({ force: true });
    expect(result.synced).toBe(1);
    expect(result.failed).toBe(1);
    expect(result.errors).toHaveLength(1);
    expect(repositoriesService.syncExisting).toHaveBeenCalledTimes(2);
  });

  it('exposes status from last run', async () => {
    repositoryStore.findAllForSync.mockResolvedValue([]);
    await service.runAll();
    const status = service.getStatus();
    expect(status.running).toBe(false);
    expect(status.lastRun?.total).toBe(0);
  });
});
