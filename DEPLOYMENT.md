# Deployment Guide

## 1. Deployment Target

Deploy the root Next.js app from this repository.

- Active app: repository root
- Archived duplicate app: `archive/frontend` (excluded from deploy)

## 2. Prerequisites

- Node.js 20+
- npm 10+
- Supabase project with database access
- Access to your hosting provider environment variables

## 3. Required Environment Variables

Set these in your host environment:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `ADMIN_PORTAL_SECRET`

Use `.env.local.example` as the template for local development only.

## 4. Database Setup

Apply SQL files in this exact order:

1. `supabase/migrations/001_schema.sql`
2. `supabase/migrations/002_session_scoped_challenges.sql`
3. `supabase/migrations/003_session_duration.sql`
4. `supabase/migrations/004_challenge_metadata.sql`

Optional seed step:

5. `supabase/seed.sql`

Run the seed only when your challenge pool is empty or when initializing a fresh environment.

## 5. Pre-Deploy Validation

From repository root, run:

```bash
npm install
npm run deploy:preflight
npm run build:check
```

Expected result:

- Preflight succeeds with all required env vars.
- Lint and build both pass.

## 6. Deploy

Deploy normally with your host's Next.js flow after checks pass.

## 7. Post-Deploy Smoke Tests

1. Verify health endpoint:

```bash
curl -sS https://<your-domain>/api/health
```

Expected: `ok: true` and `status: "healthy"`.

2. Verify app flows manually:

- Home page loads and session selector works.
- Admin page allows session creation with duration and optional teams/questions setup.
- CSV import path accepts supported team and question formats.
- Coordinator page logs completions and updates leaderboard/board state.

## 8. Failure Handling

If deploy fails:

1. Re-run `npm run deploy:preflight` and fix missing or malformed env vars.
2. Verify all migrations are applied in order.
3. Confirm Supabase keys are valid and not revoked.
4. Inspect `GET /api/health` response for dependency errors.

## 9. Rollback Guidance

- Roll back to the last known-good deployment in your host dashboard.
- Restore previous environment variables if a rotation caused breakage.
- Do not skip migration order when reapplying database setup in recovery.
