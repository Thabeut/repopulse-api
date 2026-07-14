# RepoPulse API

NestJS backend for RepoPulse. Integrates GitHub REST API, stores normalized data in Firestore, exposes REST for the web app.

## Stack

NestJS · TypeScript · Firebase Admin / Firestore · Swagger · cron

## Deploy

**Render** — use `render.yaml` or connect this repo as a Web Service:

- Build: `npm ci && npm run build`
- Start: `npm run start:prod`
- Health: `/api/v1/health`

Set env vars from `.env.example`.

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
