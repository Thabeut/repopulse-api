import { CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/common/configure-app';
import { FirestoreService } from '../src/infrastructure/firestore/firestore.service';
import { FirebaseAuthGuard } from '../src/modules/auth/firebase-auth.guard';
import request from 'supertest';

class RejectAuthGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    throw new UnauthorizedException('Authorization Bearer token is required');
  }
}

describe('Auth protection (e2e)', () => {
  it('rejects protected routes without auth', async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirestoreService)
      .useValue({
        isConfigured: () => true,
        ping: async () => 'up' as const,
        getDb: () => ({}),
      })
      .overrideGuard(FirebaseAuthGuard)
      .useClass(RejectAuthGuard)
      .compile();

    const app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();

    const response = await request(app.getHttpServer())
      .post('/api/v1/repositories')
      .send({ owner: 'nestjs', name: 'nest' })
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.statusCode).toBe(401);

    await app.close();
  });
});
