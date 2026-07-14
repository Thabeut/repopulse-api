import { RepositoriesFirestoreRepository } from './repositories.repository';
import { FirestoreService } from './firestore.service';

describe('RepositoriesFirestoreRepository', () => {
  const set = jest.fn();
  const get = jest.fn();
  const del = jest.fn();
  const doc = jest.fn(() => ({ set, get, delete: del }));
  const collection = jest.fn(() => ({ doc }));

  const firestoreService = {
    getDb: () => ({ collection }),
  } as unknown as FirestoreService;

  const repo = new RepositoriesFirestoreRepository(firestoreService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a repository document', async () => {
    const created = await repo.create({
      id: 'u1_owner_name',
      userId: 'u1',
      githubId: 1,
      owner: 'owner',
      ownerAvatarUrl: '',
      name: 'name',
      fullName: 'owner/name',
      description: null,
      htmlUrl: 'https://github.com/owner/name',
      defaultBranch: 'main',
      primaryLanguage: 'TypeScript',
      languages: {},
      topics: [],
      license: 'MIT',
      stars: 10,
      forks: 1,
      watchers: 10,
      openIssues: 0,
      isFork: false,
      favorited: false,
      contributors: [],
      releases: [],
      recentCommits: [],
      commitActivity: [],
      lastSyncedAt: null,
      syncStatus: 'idle',
      lastSyncError: null,
    });

    expect(created.id).toBe('u1_owner_name');
    expect(created.createdAt).toEqual(expect.any(String));
    expect(collection).toHaveBeenCalledWith('repositories');
    expect(set).toHaveBeenCalled();
  });

  it('returns null when document is missing', async () => {
    get.mockResolvedValue({ exists: false });
    await expect(repo.findById('missing')).resolves.toBeNull();
  });

  it('returns document data when present', async () => {
    get.mockResolvedValue({
      exists: true,
      data: () => ({ id: 'u1_owner_name', fullName: 'owner/name' }),
    });
    await expect(repo.findById('u1_owner_name')).resolves.toEqual({
      id: 'u1_owner_name',
      fullName: 'owner/name',
    });
  });

  it('deletes by id', async () => {
    await repo.delete('u1_owner_name');
    expect(del).toHaveBeenCalled();
  });
});
