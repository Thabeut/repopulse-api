import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GitHubModule } from '../../infrastructure/github/github.module';
import { AuthModule } from '../auth/auth.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { SyncController } from './sync.controller';
import { SyncScheduler } from './sync.scheduler';
import { SyncService } from './sync.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    GitHubModule,
    RepositoriesModule,
    AuthModule,
  ],
  controllers: [SyncController],
  providers: [SyncService, SyncScheduler],
  exports: [SyncService],
})
export class SyncModule {}
