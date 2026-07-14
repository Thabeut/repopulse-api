import { Injectable } from '@nestjs/common';
import { Query, QueryDocumentSnapshot } from 'firebase-admin/firestore';
import { RepositorySnapshot } from '../../modules/repositories/domain/repository.types';
import { COLLECTIONS } from './firestore.constants';
import { FirestoreService } from './firestore.service';
import { nowIso } from './firestore.utils';

@Injectable()
export class SnapshotsFirestoreRepository {
  constructor(private readonly firestoreService: FirestoreService) {}

  async create(
    data: Omit<RepositorySnapshot, 'id' | 'capturedAt'> & {
      id?: string;
      capturedAt?: string;
    },
  ): Promise<RepositorySnapshot> {
    const db = this.firestoreService.getDb();
    const ref = data.id
      ? db.collection(COLLECTIONS.repositorySnapshots).doc(data.id)
      : db.collection(COLLECTIONS.repositorySnapshots).doc();

    const entity: RepositorySnapshot = {
      id: ref.id,
      repositoryId: data.repositoryId,
      userId: data.userId,
      fullName: data.fullName,
      stars: data.stars,
      forks: data.forks,
      watchers: data.watchers,
      openIssues: data.openIssues,
      capturedAt: data.capturedAt ?? nowIso(),
      source: data.source,
    };

    await ref.set(entity);
    return entity;
  }

  async findByRepositoryId(
    repositoryId: string,
    options?: { from?: string; to?: string },
  ): Promise<RepositorySnapshot[]> {
    const db = this.firestoreService.getDb();
    let query: Query = db
      .collection(COLLECTIONS.repositorySnapshots)
      .where('repositoryId', '==', repositoryId)
      .orderBy('capturedAt', 'desc');

    if (options?.from) {
      query = query.where('capturedAt', '>=', options.from);
    }
    if (options?.to) {
      query = query.where('capturedAt', '<=', options.to);
    }

    const snapshot = await query.get();
    const items = snapshot.docs.map(
      (doc: QueryDocumentSnapshot) => doc.data() as RepositorySnapshot,
    );
    return items.reverse();
  }

  async deleteByRepositoryId(repositoryId: string): Promise<number> {
    const db = this.firestoreService.getDb();
    const snapshot = await db
      .collection(COLLECTIONS.repositorySnapshots)
      .where('repositoryId', '==', repositoryId)
      .get();

    if (snapshot.empty) {
      return 0;
    }

    const batchSize = 400;
    let deleted = 0;
    let batch = db.batch();
    let ops = 0;

    for (const doc of snapshot.docs) {
      batch.delete(doc.ref);
      ops += 1;
      deleted += 1;
      if (ops >= batchSize) {
        await batch.commit();
        batch = db.batch();
        ops = 0;
      }
    }

    if (ops > 0) {
      await batch.commit();
    }

    return deleted;
  }

  async pruneOlderThan(repositoryId: string, retain: number): Promise<number> {
    if (retain < 1) {
      return 0;
    }

    const db = this.firestoreService.getDb();
    const snapshot = await db
      .collection(COLLECTIONS.repositorySnapshots)
      .where('repositoryId', '==', repositoryId)
      .orderBy('capturedAt', 'desc')
      .get();

    const toDelete = snapshot.docs.slice(retain);
    if (toDelete.length === 0) {
      return 0;
    }

    const batch = db.batch();
    toDelete.forEach((doc: QueryDocumentSnapshot) => batch.delete(doc.ref));
    await batch.commit();
    return toDelete.length;
  }
}
