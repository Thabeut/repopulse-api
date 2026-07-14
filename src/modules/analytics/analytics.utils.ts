import { RepositorySnapshot } from '../repositories/domain/repository.types';
import { HistoryMetric } from './dto/analytics.dto';

export interface HistoryPoint {
  t: string;
  v: number;
}

export interface LanguageShare {
  name: string;
  bytes: number;
  percent: number;
}

export function buildHistorySeries(
  snapshots: RepositorySnapshot[],
  metric: HistoryMetric,
): HistoryPoint[] {
  return snapshots.map((snapshot) => ({
    t: snapshot.capturedAt,
    v: snapshot[metric],
  }));
}

export function buildLanguageDistribution(
  languages: Record<string, number>,
): LanguageShare[] {
  const entries = Object.entries(languages).filter(([, bytes]) => bytes > 0);
  const total = entries.reduce((sum, [, bytes]) => sum + bytes, 0);
  if (total === 0) {
    return [];
  }

  return entries
    .map(([name, bytes]) => ({
      name,
      bytes,
      percent: Math.round((bytes / total) * 1000) / 10,
    }))
    .sort((a, b) => b.bytes - a.bytes);
}
