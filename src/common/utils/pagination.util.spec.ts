import { buildPaginationMeta } from './pagination.util';

describe('buildPaginationMeta', () => {
  it('computes totalPages from total and limit', () => {
    expect(buildPaginationMeta(1, 20, 42)).toEqual({
      page: 1,
      limit: 20,
      total: 42,
      totalPages: 3,
    });
  });

  it('returns zero totalPages when total is zero', () => {
    expect(buildPaginationMeta(1, 20, 0)).toEqual({
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
    });
  });
});
