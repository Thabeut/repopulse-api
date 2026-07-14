import { buildLanguageDistribution } from './analytics.utils';

describe('analytics utils', () => {
  it('builds language distribution', () => {
    expect(
      buildLanguageDistribution({ TypeScript: 80, JavaScript: 20 }),
    ).toEqual([
      { name: 'TypeScript', bytes: 80, percent: 80 },
      { name: 'JavaScript', bytes: 20, percent: 20 },
    ]);
  });

  it('returns empty array when no language bytes', () => {
    expect(buildLanguageDistribution({})).toEqual([]);
  });
});
