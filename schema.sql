-- ============================================================
-- SafQual Training Center Portal - Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────
-- PROFILES (ATC / Training Centers)
-- ─────────────────────────────────────────────
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  atc_name text,
  atc_no text unique,
  atc_address text,
  email text unique,
  kyc_verified boolean default false,
  deposit_balance numeric(12,4) default 0,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- ─────────────────────────────────────────────
-- COURSE TYPES (Predefined catalog)
-- ─────────────────────────────────────────────
create table public.course_types (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  price numeric(10,2) default 7.00,
  validity_days integer default 1,
  purchase_fee numeric(10,2) default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.course_types enable row level security;
create policy "Anyone authenticated can view course types" on public.course_types for select to authenticated using (true);

-- ─────────────────────────────────────────────
-- TRAINERS
-- ─────────────────────────────────────────────
create table public.trainers (
  id uuid primary key default uuid_generate_v4(),
  atc_id uuid references public.profiles(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  qualification text,
  is_active boolean default true,
  created_at timestamptz default now()
);

alter table public.trainers enable row level security;
create policy "ATCs can manage own trainers" on public.trainers for all using (auth.uid() = atc_id);

-- ─────────────────────────────────────────────
-- COURSES (Course Reference Numbers)
-- ─────────────────────────────────────────────
create table public.courses (
  id uuid primary key default uuid_generate_v4(),
  reference_number text unique not null,
  atc_id uuid references public.profiles(id) on delete cascade,
  course_type_id uuid references public.course_types(id),
  trainer_id uuid references public.trainers(id),
  course_title text not null,
  start_date date,
  end_date date,
  status text default 'draft' check (status in ('draft','submitted','moderation','approved','rejected')),
  total_candidates integer default 0,
  notes text,
  created_at timestamptz default now()
);

alter table public.courses enable row level security;
create policy "ATCs can manage own courses" on public.courses for all using (auth.uid() = atc_id);

-- Auto-generate reference numbers
create or replace function generate_reference_number()
returns trigger language plpgsql as $$
begin
  new.reference_number := floor(100000 + random() * 899999)::text;
  return new;
end;
$$;
create trigger set_reference_number before insert on public.courses
  for each row when (new.reference_number is null or new.reference_number = '')
  execute function generate_reference_number();

-- ─────────────────────────────────────────────
-- CANDIDATES
-- ─────────────────────────────────────────────
create table public.candidates (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid references public.courses(id) on delete cascade,
  atc_id uuid references public.profiles(id) on delete cascade,
  serial_no text unique not null,
  first_name text not null,
  last_name text not null,
  email text,
  date_of_birth date,
  country text,
  assessment_marks_1 integer,
  assessment_marks_2 integer,
  total_marks integer default 100,
  status text default 'pending' check (status in ('pending','pass','fail')),
  created_at timestamptz default now()
);

alter table public.candidates enable row level security;
create policy "ATCs can manage own candidates" on public.candidates for all using (auth.uid() = atc_id);

-- Auto-generate candidate serial number
create or replace function generate_serial_number()
returns trigger language plpgsql as $$
begin
  new.serial_no := 'MT-' || to_char(now(), 'YYYYMMDD') || '-' || floor(1000 + random() * 8999)::text;
  return new;
end;
$$;
create trigger set_serial_number before insert on public.candidates
  for each row when (new.serial_no is null or new.serial_no = '')
  execute function generate_serial_number();

-- ─────────────────────────────────────────────
-- INVOICES
-- ─────────────────────────────────────────────
create table public.invoices (
  id uuid primary key default uuid_generate_v4(),
  atc_id uuid references public.profiles(id) on delete cascade,
  course_id uuid references public.courses(id),
  invoice_number text unique not null,
  amount numeric(10,2) not null,
  status text default 'pending' check (status in ('pending','paid','overdue','cancelled')),
  payment_method text check (payment_method in ('deposit','stripe')),
  issued_at timestamptz default now(),
  due_at timestamptz,
  paid_at timestamptz
);

alter table public.invoices enable row level security;
create policy "ATCs can view own invoices" on public.invoices for all using (auth.uid() = atc_id);

-- ─────────────────────────────────────────────
-- OTHER INVOICES
-- ─────────────────────────────────────────────
create table public.other_invoices (
  id uuid primary key default uuid_generate_v4(),
  atc_id uuid references public.profiles(id) on delete cascade,
  description text,
  amount numeric(10,2) not null,
  status text default 'pending' check (status in ('pending','paid','overdue','cancelled')),
  issued_at timestamptz default now()
);

alter table public.other_invoices enable row level security;
create policy "ATCs can view own other invoices" on public.other_invoices for all using (auth.uid() = atc_id);

-- ─────────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────────
create table public.transactions (
  id uuid primary key default uuid_generate_v4(),
  atc_id uuid references public.profiles(id) on delete cascade,
  type text check (type in ('credit','debit')),
  amount numeric(10,2) not null,
  description text,
  reference text,
  balance_after numeric(12,4),
  created_at timestamptz default now()
);

alter table public.transactions enable row level security;
create policy "ATCs can view own transactions" on public.transactions for all using (auth.uid() = atc_id);

-- ─────────────────────────────────────────────
-- DEPOSITS
-- ─────────────────────────────────────────────
create table public.deposits (
  id uuid primary key default uuid_generate_v4(),
  atc_id uuid references public.profiles(id) on delete cascade,
  amount numeric(10,2) not null,
  payment_method text check (payment_method in ('bank_transfer','stripe','cheque')),
  status text default 'pending' check (status in ('pending','approved','rejected')),
  reference text,
  notes text,
  created_at timestamptz default now()
);

alter table public.deposits enable row level security;
create policy "ATCs can manage own deposits" on public.deposits for all using (auth.uid() = atc_id);

-- ─────────────────────────────────────────────
-- SEED: Sample Course Types
-- ─────────────────────────────────────────────
insert into public.course_types (title, price) values
  ('Award in Excavator Safe Operator Training', 7.00),
  ('Award in Forklift Safe Operator Training', 7.00),
  ('Award in Tower Crane Safe Operator Training', 7.00),
  ('Award in First AID & AED', 7.00),
  ('LEVEL 2 Award IN Emergency First Aid at Work', 7.00),
  ('Level 3 Award in First Aid at Work', 7.00),
  ('Award in CPR & First Aid', 7.00),
  ('Level 1 Award in Fire Safety Awareness', 7.00),
  ('Level 2 Award in Fire Safety Principles', 7.00),
  ('Level 3 Award in Fire Safety Risk Assessment & Control', 7.00),
  ('Level 2 Award in Control of Substances Hazardous to Health', 7.00),
  ('Level 2 Award in Health & Safety at the Workplace', 7.00),
  ('Level 2 Award in Manual Handling Principles and Practices', 7.00),
  ('Level 3 Diploma in Oil and Gas industry', 7.00),
  ('Level 3 Diploma in Process Safety Management (PSM)', 7.00),
  ('Level 2 Award in Basic workplace Construction & Process', 7.00);

-- ─────────────────────────────────────────────
-- FUNCTION: Handle new user signup
-- ─────────────────────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, atc_no)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'ATC-' || to_char(now(), 'YYYYMMDD') || '-' || floor(1000 + random() * 8999)::text
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
