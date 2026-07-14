import { Injectable } from '@nestjs/common';
import { UserProfile } from '../../modules/repositories/domain/repository.types';
import { COLLECTIONS } from './firestore.constants';
import { FirestoreService } from './firestore.service';
import { nowIso } from './firestore.utils';

@Injectable()
export class UsersFirestoreRepository {
  constructor(private readonly firestore: FirestoreService) {}

  async upsertLogin(profile: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
  }): Promise<UserProfile> {
    const db = this.firestore.getDb();
    const ref = db.collection(COLLECTIONS.users).doc(profile.uid);
    const existing = await ref.get();
    const now = nowIso();

    if (!existing.exists) {
      const created: UserProfile = {
        uid: profile.uid,
        email: profile.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
        createdAt: now,
        lastLoginAt: now,
      };
      await ref.set(created);
      return created;
    }

    const updated: UserProfile = {
      ...(existing.data() as UserProfile),
      email: profile.email,
      displayName: profile.displayName,
      photoURL: profile.photoURL,
      lastLoginAt: now,
    };
    await ref.set(updated, { merge: true });
    return updated;
  }

  async findById(uid: string): Promise<UserProfile | null> {
    const db = this.firestore.getDb();
    const snap = await db.collection(COLLECTIONS.users).doc(uid).get();
    if (!snap.exists) {
      return null;
    }
    return snap.data() as UserProfile;
  }
}
