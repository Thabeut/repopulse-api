export function buildRepositoryDocId(
  userId: string,
  owner: string,
  name: string,
): string {
  return `${userId}_${owner}_${name}`.toLowerCase();
}

export function nowIso(): string {
  return new Date().toISOString();
}
