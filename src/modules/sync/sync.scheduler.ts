import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { SyncService } from './sync.service';

@Injectable()
export class SyncScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SyncScheduler.name);
  private readonly jobName = 'repository-sync';

  constructor(
    private readonly config: ConfigService,
    private readonly syncService: SyncService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const enabled = this.config.get<boolean>('sync.enabled') ?? true;
    if (!enabled) {
      this.logger.log('Background sync disabled (SYNC_ENABLED=false)');
      return;
    }

    const expression = this.config.get<string>('sync.cron') ?? '0 */6 * * *';
    const job = new CronJob(expression, () => {
      void this.syncService.runAll();
    });

    this.schedulerRegistry.addCronJob(this.jobName, job);
    job.start();
    this.logger.log(`Background sync scheduled with cron "${expression}"`);
  }

  onModuleDestroy() {
    try {
      this.schedulerRegistry.deleteCronJob(this.jobName);
    } catch {
      return;
    }
  }
}
