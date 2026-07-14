import { SnapshotsFirestoreRepository } from './snapshots.repository';
import { FirestoreService } from './firestore.service';

describe('SnapshotsFirestoreRepository', () => {
  const set = jest.fn();
  const commit = jest.fn();
  const batchDelete = jest.fn();
  const batch = jest.fn(() => ({
    delete: batchDelete,
    commit,
  }));

  const docs = [
    { ref: { id: 's1' }, data: () => ({ id: 's1', stars: 1 }) },
    { ref: { id: 's2' }, data: () => ({ id: 's2', stars: 2 }) },
    { ref: { id: 's3' }, data: () => ({ id: 's3', stars: 3 }) },
  ];

  const queryBuilder: {
    where: jest.Mock;
    orderBy: jest.Mock;
    get: jest.Mock;
  } = {
    where: jest.fn(),
    orderBy: jest.fn(),
    get: jest.fn(),
  };
  queryBuilder.where.mockReturnValue(queryBuilder);
  queryBuilder.orderBy.mockReturnValue(queryBuilder);

  const doc = jest.fn((id?: string) => ({
    set,
    id: id ?? 'generated',
  }));
  const collection = jest.fn(() => ({
    doc,
    where: queryBuilder.where,
  }));

  const firestoreService = {
    getDb: () => ({ collection, batch }),
  } as unknown as FirestoreService;

  const repo = new SnapshotsFirestoreRepository(firestoreService);

  beforeEach(() => {
    jest.clearAllMocks();
    queryBuilder.where.mockReturnValue(queryBuilder);
    queryBuilder.orderBy.mockReturnValue(queryBuilder);
    queryBuilder.get.mockResolvedValue({ empty: false, docs });
    commit.mockResolvedValue(undefined);
    set.mockResolvedValue(undefined);
  });

  it('creates a snapshot document', async () => {
    const created = await repo.create({
      id: 'snap-1',
      repositoryId: 'repo-1',
      userId: 'u1',
      fullName: 'a/b',
      stars: 10,
      forks: 1,
      watchers: 2,
      openIssues: 0,
      source: 'save',
      capturedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(created.id).toBe('snap-1');
    expect(collection).toHaveBeenCalledWith('repository_snapshots');
    expect(set).toHaveBeenCalled();
  });

  it('finds snapshots by repository with date bounds', async () => {
    queryBuilder.get.mockResolvedValue({
      docs: [
        {
          data: () => ({
            id: 's1',
            repositoryId: 'repo-1',
            capturedAt: '2026-01-02T00:00:00.000Z',
            stars: 5,
          }),
        },
      ],
    });

    const result = await repo.findByRepositoryId('repo-1', {
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T00:00:00.000Z',
    });

    expect(queryBuilder.where).toHaveBeenCalledWith('repositoryId', '==', 'repo-1');
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'capturedAt',
      '>=',
      '2026-01-01T00:00:00.000Z',
    );
    expect(queryBuilder.where).toHaveBeenCalledWith(
      'capturedAt',
      '<=',
      '2026-01-31T00:00:00.000Z',
    );
    expect(result).toHaveLength(1);
  });

  it('returns 0 when deleting with no matching docs', async () => {
    queryBuilder.get.mockResolvedValue({ empty: true, docs: [] });
    await expect(repo.deleteByRepositoryId('repo-x')).resolves.toBe(0);
    expect(commit).not.toHaveBeenCalled();
  });

  it('batch deletes snapshots for a repository', async () => {
    await expect(repo.deleteByRepositoryId('repo-1')).resolves.toBe(3);
    expect(batchDelete).toHaveBeenCalledTimes(3);
    expect(commit).toHaveBeenCalled();
  });

  it('prunes older snapshots beyond retain count', async () => {
    await expect(repo.pruneOlderThan('repo-1', 1)).resolves.toBe(2);
    expect(batchDelete).toHaveBeenCalledTimes(2);
    expect(commit).toHaveBeenCalled();
  });

  it('does not prune when retain is less than 1', async () => {
    await expect(repo.pruneOlderThan('repo-1', 0)).resolves.toBe(0);
    expect(collection).not.toHaveBeenCalled();
  });
});
