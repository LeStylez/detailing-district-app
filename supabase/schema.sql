-- Detailing District Pro Supabase Schema
-- Run this in Supabase SQL Editor if your tables do not already have these columns.

create extension if not exists "pgcrypto";

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists receipts (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists settings (
  id text primary key default 'business',
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- For a private single-user app during setup, enable permissive policies.
-- Once auth is added, replace these with authenticated-user policies.
alter table customers enable row level security;
alter table vehicles enable row level security;
alter table invoices enable row level security;
alter table receipts enable row level security;
alter table quotes enable row level security;
alter table bookings enable row level security;
alter table packages enable row level security;
alter table settings enable row level security;

do $$ begin
  create policy "public_select_customers" on customers for select using (true);
  create policy "public_write_customers" on customers for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_select_vehicles" on vehicles for select using (true);
  create policy "public_write_vehicles" on vehicles for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_select_invoices" on invoices for select using (true);
  create policy "public_write_invoices" on invoices for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_select_receipts" on receipts for select using (true);
  create policy "public_write_receipts" on receipts for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_select_quotes" on quotes for select using (true);
  create policy "public_write_quotes" on quotes for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_select_bookings" on bookings for select using (true);
  create policy "public_write_bookings" on bookings for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_select_packages" on packages for select using (true);
  create policy "public_write_packages" on packages for all using (true) with check (true);
exception when duplicate_object then null; end $$;

do $$ begin
  create policy "public_select_settings" on settings for select using (true);
  create policy "public_write_settings" on settings for all using (true) with check (true);
exception when duplicate_object then null; end $$;
