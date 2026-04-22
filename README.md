# BitBingo – Explorer's Chart Edition

A real-time event management web application for live coding competitions, styled with a vintage cartography aesthetic.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS
- **Backend**: Next.js route handlers plus Supabase (PostgreSQL, Realtime, Storage)
- **Database**: SQL schema and seed files in `database/`
- **Fonts**: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) (serif UI) + [Caveat](https://fonts.google.com/specimen/Caveat) (cursive participant names), loaded via Google Fonts `<link>` tag in the root layout

## Features

- 🗺 **Treasure Map** – 5×5 Bingo grid of coding challenges; completed tiles are stamped with a bold red SVG "X"
- ⚓ **Bounty Board** – Real-time leaderboard showing participants sorted by score
- 📜 **Captain's Log** – Coordinator portal to log completions with camera-enabled photo proof upload to Supabase Storage
- 🧭 **Harbor Master** – Admin portal to create and activate sessions behind a server-side passcode
- 👥 **Crew Registry** – Register teams in the admin portal so they appear in leaderboard and coordinator tools
- ⭐ **X Marks the Spot** – Center tile challenge: circle printing via coordinate geometry
- Live updates via Supabase Realtime on `participants` and `completions` tables

## Getting Started

### 1. Configure Supabase

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase project URL and anon key
```

### 2. Run the database migration

Execute the SQL in `database/schema.sql` in your Supabase SQL editor, then run `database/seed.sql` to populate the 25 challenges.

The admin portal uses `ADMIN_PORTAL_SECRET` in `.env.local`. If you skip it during local development, a built-in dev secret is used so the admin flow still works.

The coordinator completion endpoint uses `SUPABASE_SERVICE_ROLE_KEY` to write completions and upload proof images securely from the server.

### 3. Start the development server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

Visit [http://localhost:3000/coordinator](http://localhost:3000/coordinator) for the coordinator portal.

Visit [http://localhost:3000/admin](http://localhost:3000/admin) for the admin portal.

## Project Structure

```
app/
  layout.tsx          # Root layout – Google Fonts link, paper texture
  globals.css         # Paper background, serif/cursive font rules
  page.tsx            # Landing page (leaderboard + bingo grid)
  admin/
    page.tsx          # Admin portal wrapper
  coordinator/
    page.tsx          # Coordinator portal wrapper
  api/
    admin/
      participants/
        route.ts      # Team registration endpoint
    coordinator/
      completions/
        route.ts      # Backend completion logging endpoint
backend/
  supabase.ts         # Server Supabase clients and config guards
  admin/
    auth.ts           # Admin cookie/passcode helpers
    participants.ts   # Team registration and roster data helpers
    sessions.ts       # Session list and creation helpers
  coordinator/
    data.ts           # Coordinator page data loader
    completions.ts    # Completion logging with proof upload
frontend/
  pages/
    HomePage.tsx      # Landing page implementation
    AdminPage.tsx     # Admin portal implementation
  components/
    Leaderboard.tsx   # Real-time "Bounty Board" leaderboard
    BingoGrid.tsx     # Real-time 5×5 "Treasure Map" grid
    CoordinatorForm.tsx # Completion logging form
    AdminLoginForm.tsx
    AdminSessionForm.tsx
    AdminTeamForm.tsx
lib/
  supabase.ts         # Browser Supabase client
  demo-data.ts        # Fallback challenge data (no Supabase needed)
types/
  index.ts            # TypeScript types for DB rows
database/
  schema.sql          # Tables, RLS, Realtime, Storage bucket, admin session RPC
  seed.sql            # 25 challenge rows
```

## Deploy on Vercel

Set the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables in your Vercel project settings, then deploy normally.
