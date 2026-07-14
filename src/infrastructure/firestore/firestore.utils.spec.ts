import { buildRepositoryDocId } from './firestore.utils';

describe('buildRepositoryDocId', () => {
  it('builds a lowercase deterministic id', () => {
    expect(buildRepositoryDocId('Uid1', 'Vercel', 'Next.js')).toBe(
      'uid1_vercel_next.js',
    );
  });
});
