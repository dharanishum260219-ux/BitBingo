# BitBingo

BitBingo is a Next.js 16 App Router application for running coding challenge sessions with:

- session-scoped boards
- team registration and leaderboard tracking
- completion stamping from a coordinator console
- admin setup with optional CSV imports for teams and questions

## Active App Location

The deployable app is the repository root.

The previous duplicate app has been archived under `archive/frontend` and is not part of the deployment pipeline.

## Tech Stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Supabase (Postgres)
- Tailwind CSS

## Local Development

1. Install dependencies.

```bash
npm install
```

2. Create local environment file.

```bash
cp .env.local.example .env.local
```

3. Set required variables in `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PORTAL_SECRET`

4. Apply database SQL in order:

- `supabase/migrations/001_schema.sql`
- `supabase/migrations/002_session_scoped_challenges.sql`
- `supabase/migrations/003_session_duration.sql`
- `supabase/migrations/004_challenge_metadata.sql`
- `supabase/seed.sql` (optional if your challenge pool is empty)

5. Run development server.

```bash
npm run dev
```

## Deployment Quick Checks

Run these before deploying:

```bash
npm run deploy:preflight
npm run build:check
```

- `deploy:preflight` validates required environment variables.
- `build:check` runs lint + production build.

## Health Check

Use `GET /api/health` for deployment smoke tests.

## Full Deployment Guide

See `DEPLOYMENT.md` for complete step-by-step deployment and rollback instructions.
