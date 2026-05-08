-- ============================================================
-- Support Messages Migration
-- Run this in Supabase SQL Editor AFTER admin-migration.sql
-- ============================================================
-- Adds a conversation thread to support tickets so both ATPs and
-- admins can post multiple replies. The legacy support_tickets.admin_reply
-- column is kept for backward compatibility with old tickets but new
-- code writes to support_messages instead.

create table if not exists public.support_messages (
  id uuid primary key default uuid_generate_v4(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_role text not null check (author_role in ('atp', 'admin')),
  body text not null,
  created_at timestamptz default now()
);

create index if not exists support_messages_ticket_id_idx
  on public.support_messages(ticket_id);

create index if not exists support_messages_created_at_idx
  on public.support_messages(created_at);

alter table public.support_messages enable row level security;

-- ATPs can read messages on their own tickets
create policy "ATPs can read messages on own tickets" on public.support_messages
  for select using (
    exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id and t.atc_id = auth.uid()
    )
  );

-- ATPs can post messages on their own tickets, but only while the
-- ticket is open or in_progress. Resolved/closed tickets are read-only
-- for the ATP. The author_id and author_role must match the caller.
create policy "ATPs can post on active own tickets" on public.support_messages
  for insert with check (
    author_id = auth.uid()
    and author_role = 'atp'
    and exists (
      select 1 from public.support_tickets t
      where t.id = ticket_id
        and t.atc_id = auth.uid()
        and t.status in ('open', 'in_progress')
    )
  );

-- Admins can read all messages
create policy "Admins can read all messages" on public.support_messages
  for select using (
    exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Admins can post messages on any ticket regardless of status
create policy "Admins can post on any ticket" on public.support_messages
  for insert with check (
    author_role = 'admin'
    and author_id = auth.uid()
    and exists (select 1 from public.profiles where id = auth.uid() and is_admin = true)
  );

-- Bumping support_tickets.updated_at when a new message is posted
-- helps admins sort by most recent activity.
create or replace function public.bump_support_ticket_updated_at()
returns trigger as $$
begin
  update public.support_tickets
  set updated_at = now()
  where id = new.ticket_id;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists support_messages_bump_ticket on public.support_messages;
create trigger support_messages_bump_ticket
  after insert on public.support_messages
  for each row execute function public.bump_support_ticket_updated_at();
