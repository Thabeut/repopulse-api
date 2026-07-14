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

> **Cron note:** Sync runs in-process on the Nest web service (`SYNC_CRON`, default every 6h) — there is no separate worker. On Render’s free tier the dyno sleeps when idle, so scheduled runs only fire while the service is awake. Manual `POST /api/v1/sync/run` only syncs the **current user’s** repos; the cron still walks all saved repos.

## Architecture

```text
HTTP
  → ValidationPipe / CORS / logging / response envelope
  → Controller (modules/*)
  → FirebaseAuthGuard (Bearer ID token)
  → Service (use-case)
       ├─ GitHubClient   (infrastructure/github)
       └─ Firestore repos (infrastructure/firestore)
```

| Layer | Path | Responsibility |
|-------|------|----------------|
| HTTP / shared | `src/common/` | Prefix, envelope, errors, pagination, decorators |
| Config | `src/config/` | Typed env + validation |
| Features | `src/modules/*` | Controllers, DTOs, services, domain types |
| GitHub | `src/infrastructure/github/` | REST client, mapper, TTL cache, retries, rate limits |
| Persistence | `src/infrastructure/firestore/` | Repositories, snapshots, users via Admin SDK |

**Why this shape**

- **Features vs infrastructure** — controllers/services stay in `modules/`; GitHub and Firestore are adapters you can swap without rewriting HTTP.
- **Normalize once, store in Firestore** — GitHub is mapped at the edge; saved repos and snapshots are the source of truth for the dashboard and charts.
- **Auth + ownership** — Firebase verifies the user; every mutation and query is scoped by `userId`.

```text
src/
  common/           # cross-cutting HTTP
  config/           # env
  modules/
    auth/           # Firebase guard + /auth/me
    repositories/   # search, save, list, refresh, favorite, delete
    analytics/      # dashboard, history, languages, commits
    sync/           # cron + /sync/*
    health/
  infrastructure/
    github/
    firestore/
```

## Setup

Requires Node 20+.

```bash
cp .env.example .env
npm install
npm run start:dev
```

Fill `.env` (see `.env.example`):

| Variable | Notes |
|----------|--------|
| `GITHUB_TOKEN` | GitHub PAT, public read is enough |
| `FIREBASE_*` | From Firebase service account JSON |
| `CORS_ORIGINS` | Comma-separated origins (include your Vercel URL) |
| `AUTH_ALLOW_DEV_HEADER` | `true` locally for Swagger + `x-user-id`; keep `false` in production |

Composite indexes: create via the link in any Firestore `FAILED_PRECONDITION` error, or `firebase deploy --only firestore:indexes` using `firestore.indexes.json` + `firebase.json`.

Local: http://localhost:3000/api/v1/health · http://localhost:3000/api

```bash
npm test
npm run test:e2e
```

## Deploy

Hosted on **Render** from this repo (`main`).

Build / start: `npm ci && npm run build` · `npm run start:prod`  
Health path: `/api/v1/health`

## Stack

NestJS · Firestore · GitHub REST · Firebase Auth · cron · Jest
