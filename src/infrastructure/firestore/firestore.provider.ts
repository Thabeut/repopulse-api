import { ConfigService } from '@nestjs/config';
import {
  App,
  cert,
  getApp,
  getApps,
  initializeApp,
} from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';
import { FIREBASE_APP, FIRESTORE } from './firestore.constants';

export type FirestoreDb = Firestore;

export const firestoreProviders = [
  {
    provide: FIREBASE_APP,
    inject: [ConfigService],
    useFactory: (config: ConfigService): App | null => {
      const projectId = config.get<string>('firebase.projectId') ?? '';
      const clientEmail = config.get<string>('firebase.clientEmail') ?? '';
      const privateKey = config.get<string>('firebase.privateKey') ?? '';

      if (!projectId || !clientEmail || !privateKey) {
        return null;
      }

      if (getApps().length > 0) {
        return getApp();
      }

      return initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    },
  },
  {
    provide: FIRESTORE,
    inject: [FIREBASE_APP],
    useFactory: (app: App | null): FirestoreDb | null => {
      if (!app) {
        return null;
      }
      return getFirestore(app);
    },
  },
];
