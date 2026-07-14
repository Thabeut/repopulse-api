import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { GitHubClient } from '../src/infrastructure/github/github.client';
import { RepositoriesFirestoreRepository } from '../src/infrastructure/firestore/repositories.repository';
import { SnapshotsFirestoreRepository } from '../src/infrastructure/firestore/snapshots.repository';
import { FirestoreService } from '../src/infrastructure/firestore/firestore.service';

describe('API contracts (e2e)', () => {
  let app: INestApplication<App>;

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

  beforeEach(async () => {
    jest.clearAllMocks();
    repositories.findMany.mockResolvedValue({ items: [], total: 0 });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(GitHubClient)
      .useValue(github)
      .overrideProvider(RepositoriesFirestoreRepository)
      .useValue(repositories)
      .overrideProvider(SnapshotsFirestoreRepository)
      .useValue(snapshots)
      .overrideProvider(FirestoreService)
      .useValue({
        isConfigured: () => true,
        ping: async () => 'up' as const,
        getDb: () => ({}),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health returns success envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toMatch(/ok|degraded/);
    expect(response.body.data.firestore).toMatch(/up|down|unconfigured/);
  });

  it('GET /api/v1/repositories returns empty list with meta', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/repositories')
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });
  });

  it('GET /api/v1/repositories rejects invalid pagination', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/repositories')
      .query({ page: 0, limit: 999 })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.statusCode).toBe(400);
  });

  it('GET /api/v1/search/repositories returns normalized search results', async () => {
    github.searchRepositories.mockResolvedValue({
      total: 1,
      items: [
        {
          githubId: 1,
          fullName: 'nestjs/nest',
          name: 'nest',
          description: 'fw',
          htmlUrl: 'https://github.com/nestjs/nest',
          stars: 1,
          forks: 0,
          language: 'TypeScript',
          owner: 'nestjs',
          ownerAvatarUrl: 'a',
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/search/repositories')
      .query({ q: 'nestjs' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items[0].fullName).toBe('nestjs/nest');
  });

  it('POST /api/v1/repositories saves a repository', async () => {
    github.fetchFullRepository.mockResolvedValue({
      githubId: 1,
      owner: 'nestjs',
      ownerAvatarUrl: 'a',
      name: 'nest',
      fullName: 'nestjs/nest',
      description: 'fw',
      htmlUrl: 'https://github.com/nestjs/nest',
      defaultBranch: 'master',
      primaryLanguage: 'TypeScript',
      languages: {},
      topics: [],
      license: 'MIT',
      stars: 10,
      forks: 1,
      watchers: 2,
      openIssues: 0,
      isFork: false,
      contributors: [],
      releases: [],
      recentCommits: [],
      commitActivity: [],
    });
    repositories.findById.mockResolvedValue(null);
    repositories.create.mockImplementation(async (entity) => entity);
    snapshots.create.mockResolvedValue({});
    snapshots.pruneOlderThan.mockResolvedValue(0);

    const response = await request(app.getHttpServer())
      .post('/api/v1/repositories')
      .set('x-user-id', 'demo-user')
      .send({ owner: 'nestjs', name: 'nest' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.fullName).toBe('nestjs/nest');
    expect(snapshots.create).toHaveBeenCalled();
  });
});
