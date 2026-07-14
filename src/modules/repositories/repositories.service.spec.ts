import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GitHubClient } from '../../infrastructure/github/github.client';
import { RepositoriesFirestoreRepository } from '../../infrastructure/firestore/repositories.repository';
import { SnapshotsFirestoreRepository } from '../../infrastructure/firestore/snapshots.repository';
import { RepositoriesService } from './repositories.service';
import { SavedRepository } from './domain/repository.types';

describe('RepositoriesService', () => {
  const github = {
    searchRepositories: jest.fn(),
    fetchFullRepository: jest.fn(),
  };
  const repositories = {
    findMany: jest.fn(),
    findById: jest.fn(),
    findByOwnerName: jest.fn(),
    create: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
  };
  const snapshots = {
    create: jest.fn(),
    deleteByRepositoryId: jest.fn(),
    pruneOlderThan: jest.fn(),
  };
  const config = {
    get: jest.fn().mockReturnValue(90),
  };

  const service = new RepositoriesService(
    github as unknown as GitHubClient,
    repositories as unknown as RepositoriesFirestoreRepository,
    snapshots as unknown as SnapshotsFirestoreRepository,
    config as unknown as ConfigService,
  );

  const normalized = {
    githubId: 1,
    owner: 'nestjs',
    ownerAvatarUrl: 'a',
    name: 'nest',
    fullName: 'nestjs/nest',
    description: 'fw',
    htmlUrl: 'https://github.com/nestjs/nest',
    defaultBranch: 'master',
    primaryLanguage: 'TypeScript',
    languages: { TypeScript: 1 },
    topics: ['nodejs'],
    license: 'MIT',
    stars: 10,
    forks: 2,
    watchers: 3,
    openIssues: 1,
    isFork: false,
    contributors: [],
    releases: [],
    recentCommits: [],
    commitActivity: [1, 2],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('searches via GitHub client', async () => {
    github.searchRepositories.mockResolvedValue({ total: 1, items: [] });
    await expect(
      service.search({ q: 'nest', page: 1, perPage: 20 }),
    ).resolves.toEqual({ total: 1, items: [] });
  });

  it('saves a new repository and writes a snapshot', async () => {
    github.fetchFullRepository.mockResolvedValue(normalized);
    repositories.findById.mockResolvedValue(null);
    repositories.create.mockImplementation(async (entity: SavedRepository) => entity);
    snapshots.create.mockResolvedValue({});
    snapshots.pruneOlderThan.mockResolvedValue(0);

    const saved = await service.save('demo-user', {
      owner: 'nestjs',
      name: 'nest',
    });

    expect(saved.id).toBe('demo-user_nestjs_nest');
    expect(saved.userId).toBe('demo-user');
    expect(repositories.create).toHaveBeenCalled();
    expect(snapshots.create).toHaveBeenCalledWith(
      expect.objectContaining({
        repositoryId: 'demo-user_nestjs_nest',
        source: 'save',
        stars: 10,
      }),
    );
  });

  it('lists repositories with pagination meta', async () => {
    repositories.findMany.mockResolvedValue({ items: [], total: 0 });
    await expect(
      service.list('demo-user', { page: 1, limit: 20 }),
    ).resolves.toEqual({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('throws when repository is missing for user', async () => {
    repositories.findById.mockResolvedValue(null);
    await expect(service.getById('demo-user', 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('refreshes and writes a manual snapshot', async () => {
    const existing: SavedRepository = {
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
      favorited: true,
      contributors: [],
      releases: [],
      recentCommits: [],
      commitActivity: [],
      lastSyncedAt: null,
      syncStatus: 'idle',
      lastSyncError: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };

    repositories.findById.mockResolvedValue(existing);
    repositories.upsert.mockImplementation(async (entity: SavedRepository) => entity);
    github.fetchFullRepository.mockResolvedValue({ ...normalized, stars: 99 });
    snapshots.create.mockResolvedValue({});
    snapshots.pruneOlderThan.mockResolvedValue(0);

    const refreshed = await service.refresh(
      'demo-user',
      'demo-user_nestjs_nest',
    );

    expect(refreshed.stars).toBe(99);
    expect(refreshed.favorited).toBe(true);
    expect(snapshots.create).toHaveBeenCalledWith(
      expect.objectContaining({ source: 'manual', stars: 99 }),
    );
  });

  it('deletes repository and related snapshots', async () => {
    repositories.findById.mockResolvedValue({
      id: 'demo-user_nestjs_nest',
      userId: 'demo-user',
    });
    snapshots.deleteByRepositoryId.mockResolvedValue(2);
    repositories.delete.mockResolvedValue(undefined);

    await service.remove('demo-user', 'demo-user_nestjs_nest');
    expect(snapshots.deleteByRepositoryId).toHaveBeenCalledWith(
      'demo-user_nestjs_nest',
    );
    expect(repositories.delete).toHaveBeenCalledWith('demo-user_nestjs_nest');
  });

  it('sets favorite on owned repository', async () => {
    const existing: SavedRepository = {
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
      lastSyncedAt: null,
      syncStatus: 'idle',
      lastSyncError: null,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    repositories.findById.mockResolvedValue(existing);
    repositories.upsert.mockImplementation(async (entity: SavedRepository) => entity);

    const updated = await service.setFavorite('demo-user', existing.id, {
      favorited: true,
    });
    expect(updated.favorited).toBe(true);
    expect(repositories.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ favorited: true }),
    );
  });

  it('resolves repository by full name for owner', async () => {
    repositories.findByOwnerName.mockResolvedValue({
      id: 'demo-user_nestjs_nest',
      userId: 'demo-user',
      fullName: 'nestjs/nest',
    });
    await expect(
      service.getByFullName('demo-user', 'nestjs', 'nest'),
    ).resolves.toEqual(
      expect.objectContaining({ fullName: 'nestjs/nest' }),
    );
  });
});
