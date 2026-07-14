import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { buildPaginationMeta } from '../../common/utils/pagination.util';
import { GitHubClient } from '../../infrastructure/github/github.client';
import { NormalizedRepository } from '../../infrastructure/github/github.types';
import { RepositoriesFirestoreRepository } from '../../infrastructure/firestore/repositories.repository';
import { SnapshotsFirestoreRepository } from '../../infrastructure/firestore/snapshots.repository';
import { buildRepositoryDocId, nowIso } from '../../infrastructure/firestore/firestore.utils';
import {
  SavedRepository,
  SnapshotSource,
} from './domain/repository.types';
import {
  FavoriteRepositoryDto,
  ListRepositoriesQueryDto,
  LookupRepositoryQueryDto,
  SaveRepositoryDto,
  SearchRepositoriesQueryDto,
} from './dto/repositories.dto';

@Injectable()
export class RepositoriesService {
  constructor(
    private readonly github: GitHubClient,
    private readonly repositories: RepositoriesFirestoreRepository,
    private readonly snapshots: SnapshotsFirestoreRepository,
    private readonly config: ConfigService,
  ) {}

  search(query: SearchRepositoriesQueryDto) {
    return this.github.searchRepositories(query.q, query.page, query.perPage);
  }

  async preview(query: LookupRepositoryQueryDto) {
    return this.github.fetchFullRepository(query.owner, query.name);
  }

  async save(userId: string, dto: SaveRepositoryDto): Promise<SavedRepository> {
    const normalized = await this.github.fetchFullRepository(
      dto.owner,
      dto.name,
      { bypassCache: true },
    );
    return this.persistNormalized(userId, normalized, 'save');
  }

  async list(userId: string, query: ListRepositoriesQueryDto) {
    const { items, total } = await this.repositories.findMany({
      userId,
      page: query.page,
      limit: query.limit,
      q: query.q,
      language: query.language,
      favorited: query.favorited,
      sort: query.sort,
      order: query.order,
    });

    return {
      data: items,
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async getById(userId: string, id: string): Promise<SavedRepository> {
    const repo = await this.repositories.findById(id);
    if (!repo || repo.userId !== userId) {
      throw new NotFoundException('Repository not found');
    }
    return repo;
  }

  async getByFullName(
    userId: string,
    owner: string,
    name: string,
  ): Promise<SavedRepository> {
    const repo = await this.repositories.findByOwnerName(userId, owner, name);
    if (!repo) {
      throw new NotFoundException('Repository not found');
    }
    return repo;
  }

  async refresh(userId: string, id: string): Promise<SavedRepository> {
    const existing = await this.getById(userId, id);
    return this.syncExisting(existing, 'manual');
  }

  async syncExisting(
    existing: SavedRepository,
    source: SnapshotSource,
  ): Promise<SavedRepository> {
    await this.repositories.upsert({
      ...existing,
      syncStatus: 'syncing',
      lastSyncError: null,
    });

    try {
      const normalized = await this.github.fetchFullRepository(
        existing.owner,
        existing.name,
        { bypassCache: true },
      );
      return this.persistNormalized(
        existing.userId,
        normalized,
        source,
        existing,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sync failed';
      await this.repositories.upsert({
        ...existing,
        syncStatus: 'error',
        lastSyncError: message,
      });
      throw error;
    }
  }

  async setFavorite(
    userId: string,
    id: string,
    dto: FavoriteRepositoryDto,
  ): Promise<SavedRepository> {
    const existing = await this.getById(userId, id);
    return this.repositories.upsert({
      ...existing,
      favorited: dto.favorited,
    });
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.getById(userId, id);
    await this.snapshots.deleteByRepositoryId(id);
    await this.repositories.delete(id);
  }

  private async persistNormalized(
    userId: string,
    normalized: NormalizedRepository,
    source: SnapshotSource,
    previous?: SavedRepository,
  ): Promise<SavedRepository> {
    const id = buildRepositoryDocId(
      userId,
      normalized.owner,
      normalized.name,
    );
    const now = nowIso();

    const existingDoc =
      previous ?? (await this.repositories.findById(id));

    const entity: SavedRepository = {
      id,
      userId,
      githubId: normalized.githubId,
      owner: normalized.owner,
      ownerAvatarUrl: normalized.ownerAvatarUrl,
      name: normalized.name,
      fullName: normalized.fullName,
      description: normalized.description,
      htmlUrl: normalized.htmlUrl,
      defaultBranch: normalized.defaultBranch,
      primaryLanguage: normalized.primaryLanguage,
      languages: normalized.languages,
      topics: normalized.topics,
      license: normalized.license,
      stars: normalized.stars,
      forks: normalized.forks,
      watchers: normalized.watchers,
      openIssues: normalized.openIssues,
      isFork: normalized.isFork,
      favorited: existingDoc?.favorited ?? false,
      contributors: normalized.contributors,
      releases: normalized.releases,
      recentCommits: normalized.recentCommits,
      commitActivity: normalized.commitActivity,
      lastSyncedAt: now,
      syncStatus: 'idle',
      lastSyncError: null,
      createdAt: existingDoc?.createdAt ?? now,
      updatedAt: now,
    };

    const saved = existingDoc
      ? await this.repositories.upsert(entity)
      : await this.repositories.create(entity);
    await this.snapshots.create({
      repositoryId: saved.id,
      userId,
      fullName: saved.fullName,
      stars: saved.stars,
      forks: saved.forks,
      watchers: saved.watchers,
      openIssues: saved.openIssues,
      source,
    });

    const retention =
      this.config.get<number>('snapshotRetention') ?? 90;
    await this.snapshots.pruneOlderThan(saved.id, retention);

    return saved;
  }
}
