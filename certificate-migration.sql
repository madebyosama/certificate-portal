-- ============================================================
-- Certificate & Hard-Copy Order Migration
-- Run this in your Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- ─────────────────────────────────────────────
-- 1. Add certificate_no column to candidates
--    This is auto-assigned the first time a certificate is
--    issued for a candidate, derived from ATC number + sequence
-- ─────────────────────────────────────────────
alter table public.candidates
  add column if not exists certificate_no text unique,
  add column if not exists certificate_issued_at timestamptz;

-- ─────────────────────────────────────────────
-- 2. Per-ATC certificate counter (atomic, unique)
--    Used to build certificate numbers like {ATC_NO}-CRT-000001
-- ─────────────────────────────────────────────
create table if not exists public.atc_cert_counters (
  atc_id uuid primary key references public.profiles(id) on delete cascade,
  last_seq integer not null default 0,
  updated_at timestamptz default now()
);

alter table public.atc_cert_counters enable row level security;
create policy "ATCs can view own counter" on public.atc_cert_counters
  for select using (auth.uid() = atc_id);

-- Function: atomically increment & return next seq for an ATC
create or replace function public.next_cert_seq(p_atc_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_seq integer;
begin
  insert into public.atc_cert_counters (atc_id, last_seq)
  values (p_atc_id, 1)
  on conflict (atc_id) do update
    set last_seq = atc_cert_counters.last_seq + 1,
        updated_at = now()
  returning last_seq into v_seq;
  return v_seq;
end;
$$;

grant execute on function public.next_cert_seq(uuid) to authenticated;

-- ─────────────────────────────────────────────
-- 3. Function: issue (or fetch) a certificate number
--    Idempotent — if the candidate already has one, returns it
-- ─────────────────────────────────────────────
create or replace function public.issue_certificate_no(p_candidate_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing text;
  v_atc_id uuid;
  v_atc_no text;
  v_seq integer;
  v_cert_no text;
begin
  -- Already issued? return existing
  select certificate_no, atc_id into v_existing, v_atc_id
  from public.candidates
  where id = p_candidate_id;

  if v_existing is not null then
    return v_existing;
  end if;

  -- Authorisation: only the candidate's own ATC (or an admin) may issue
  if not (
    v_atc_id = auth.uid()
    or exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  ) then
    raise exception 'Not authorised to issue certificate for this candidate';
  end if;

  -- Pull ATC short identifier
  select atc_no into v_atc_no from public.profiles where id = v_atc_id;
  if v_atc_no is null then v_atc_no := 'ATC'; end if;

  v_seq := public.next_cert_seq(v_atc_id);
  v_cert_no := v_atc_no || '-CRT-' || lpad(v_seq::text, 6, '0');

  update public.candidates
     set certificate_no = v_cert_no,
         certificate_issued_at = now()
   where id = p_candidate_id;

  return v_cert_no;
end;
$$;

grant execute on function public.issue_certificate_no(uuid) to authenticated;

-- ─────────────────────────────────────────────
-- 4. Hard-copy certificate orders
-- ─────────────────────────────────────────────
create table if not exists public.certificate_orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null,
  atc_id uuid references public.profiles(id) on delete cascade,
  candidate_id uuid references public.candidates(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  certificate_no text,
  -- delivery
  recipient_name text not null,
  address_line1 text not null,
  address_line2 text,
  city text not null,
  state_region text,
  postal_code text not null,
  country text not null,
  phone text,
  -- pricing snapshot (kept on the order so changes to settings don't rewrite history)
  certificate_price numeric(10,2) not null,
  delivery_price   numeric(10,2) not null,
  tax_amount       numeric(10,2) not null,
  total_amount     numeric(10,2) not null,
  payment_method   text check (payment_method in ('deposit','stripe')),
  status           text default 'pending'
                   check (status in ('pending','paid','printing','shipped','delivered','cancelled')),
  tracking_number  text,
  notes            text,
  created_at       timestamptz default now(),
  paid_at          timestamptz
);

alter table public.certificate_orders enable row level security;

create policy "ATCs manage own cert orders" on public.certificate_orders
  for all using (auth.uid() = atc_id);

create policy "Admins manage all cert orders" on public.certificate_orders
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

create index if not exists idx_cert_orders_atc on public.certificate_orders(atc_id);
create index if not exists idx_cert_orders_candidate on public.certificate_orders(candidate_id);

-- ─────────────────────────────────────────────
-- 5. App-wide settings (delivery & tax)
--    Single-row keyed table; admin can update, anyone can read
-- ─────────────────────────────────────────────
create table if not exists public.app_settings (
  key text primary key,
  value numeric(10,4) not null,
  description text,
  updated_at timestamptz default now()
);

alter table public.app_settings enable row level security;

create policy "Anyone authenticated reads settings" on public.app_settings
  for select to authenticated using (true);

create policy "Admins update settings" on public.app_settings
  for all using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

insert into public.app_settings (key, value, description) values
  ('certificate_hardcopy_price', 15.00, 'Price per hard-copy certificate (USD)'),
  ('certificate_delivery_price', 8.00,  'Flat delivery / shipping fee (USD)'),
  ('certificate_tax_rate',       0.05,  'Tax rate as decimal (e.g. 0.05 = 5%)')
on conflict (key) do nothing;
