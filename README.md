# RepoPulse API

NestJS backend for RepoPulse. Integrates GitHub REST API, stores normalized data in Firestore, exposes REST for the web app.

## Stack

NestJS · TypeScript · Firebase Admin / Firestore · Swagger · cron

## Deploy

**Render** — use `render.yaml` or connect this repo as a Web Service:

- Build: `npm ci && npm run build`
- Start: `npm run start:prod`
- Health: `/api/v1/health`

## Firebase setup

1. Create a project at https://console.firebase.google.com
2. Build → Firestore Database → Create database (start in production mode is fine; client access is denied, API uses Admin SDK)
3. Project settings (gear) → Service accounts → Generate new private key → download JSON
4. Map JSON fields into `api/.env`:

```bash
FIREBASE_PROJECT_ID=<project_id from JSON>
FIREBASE_CLIENT_EMAIL=<client_email from JSON>
FIREBASE_PRIVATE_KEY="<private_key from JSON — keep quotes; leave \n sequences as-is>"
```

Example private key line (one line with escaped newlines):

```bash
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

5. Restart the API. `GET /api/v1/health` should show `"firestore": "up"`.

## GitHub token

1. Open https://github.com/settings/tokens
2. **Generate new token** → **Generate new token (classic)**
3. Note: `RepoPulse local`
4. Expiration: 90 days (or your preference)
5. Scopes: leave all unchecked (public API read is enough) — or tick **public_repo** if you prefer
6. Generate → copy the token once
7. Put it in `api/.env`:

```bash
GITHUB_TOKEN=ghp_your_token_here
```

8. Restart the API. Authenticated calls get ~5,000 req/hour (vs ~60 without a token).

## Local

```bash
cp .env.example .env
npm install
npm run start:dev
```

- API: http://localhost:3000/api/v1/health
- Swagger: http://localhost:3000/api

## Docker

```bash
docker build -t repopulse-api .
docker run --env-file .env -p 3000:3000 repopulse-api
```

## License

MIT
