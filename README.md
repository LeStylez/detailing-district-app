# Detailing District Pro — Supabase Final

This version is linked to Supabase using the project URL and public key provided.

## Important setup

If you already created empty tables, run:

supabase/schema.sql

inside Supabase SQL Editor. The app expects each table to have:
- id
- data jsonb
- created_at
- updated_at

Tables:
- customers
- vehicles
- invoices
- receipts
- quotes
- bookings
- packages
- settings

## Vercel environment variables

Add these in Vercel → Project Settings → Environment Variables:

VITE_SUPABASE_URL=https://zexmyumqjmdgpsrlwpsf.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_xPeJy4ECKdLkPSXWkRaj1g_bH3gjtvu

## Deploy

Upload contents to GitHub and deploy with Vercel:
- Framework: Vite
- Build command: vite build
- Output directory: dist

## Security note

The included schema has open policies for quick setup. Add Supabase Auth later before letting anyone else access the app.
