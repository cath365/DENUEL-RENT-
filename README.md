# DENUEL App Rental

Zambia-first rental marketplace inspired by Zillow — built with Next.js (App Router), Prisma, MySQL (TiDB Cloud), Tailwind CSS and Mapbox.

## 🚀 Deploying to Vercel

### Required Environment Variables

Add these in your Vercel project settings (Settings → Environment Variables):

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL/TiDB connection string | ✅ Yes |
| `JWT_SECRET` | Secret for JWT authentication (min 32 chars) | ✅ Yes |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage token for image uploads | ✅ Yes |
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Mapbox API key for maps | ✅ Yes |
| `STRIPE_SECRET_KEY` | Stripe secret key for payments | Optional |
| `STRIPE_PUBLISHABLE_KEY` | Stripe public key | Optional |
| `SMTP_HOST` | Email server host | Optional |
| `SMTP_USER` | Email username | Optional |
| `SMTP_PASS` | Email password | Optional |

### Setting Up Vercel Blob Storage

1. Go to your Vercel dashboard
2. Select your project → Storage tab
3. Click "Create Database" → Select "Blob"
4. The `BLOB_READ_WRITE_TOKEN` will be automatically added to your environment

### Database Setup (TiDB Cloud)

1. Create a free TiDB Cloud account at https://tidbcloud.com
2. Create a new cluster (Serverless tier is free)
3. Get your connection string and add it as `DATABASE_URL`
4. Run migrations: The build process will automatically generate the Prisma client

## Getting started (local development)

1. Copy `.env.example` → `.env` and fill values (S3, REDIS_URL, SMTP if using saved-search emails).
2. Start Postgres and local dev stack:

   docker-compose up -d db

   # optionally start redis for worker
   docker run -d -p 6379:6379 --name denuel-redis redis:7

3. Install dependencies:

   npm install

4. Generate Prisma client and run migrations:

   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed

5. Start dev server:

   npm run dev

6. Start worker (if using REDIS_URL):

   REDIS_URL=redis://localhost:6379 npm run worker

7. (Optional) Deploy image processor lambda via Serverless Framework:

   npm run serverless:deploy -- --stage production



## Project structure

- /app — Next.js App Router pages
- /components — UI components
- /lib — utilities (auth, prisma client, map helpers)
- /prisma — Prisma schema and seed script
- /public — static assets
- /styles — global styles

## Roadmap

Phase 1: core search, map view, auth, landlord dashboard, admin moderation.
Phase 2: AI pricing, WhatsApp integration, mobile apps, payments.

---

For full implementation steps, run the task list in the project doc (in repo root).