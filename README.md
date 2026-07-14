# RepoPulse API

Backend for [RepoPulse](https://web-thabet-kh.vercel.app) — pulls GitHub repos via the public REST API, stores them in Firestore, and exposes a small REST API for the dashboard.

**Live API:** https://repopulse-api.onrender.com  
**Swagger:** https://repopulse-api.onrender.com/api  
**Health:** https://repopulse-api.onrender.com/api/v1/health  
**Frontend repo:** https://github.com/Thabeut/repopulse-web

## What it does

- Search / fetch repos from GitHub (token optional, higher rate limit with one)
- Save normalized data + metric snapshots in Firestore
- Background cron sync
- Google / Firebase ID token auth (Bearer)
- Analytics helpers (history, languages, commit activity)

> **Cron note:** Sync runs in-process on the Nest web service (`SYNC_CRON`, default every 6h) — there is no separate worker. On Render’s free tier the dyno sleeps when idle, so scheduled runs only fire while the service is awake (you can also trigger `POST /api/v1/sync/run`).

## Setup

Requires Node 20+.

```bash
cp .env.example .env
npm install
npm run start:dev
```

Fill `.env` (see `.env.example`):

| Variable                | Notes                                             |
| ----------------------- | ------------------------------------------------- |
| `GITHUB_TOKEN`          | GitHub PAT, public read is enough                 |
| `FIREBASE_*`            | From Firebase service account JSON                |
| `CORS_ORIGINS`          | Comma-separated origins (include your Vercel URL) |
| `AUTH_ALLOW_DEV_HEADER` | `true` locally for Swagger + `x-user-id`          |

Composite indexes: if Firestore returns `FAILED_PRECONDITION` (missing index), open the link in that error once, or deploy `firestore.indexes.json` from this repo.

Local: http://localhost:3000/api/v1/health · http://localhost:3000/api

```bash
npm test
npm run test:e2e
```

## Deploy

Hosted on **Render** from this repo (`main`).

## Stack

NestJS · Firestore · GitHub REST · Firebase Auth · cron · Jest
