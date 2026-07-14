import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GitHubClient } from '../../infrastructure/github/github.client';
import { RepositoriesFirestoreRepository } from '../../infrastructure/firestore/repositories.repository';
import { FirestoreService } from '../../infrastructure/firestore/firestore.service';
import { SavedRepository } from '../repositories/domain/repository.types';
import { RepositoriesService } from '../repositories/repositories.service';
import { SyncRunResult, SyncStatusView } from './sync.types';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private running = false;
  private lastRun: SyncRunResult | null = null;

  constructor(
    private readonly config: ConfigService,
    private readonly firestore: FirestoreService,
    private readonly repositoryStore: RepositoriesFirestoreRepository,
    private readonly repositoriesService: RepositoriesService,
    private readonly github: GitHubClient,
  ) {}

  getStatus(): SyncStatusView {
    return {
      running: this.running,
      lastRun: this.lastRun,
    };
  }

  async runAll(options?: { force?: boolean; userId?: string }): Promise<SyncRunResult> {
    if (this.running) {
      this.logger.warn('Sync already running — skipping overlapping run');
      return (
        this.lastRun ?? {
          startedAt: new Date().toISOString(),
          finishedAt: new Date().toISOString(),
          total: 0,
          synced: 0,
          skipped: 0,
          failed: 0,
          errors: [{ repositoryId: '-', fullName: '-', message: 'Sync already running' }],
          rateLimitRemaining: this.github.getRateLimit().remaining,
        }
      );
    }

    if (!this.firestore.isConfigured()) {
      const empty: SyncRunResult = {
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString(),
        total: 0,
        synced: 0,
        skipped: 0,
        failed: 0,
        errors: [
          {
            repositoryId: '-',
            fullName: '-',
            message: 'Firestore is not configured',
          },
        ],
        rateLimitRemaining: this.github.getRateLimit().remaining,
      };
      this.lastRun = empty;
      return empty;
    }

    this.running = true;
    const startedAt = new Date().toISOString();
    const errors: SyncRunResult['errors'] = [];
    let synced = 0;
    let skipped = 0;
    let failed = 0;

    try {
      let repos = await this.repositoryStore.findAllForSync();
      if (options?.userId) {
        repos = repos.filter((repo) => repo.userId === options.userId);
      }

      const due = options?.force
        ? repos
        : repos.filter((repo) => this.isDue(repo));
      skipped = repos.length - due.length;

      const concurrency = Math.max(
        1,
        this.config.get<number>('sync.concurrency') ?? 2,
      );

      await this.mapPool(due, concurrency, async (repo) => {
        try {
          await this.repositoriesService.syncExisting(repo, 'cron');
          synced += 1;
        } catch (error) {
          failed += 1;
          errors.push({
            repositoryId: repo.id,
            fullName: repo.fullName,
            message: error instanceof Error ? error.message : 'Sync failed',
          });
          this.logger.warn(
            `Failed syncing ${repo.fullName}: ${
              error instanceof Error ? error.message : 'unknown'
            }`,
          );
        }
      });

      const result: SyncRunResult = {
        startedAt,
        finishedAt: new Date().toISOString(),
        total: repos.length,
        synced,
        skipped,
        failed,
        errors,
        rateLimitRemaining: this.github.getRateLimit().remaining,
      };
      this.lastRun = result;
      this.logger.log(
        `Sync done total=${result.total} synced=${result.synced} skipped=${result.skipped} failed=${result.failed}`,
      );
      return result;
    } finally {
      this.running = false;
    }
  }

  private isDue(repo: SavedRepository): boolean {
    const minInterval =
      this.config.get<number>('sync.minIntervalMinutes') ?? 30;
    if (!repo.lastSyncedAt) {
      return true;
    }
    const last = Date.parse(repo.lastSyncedAt);
    if (Number.isNaN(last)) {
      return true;
    }
    const ageMs = Date.now() - last;
    return ageMs >= minInterval * 60 * 1000;
  }

  private async mapPool<T>(
    items: T[],
    concurrency: number,
    worker: (item: T) => Promise<void>,
  ): Promise<void> {
    if (items.length === 0) {
      return;
    }

    let index = 0;
    const runners = Array.from(
      { length: Math.min(concurrency, items.length) },
      async () => {
        while (index < items.length) {
          const current = index;
          index += 1;
          await worker(items[current]);
        }
      },
    );
    await Promise.all(runners);
  }
}
