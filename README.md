# GymLi — Gym Management System

Complete gym management for Pakistan. Member enrollment, fee collection, automated reminders, and multi-location support — built with SvelteKit + Supabase, deployed on Vercel.

## Stack

- **Frontend + Backend**: SvelteKit 5 (full-stack, server routes)
- **Database + Auth + Storage**: Supabase (PostgreSQL, row-level security, file storage)
- **Deployment**: Vercel (free tier)
- **Styling**: Tailwind CSS v4

## Local Development

```bash
# 1. Clone and install
git clone <your-repo-url>
cd gymli
npm install

# 2. Set up environment
cp .env.example .env
# Fill in your Supabase project URL and anon key

# 3. Run the dev server
npm run dev
```

## Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor
3. Create storage buckets:
   - `avatars` — public
   - `cnic` — private
4. Copy your project URL and anon key into `.env`

## Environment Variables

```
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import into [vercel.com](https://vercel.com)
3. Add these environment variables (Production + Preview):
   - `PUBLIC_SUPABASE_URL`
   - `PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy — done

Copy values from your local `.env` (or from Supabase → Project Settings → API).

## Features

- Member enrollment with CNIC number, CNIC front/back images, profile photo
- Fee collection (cash, card, bank transfer) with full payment history
- Automated due-soon, due-today, and overdue reminders
- Owner dashboard — daily/weekly/monthly collection, overdue members
- Multi-gym support — one owner account, multiple locations
- Role-based access — Owner, Manager, Instructor, Staff, Member
- Pakistan-specific — CNIC format, PKR currency, en-PK locale
<!-- redeploy trigger 2026-07-30T11:33:07Z -->
