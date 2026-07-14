export default () => ({
  port: parseInt(process.env.PORT ?? '3000', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  github: {
    token: process.env.GITHUB_TOKEN ?? '',
    baseUrl: process.env.GITHUB_API_BASE_URL ?? 'https://api.github.com',
    timeoutMs: parseInt(process.env.GITHUB_TIMEOUT_MS ?? '10000', 10),
    cacheTtlSeconds: parseInt(process.env.GITHUB_CACHE_TTL_SECONDS ?? '120', 10),
  },
  sync: {
    enabled: process.env.SYNC_ENABLED !== 'false',
    cron: process.env.SYNC_CRON ?? '0 */6 * * *',
    concurrency: parseInt(process.env.SYNC_CONCURRENCY ?? '2', 10),
    minIntervalMinutes: parseInt(process.env.SYNC_MIN_INTERVAL_MINUTES ?? '30', 10),
  },
  snapshotRetention: parseInt(process.env.SNAPSHOT_RETENTION ?? '90', 10),
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID ?? '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? '',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY ?? '').replace(/\\n/g, '\n'),
  },
  auth: {
    allowDevHeader: process.env.AUTH_ALLOW_DEV_HEADER === 'true',
  },
});
