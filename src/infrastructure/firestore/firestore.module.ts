import { Global, Module } from '@nestjs/common';
import { firestoreProviders } from './firestore.provider';
import { FirestoreService } from './firestore.service';
import { RepositoriesFirestoreRepository } from './repositories.repository';
import { SnapshotsFirestoreRepository } from './snapshots.repository';
import { UsersFirestoreRepository } from './users.repository';

@Global()
@Module({
  providers: [
    ...firestoreProviders,
    FirestoreService,
    RepositoriesFirestoreRepository,
    SnapshotsFirestoreRepository,
    UsersFirestoreRepository,
  ],
  exports: [
    FirestoreService,
    RepositoriesFirestoreRepository,
    SnapshotsFirestoreRepository,
    UsersFirestoreRepository,
  ],
})
export class FirestoreModule {}
