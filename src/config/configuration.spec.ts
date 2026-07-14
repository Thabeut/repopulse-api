import { normalizePrivateKey } from './configuration';

describe('normalizePrivateKey', () => {
  it('strips wrapping quotes and expands escaped newlines', () => {
    const raw =
      '"-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----\\n"';
    expect(normalizePrivateKey(raw)).toBe(
      '-----BEGIN PRIVATE KEY-----\nABC\n-----END PRIVATE KEY-----',
    );
  });
});
