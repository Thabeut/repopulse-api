import { Injectable } from '@nestjs/common';
import { QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { SavedRepository } from '../../modules/repositories/domain/repository.types';
import { COLLECTIONS } from './firestore.constants';
import { FirestoreService } from './firestore.service';
import { buildRepositoryDocId, nowIso } from './firestore.utils';

export interface ListRepositoriesParams {
  userId: string;
  page: number;
  limit: number;
  q?: string;
  language?: string;
  favorited?: boolean;
  sort?: 'updatedAt' | 'stars' | 'forks' | 'name' | 'createdAt';
  order?: 'asc' | 'desc';
}

@Injectable()
export class RepositoriesFirestoreRepository {
  constructor(private readonly firestoreService: FirestoreService) {}

  async create(
    data: Omit<SavedRepository, 'createdAt' | 'updatedAt'>,
  ): Promise<SavedRepository> {
    const db = this.firestoreService.getDb();
    const now = nowIso();
    const entity: SavedRepository = {
      ...data,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection(COLLECTIONS.repositories).doc(entity.id).set(entity);
    return entity;
  }

  async upsert(entity: SavedRepository): Promise<SavedRepository> {
    const db = this.firestoreService.getDb();
    const updated: SavedRepository = {
      ...entity,
      updatedAt: nowIso(),
    };
    await db.collection(COLLECTIONS.repositories).doc(updated.id).set(updated, {
      merge: true,
    });
    return updated;
  }

  async findById(id: string): Promise<SavedRepository | null> {
    const db = this.firestoreService.getDb();
    const snap = await db.collection(COLLECTIONS.repositories).doc(id).get();
    if (!snap.exists) {
      return null;
    }
    return snap.data() as SavedRepository;
  }

  async findByOwnerName(
    userId: string,
    owner: string,
    name: string,
  ): Promise<SavedRepository | null> {
    return this.findById(buildRepositoryDocId(userId, owner, name));
  }

  async delete(id: string): Promise<void> {
    const db = this.firestoreService.getDb();
    await db.collection(COLLECTIONS.repositories).doc(id).delete();
  }

  async findMany(
    params: ListRepositoriesParams,
  ): Promise<{ items: SavedRepository[]; total: number }> {
    const db = this.firestoreService.getDb();
    const snapshot = await db
      .collection(COLLECTIONS.repositories)
      .where('userId', '==', params.userId)
      .get();

    let items = snapshot.docs.map(
      (doc: QueryDocumentSnapshot) => doc.data() as SavedRepository,
    );

    if (params.favorited !== undefined) {
      items = items.filter((item) => item.favorited === params.favorited);
    }

    if (params.language) {
      items = items.filter((item) => item.primaryLanguage === params.language);
    }

    if (params.q) {
      const needle = params.q.toLowerCase();
      items = items.filter(
        (item) =>
          item.fullName.toLowerCase().includes(needle) ||
          (item.description ?? '').toLowerCase().includes(needle),
      );
    }

    const sortField = params.sort ?? 'updatedAt';
    const order = params.order ?? 'desc';
    const direction = order === 'asc' ? 1 : -1;
    items = [...items].sort((a, b) => {
      const left = a[sortField];
      const right = b[sortField];
      if (left === right) return 0;
      if (left == null) return 1;
      if (right == null) return -1;
      if (typeof left === 'number' && typeof right === 'number') {
        return (left - right) * direction;
      }
      return String(left).localeCompare(String(right)) * direction;
    });

    const total = items.length;
    const start = (params.page - 1) * params.limit;
    items = items.slice(start, start + params.limit);

    return { items, total };
  }

  async findAllForSync(limit = 500): Promise<SavedRepository[]> {
    const db = this.firestoreService.getDb();
    const snapshot = await db
      .collection(COLLECTIONS.repositories)
      .limit(limit)
      .get();
    return snapshot.docs.map(
      (doc: QueryDocumentSnapshot) => doc.data() as SavedRepository,
    );
  }
}
