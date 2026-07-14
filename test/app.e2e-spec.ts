import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';

describe('API contracts (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

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
    expect(response.body.data.status).toBe('ok');
    expect(response.body.data.timestamp).toEqual(expect.any(String));
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
    expect(response.body.path).toContain('/api/v1/repositories');
  });
});
