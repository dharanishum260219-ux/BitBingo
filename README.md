# BitBingo – Explorer's Chart Edition

A real-time event management web application for live coding competitions, styled with a vintage cartography aesthetic.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Realtime, Storage)
- **Fonts**: [Playfair Display](https://fonts.google.com/specimen/Playfair+Display) (serif UI) + [Caveat](https://fonts.google.com/specimen/Caveat) (cursive participant names), loaded via Google Fonts `<link>` tag in the root layout

## Features

- 🗺 **Treasure Map** – 5×5 Bingo grid of coding challenges; completed tiles are stamped with a bold red SVG "X"
- ⚓ **Bounty Board** – Real-time leaderboard showing participants sorted by score
- 📜 **Captain's Log** – Coordinator portal to log completions with camera-enabled photo proof upload to Supabase Storage
- ⭐ **X Marks the Spot** – Center tile challenge: circle printing via coordinate geometry
- Live updates via Supabase Realtime on `participants` and `completions` tables

## Getting Started

### 1. Configure Supabase

```bash
cp .env.local.example .env.local
# Edit .env.local with your Supabase project URL and anon key
```

### 2. Run the database migration

Execute the SQL in `supabase/migrations/001_schema.sql` in your Supabase SQL editor, then run `supabase/seed.sql` to populate the 25 challenges.

### 3. Start the development server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

Visit [http://localhost:3000/coordinator](http://localhost:3000/coordinator) for the coordinator portal.

## Project Structure

```
app/
  layout.tsx          # Root layout – Google Fonts link, paper texture
  globals.css         # Paper background, serif/cursive font rules
  page.tsx            # Landing page (leaderboard + bingo grid)
  coordinator/
    page.tsx          # Coordinator portal (Captain's Log form)
components/
  Leaderboard.tsx     # Real-time "Bounty Board" leaderboard
  BingoGrid.tsx       # Real-time 5×5 "Treasure Map" grid
  CoordinatorForm.tsx # Completion logging form
lib/
  supabase.ts         # Browser Supabase client
  demo-data.ts        # Fallback challenge data (no Supabase needed)
types/
  index.ts            # TypeScript types for DB rows
supabase/
  migrations/001_schema.sql  # Tables, RLS, Realtime, Storage bucket
  seed.sql                   # 25 challenge rows
```

## Deploy on Vercel

Set the `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` environment variables in your Vercel project settings, then deploy normally.
