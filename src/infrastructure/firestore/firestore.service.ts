import {
  Injectable,
  Optional,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { FIRESTORE } from './firestore.constants';
import { FirestoreDb } from './firestore.provider';

@Injectable()
export class FirestoreService {
  constructor(
    @Optional()
    @Inject(FIRESTORE)
    private readonly db: FirestoreDb | null,
  ) {}

  isConfigured(): boolean {
    return this.db !== null;
  }

  getDb(): FirestoreDb {
    if (!this.db) {
      throw new ServiceUnavailableException(
        'Firestore is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
      );
    }
    return this.db;
  }

  async ping(): Promise<'up' | 'down' | 'unconfigured'> {
    if (!this.db) {
      return 'unconfigured';
    }

    try {
      await this.db.collection('_health').limit(1).get();
      return 'up';
    } catch {
      return 'down';
    }
  }
}
