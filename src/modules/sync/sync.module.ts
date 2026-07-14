import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { GitHubModule } from '../../infrastructure/github/github.module';
import { RepositoriesModule } from '../repositories/repositories.module';
import { SyncController } from './sync.controller';
import { SyncScheduler } from './sync.scheduler';
import { SyncService } from './sync.service';

@Module({
  imports: [ScheduleModule.forRoot(), GitHubModule, RepositoriesModule],
  controllers: [SyncController],
  providers: [SyncService, SyncScheduler],
  exports: [SyncService],
})
export class SyncModule {}
