import { Injectable, NotFoundException } from '@nestjs/common';
import { RepositoriesFirestoreRepository } from '../../infrastructure/firestore/repositories.repository';
import { SnapshotsFirestoreRepository } from '../../infrastructure/firestore/snapshots.repository';
import { SavedRepository } from '../repositories/domain/repository.types';
import { HistoryQueryDto } from './dto/analytics.dto';
import {
  buildHistorySeries,
  buildLanguageDistribution,
} from './analytics.utils';

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly repositories: RepositoriesFirestoreRepository,
    private readonly snapshots: SnapshotsFirestoreRepository,
  ) {}

  async getHistory(userId: string, repositoryId: string, query: HistoryQueryDto) {
    await this.requireOwnedRepo(userId, repositoryId);
    const snapshots = await this.snapshots.findByRepositoryId(repositoryId, {
      from: query.from,
      to: query.to,
    });
    return {
      metric: query.metric,
      series: buildHistorySeries(snapshots, query.metric),
    };
  }

  async getLanguages(userId: string, repositoryId: string) {
    const repo = await this.requireOwnedRepo(userId, repositoryId);
    return {
      languages: buildLanguageDistribution(repo.languages ?? {}),
    };
  }

  async getCommitActivity(userId: string, repositoryId: string) {
    const repo = await this.requireOwnedRepo(userId, repositoryId);
    return {
      activity: repo.commitActivity ?? [],
    };
  }

  async getDashboard(userId: string) {
    const { items, total } = await this.repositories.findMany({
      userId,
      page: 1,
      limit: 100,
      sort: 'updatedAt',
      order: 'desc',
    });

    const favorites = items.filter((item) => item.favorited).length;
    const totalStars = items.reduce((sum, item) => sum + item.stars, 0);
    const recentlySynced = items
      .filter((item) => item.lastSyncedAt)
      .slice(0, 5)
      .map((item) => ({
        id: item.id,
        fullName: item.fullName,
        lastSyncedAt: item.lastSyncedAt,
        stars: item.stars,
      }));

    return {
      repositoryCount: total,
      favoriteCount: favorites,
      totalStars,
      recentlySynced,
    };
  }

  private async requireOwnedRepo(
    userId: string,
    repositoryId: string,
  ): Promise<SavedRepository> {
    const repo = await this.repositories.findById(repositoryId);
    if (!repo || repo.userId !== userId) {
      throw new NotFoundException('Repository not found');
    }
    return repo;
  }
}
