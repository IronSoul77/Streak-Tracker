# Streak Tracker

A full stack, database-backed personal productivity tracker for one user. It uses Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, lucide-react, PostgreSQL, and Prisma.

This is not a static website. Tasks, coins, streaks, freezes, daily logs, and history are read from and written to PostgreSQL through Prisma and Next.js API routes.

## Create a GitHub repo

1. Create a new empty repository on GitHub named `streak-tracker`.
2. From this project folder, run:

```bash
git init
git add .
git commit -m "Initial Streak Tracker app"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/streak-tracker.git
git push -u origin main
```

## Run locally

```bash
npm install
cp .env.example .env
```

Add your real PostgreSQL connection string to `.env`:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

Then run:

```bash
npm run prisma:migrate
npm run prisma:seed
npm run dev
```

Open `http://localhost:3000`.

## PostgreSQL with Neon or Supabase

### Neon

1. Create a Neon project at `https://neon.tech`.
2. Copy the pooled or direct connection string.
3. Paste it into `.env` as `DATABASE_URL`.
4. Keep `sslmode=require` in the URL for hosted Neon databases.

### Supabase

1. Create a Supabase project at `https://supabase.com`.
2. Go to Project Settings, then Database.
3. Copy the connection string for Prisma or PostgreSQL.
4. Replace the password placeholder and paste it into `.env` as `DATABASE_URL`.

## Prisma migrations

Generate the database tables:

```bash
npm run prisma:migrate
```

Seed the initial wallet, streak, and example tasks:

```bash
npm run prisma:seed
```

Open Prisma Studio when you want to inspect rows:

```bash
npx prisma studio
```

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the repo into Vercel.
3. Set the Vercel project name to `streak-tracker`. The default Vercel URL will be similar to `https://streak-tracker.vercel.app`.
4. Add `DATABASE_URL` in Vercel Project Settings, Environment Variables when you are ready for persistent database storage.
5. Run migrations against the production database:

```bash
npx prisma migrate deploy
```

6. Deploy. The build command is `npm run build`.

For seeded production data, run the seed script locally with the production `DATABASE_URL`, or use Vercel's build/deploy tooling carefully after setting the environment variable.

## Backend behavior

The app uses API routes for:

- `GET /api/dashboard`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/finish-day`
- `POST /api/shop/buy-freeze`
- `GET /api/history`
- `GET /api/stats`

The daily finish flow prevents double counting by making `DailyLog.date` unique. If Siri finishes a day and reopens the app later the same day, the saved result is shown and coins/streak are not awarded again.

## Why this is not static

Static sites cannot reliably persist private app data such as tasks, streaks, coins, freezes, and daily logs. Streak Tracker uses PostgreSQL as the source of truth, Prisma for database access, and server-side Next.js API routes for mutations. `localStorage` is not used as the main storage layer.
