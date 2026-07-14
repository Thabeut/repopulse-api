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
import { FirebaseAuthGuard } from '../src/modules/auth/firebase-auth.guard';
import { AuthUser } from '../src/modules/auth/auth.types';

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
    findByRepositoryId: jest.fn(),
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
      .overrideGuard(FirebaseAuthGuard)
      .useValue({
        canActivate: (context: {
          switchToHttp: () => {
            getRequest: () => { user?: AuthUser };
          };
        }) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            uid: 'demo-user',
            email: 'demo@example.com',
            name: 'Demo',
            picture: null,
          };
          return true;
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/v1/health remains public', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/health')
      .expect(200);

    expect(response.body.success).toBe(true);
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
      .send({ owner: 'nestjs', name: 'nest' })
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.fullName).toBe('nestjs/nest');
  });

  it('GET /api/v1/analytics/repositories/:id/history returns series', async () => {
    repositories.findById.mockResolvedValue({
      id: 'demo-user_nestjs_nest',
      userId: 'demo-user',
      languages: { TypeScript: 80, JavaScript: 20 },
      commitActivity: [1, 2, 3],
    });
    snapshots.findByRepositoryId.mockResolvedValue([
      {
        capturedAt: '2026-01-01T00:00:00.000Z',
        stars: 10,
        forks: 1,
        watchers: 1,
        openIssues: 0,
      },
      {
        capturedAt: '2026-01-02T00:00:00.000Z',
        stars: 12,
        forks: 1,
        watchers: 1,
        openIssues: 0,
      },
    ]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/analytics/repositories/demo-user_nestjs_nest/history')
      .query({ metric: 'stars' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.series).toHaveLength(2);
  });

  it('GET /api/v1/analytics/repositories/:id/history returns empty array when none', async () => {
    repositories.findById.mockResolvedValue({
      id: 'demo-user_nestjs_nest',
      userId: 'demo-user',
    });
    snapshots.findByRepositoryId.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/analytics/repositories/demo-user_nestjs_nest/history')
      .query({ metric: 'forks' })
      .expect(200);

    expect(response.body.data.series).toEqual([]);
  });

  it('GET /api/v1/auth/me returns the authenticated user', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(200);

    expect(response.body.data.uid).toBe('demo-user');
  });

  it('PATCH /api/v1/repositories/:id/favorite updates favorite', async () => {
    repositories.findById.mockResolvedValue({
      id: 'demo-user_nestjs_nest',
      userId: 'demo-user',
      favorited: false,
      fullName: 'nestjs/nest',
    });
    repositories.upsert.mockImplementation(async (entity) => entity);

    const response = await request(app.getHttpServer())
      .patch('/api/v1/repositories/demo-user_nestjs_nest/favorite')
      .send({ favorited: true })
      .expect(200);

    expect(response.body.data.favorited).toBe(true);
  });

  it('DELETE /api/v1/repositories/:id removes repo and snapshots', async () => {
    repositories.findById.mockResolvedValue({
      id: 'demo-user_nestjs_nest',
      userId: 'demo-user',
    });
    snapshots.deleteByRepositoryId.mockResolvedValue(1);
    repositories.delete.mockResolvedValue(undefined);

    await request(app.getHttpServer())
      .delete('/api/v1/repositories/demo-user_nestjs_nest')
      .expect(200);

    expect(snapshots.deleteByRepositoryId).toHaveBeenCalledWith(
      'demo-user_nestjs_nest',
    );
    expect(repositories.delete).toHaveBeenCalledWith('demo-user_nestjs_nest');
  });

  it('GET /api/v1/analytics/dashboard returns aggregates', async () => {
    repositories.findMany.mockResolvedValue({
      total: 1,
      items: [
        {
          id: '1',
          fullName: 'a/b',
          stars: 10,
          favorited: true,
          lastSyncedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/analytics/dashboard')
      .expect(200);

    expect(response.body.data.repositoryCount).toBe(1);
    expect(response.body.data.totalStars).toBe(10);
  });

  it('GET /api/v1/sync/status returns sync status payload', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/sync/status')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual(
      expect.objectContaining({
        running: expect.any(Boolean),
      }),
    );
  });
});
