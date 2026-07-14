export const FIRESTORE = Symbol('FIRESTORE');
export const FIREBASE_APP = Symbol('FIREBASE_APP');

export const COLLECTIONS = {
  repositories: 'repositories',
  repositorySnapshots: 'repository_snapshots',
  users: 'users',
} as const;
