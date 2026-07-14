import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { FirestoreModule } from './infrastructure/firestore/firestore.module';
import { GitHubModule } from './infrastructure/github/github.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { RepositoriesModule } from './modules/repositories/repositories.module';
import { SyncModule } from './modules/sync/sync.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
      envFilePath: ['.env'],
    }),
    FirestoreModule,
    GitHubModule,
    HealthModule,
    AuthModule,
    RepositoriesModule,
    AnalyticsModule,
    SyncModule,
  ],
})
export class AppModule {}
