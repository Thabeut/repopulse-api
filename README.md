# RepoPulse API

NestJS backend for RepoPulse. Integrates the GitHub REST API, stores normalized data in Firestore, and exposes REST for the web dashboard.

**Live:** https://repopulse-api.onrender.com  
**Web UI:** https://web-thabet-kh.vercel.app  
**Repo:** https://github.com/Thabeut/repopulse-api

| Link | URL |
|------|-----|
| Health | https://repopulse-api.onrender.com/api/v1/health |
| Swagger | https://repopulse-api.onrender.com/api |

## Stack

NestJS · TypeScript · Firebase Admin / Firestore · Swagger · cron · Jest

## Deploy (Render)

Connected via `render.yaml` / GitHub `main`.

- Build: `npm ci && npm run build`
- Start: `npm run start:prod`
- Health check: `/api/v1/health`
- `CORS_ORIGINS` must include `https://web-thabet-kh.vercel.app` (and localhost for local UI)
- `AUTH_ALLOW_DEV_HEADER=false` in production
- `FIREBASE_PRIVATE_KEY`: paste with `\n` escapes; surrounding quotes are stripped by the app

Free Render instances may cold-start (~30–60s) on first request.

## Firebase setup

1. Create a project at https://console.firebase.google.com
2. Build → Firestore Database → Create database (client access denied; API uses Admin SDK)
3. Project settings → Service accounts → Generate new private key
4. Map into `.env` / Render env:

```bash
FIREBASE_PROJECT_ID=<project_id>
FIREBASE_CLIENT_EMAIL=<client_email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

5. `GET /api/v1/health` should show `"firestore": "up"`.

## GitHub token

1. https://github.com/settings/tokens → classic token (public read is enough)
2. Set `GITHUB_TOKEN` in `.env` / Render

Authenticated calls get ~5,000 req/hour.

## Firebase Authentication (Google)

1. Authentication → Sign-in method → enable **Google**
2. Authorized domains: `localhost` and `web-thabet-kh.vercel.app`
3. Web app config goes in the companion `repopulse-web` env (`VITE_FIREBASE_*`)
4. Local Swagger can use `AUTH_ALLOW_DEV_HEADER=true` + `x-user-id: demo-user`

## Local

```bash
cp .env.example .env
npm install
npm run start:dev
```

- API: http://localhost:3000/api/v1/health
- Swagger: http://localhost:3000/api

```bash
npm test
npm run test:e2e
```

## Docker

```bash
docker build -t repopulse-api .
docker run --env-file .env -p 3000:3000 repopulse-api
```

## License

MIT
