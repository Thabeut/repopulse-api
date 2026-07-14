import { UsersFirestoreRepository } from './users.repository';
import { FirestoreService } from './firestore.service';

describe('UsersFirestoreRepository', () => {
  const set = jest.fn();
  const get = jest.fn();
  const doc = jest.fn(() => ({ set, get }));
  const collection = jest.fn(() => ({ doc }));

  const firestore = {
    getDb: () => ({ collection }),
  } as unknown as FirestoreService;

  const repo = new UsersFirestoreRepository(firestore);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('creates a user on first login', async () => {
    get.mockResolvedValue({ exists: false });
    set.mockResolvedValue(undefined);

    const created = await repo.upsertLogin({
      uid: 'uid-1',
      email: 'a@b.com',
      displayName: 'Ada',
      photoURL: null,
    });

    expect(created.uid).toBe('uid-1');
    expect(created.email).toBe('a@b.com');
    expect(created.createdAt).toEqual(expect.any(String));
    expect(created.lastLoginAt).toEqual(expect.any(String));
    expect(collection).toHaveBeenCalledWith('users');
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ uid: 'uid-1', email: 'a@b.com' }),
    );
  });

  it('merges profile on subsequent login', async () => {
    get.mockResolvedValue({
      exists: true,
      data: () => ({
        uid: 'uid-1',
        email: 'old@b.com',
        displayName: 'Old',
        photoURL: null,
        createdAt: '2026-01-01T00:00:00.000Z',
        lastLoginAt: '2026-01-01T00:00:00.000Z',
      }),
    });
    set.mockResolvedValue(undefined);

    const updated = await repo.upsertLogin({
      uid: 'uid-1',
      email: 'new@b.com',
      displayName: 'New',
      photoURL: 'https://img',
    });

    expect(updated.email).toBe('new@b.com');
    expect(updated.displayName).toBe('New');
    expect(updated.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@b.com',
        displayName: 'New',
        photoURL: 'https://img',
      }),
      { merge: true },
    );
  });

  it('returns null when user is missing', async () => {
    get.mockResolvedValue({ exists: false });
    await expect(repo.findById('missing')).resolves.toBeNull();
  });

  it('returns user when present', async () => {
    get.mockResolvedValue({
      exists: true,
      data: () => ({ uid: 'uid-1', email: 'a@b.com' }),
    });
    await expect(repo.findById('uid-1')).resolves.toEqual({
      uid: 'uid-1',
      email: 'a@b.com',
    });
  });
});
