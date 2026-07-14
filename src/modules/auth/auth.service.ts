import {
  Inject,
  Injectable,
  Optional,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FIREBASE_APP } from '../../infrastructure/firestore/firestore.constants';
import { UsersFirestoreRepository } from '../../infrastructure/firestore/users.repository';
import { AuthUser } from './auth.types';

@Injectable()
export class AuthService {
  constructor(
    @Optional()
    @Inject(FIREBASE_APP)
    private readonly app: App | null,
    private readonly users: UsersFirestoreRepository,
  ) {}

  async verifyIdToken(token: string): Promise<AuthUser> {
    if (!this.app) {
      throw new ServiceUnavailableException(
        'Firebase Auth is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.',
      );
    }

    try {
      const decoded = await getAuth(this.app).verifyIdToken(token);
      const user: AuthUser = {
        uid: decoded.uid,
        email: decoded.email ?? null,
        name: decoded.name ?? null,
        picture: decoded.picture ?? null,
      };

      try {
        await this.users.upsertLogin({
          uid: user.uid,
          email: user.email,
          displayName: user.name,
          photoURL: user.picture,
        });
      } catch {
        return user;
      }

      return user;
    } catch {
      throw new UnauthorizedException('Invalid or expired Firebase ID token');
    }
  }
}
