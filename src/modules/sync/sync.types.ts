export interface SyncRunResult {
  startedAt: string;
  finishedAt: string;
  total: number;
  synced: number;
  skipped: number;
  failed: number;
  errors: Array<{ repositoryId: string; fullName: string; message: string }>;
  rateLimitRemaining: number | null;
}

export interface SyncStatusView {
  running: boolean;
  lastRun: SyncRunResult | null;
}
