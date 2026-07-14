import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { SyncScheduler } from './sync.scheduler';
import { SyncService } from './sync.service';

describe('SyncScheduler', () => {
  const config = {
    get: jest.fn(),
  };
  const syncService = {
    runAll: jest.fn(),
  };
  const addCronJob = jest.fn();
  const deleteCronJob = jest.fn();
  const schedulerRegistry = {
    addCronJob,
    deleteCronJob,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('skips registration when sync is disabled', () => {
    config.get.mockImplementation((key: string) =>
      key === 'sync.enabled' ? false : undefined,
    );
    const scheduler = new SyncScheduler(
      config as unknown as ConfigService,
      syncService as unknown as SyncService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );

    scheduler.onModuleInit();
    expect(addCronJob).not.toHaveBeenCalled();
  });

  it('registers and starts a cron job when enabled', () => {
    config.get.mockImplementation((key: string) => {
      if (key === 'sync.enabled') return true;
      if (key === 'sync.cron') return '0 */6 * * *';
      return undefined;
    });
    const scheduler = new SyncScheduler(
      config as unknown as ConfigService,
      syncService as unknown as SyncService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );

    scheduler.onModuleInit();
    expect(addCronJob).toHaveBeenCalledWith(
      'repository-sync',
      expect.objectContaining({ start: expect.any(Function) }),
    );
    const job = addCronJob.mock.calls[0][1] as { stop: () => void };
    job.stop();
  });

  it('deletes the cron job on destroy', () => {
    const scheduler = new SyncScheduler(
      config as unknown as ConfigService,
      syncService as unknown as SyncService,
      schedulerRegistry as unknown as SchedulerRegistry,
    );
    scheduler.onModuleDestroy();
    expect(deleteCronJob).toHaveBeenCalledWith('repository-sync');
  });
});
