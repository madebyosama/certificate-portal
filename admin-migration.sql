-- ============================================================
-- Admin Dashboard Migration
-- Run this in Supabase SQL Editor AFTER the original schema.sql
-- ============================================================

-- 1. Add is_admin column to profiles
alter table public.profiles
  add column if not exists is_admin boolean default false;

-- 2. Support Tickets
create table if not exists public.support_tickets (
  id uuid primary key default uuid_generate_v4(),
  atc_id uuid references public.profiles(id) on delete cascade,
  subject text not null,
  message text not null,
  status text default 'open' check (status in ('open','in_progress','resolved','closed')),
  priority text default 'normal' check (priority in ('low','normal','high','urgent')),
  admin_reply text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.support_tickets enable row level security;

-- ATPs can create and view their own tickets
create policy "ATPs can manage own tickets" on public.support_tickets
  for all using (auth.uid() = atc_id);

-- Admins can view and update all tickets
create policy "Admins can manage all tickets" on public.support_tickets
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 3. Announcements
create table if not exists public.announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  target text default 'all' check (target in ('all','specific')),
  target_atc_id uuid references public.profiles(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now()
);

alter table public.announcements enable row level security;

-- ATPs can only read announcements targeted at them or all
create policy "ATPs can read their announcements" on public.announcements
  for select using (
    target = 'all' or target_atc_id = auth.uid()
  );

-- Admins can do everything
create policy "Admins can manage announcements" on public.announcements
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 4. Allow admins to read all profiles (for ATP management)
create policy "Admins can read all profiles" on public.profiles
  for select using (
    auth.uid() = id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 5. Allow admins to update any profile (for verify/suspend ATPs)
create policy "Admins can update all profiles" on public.profiles
  for update using (
    auth.uid() = id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 6. Allow admins to read all deposits
create policy "Admins can manage all deposits" on public.deposits
  for all using (
    auth.uid() = atc_id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 7. Allow admins to read all invoices
create policy "Admins can read all invoices" on public.invoices
  for all using (
    auth.uid() = atc_id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 8. Allow admins to read all transactions
create policy "Admins can read all transactions" on public.transactions
  for all using (
    auth.uid() = atc_id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 9. Allow admins to read all courses and candidates
create policy "Admins can read all courses" on public.courses
  for all using (
    auth.uid() = atc_id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create policy "Admins can read all candidates" on public.candidates
  for all using (
    auth.uid() = atc_id
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 10. Allow admins to manage course types
create policy "Admins can manage course types" on public.course_types
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- 11. Set your admin user (replace with your actual user email)
-- update public.profiles set is_admin = true where email = 'your-admin@email.com';


-- ============================================================
-- NOTE: If you get "policy already exists" errors, run these
-- drops first then re-run the migration:
-- ============================================================
-- drop policy if exists "Admins can read all profiles" on public.profiles;
-- drop policy if exists "Admins can update all profiles" on public.profiles;
-- drop policy if exists "Admins can manage all deposits" on public.deposits;
-- drop policy if exists "Admins can read all invoices" on public.invoices;
-- drop policy if exists "Admins can read all transactions" on public.transactions;
-- drop policy if exists "Admins can read all courses" on public.courses;
-- drop policy if exists "Admins can read all candidates" on public.candidates;
-- drop policy if exists "Admins can manage course types" on public.course_types;
