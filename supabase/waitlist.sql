-- ─────────────────────────────────────────────────────────────────────────
-- RedPen / Punane Pastakas — waitlist table + security policy
-- Run this ONCE in the new Free Supabase project:
--   Dashboard → SQL Editor → New query → paste → Run
-- Region for the project should be EU (eu-central) for GDPR data residency.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists public.waitlist (
  id           uuid primary key default gen_random_uuid(),
  email        text not null
                 check (position('@' in email) > 1 and char_length(email) <= 320),
  created_at   timestamptz not null default now(),
  source       text default 'landing-v1',   -- which page/variant the signup came from
  locale       text default 'et',            -- 'et' | 'en' from the page language toggle
  consent      boolean not null default false,
  confirmed_at timestamptz                   -- reserved for future double opt-in (null = unconfirmed)
);

-- Case-insensitive de-dupe: a refresh or a bot cannot pile up duplicate rows.
-- A repeat signup surfaces to the client as Postgres error code 23505.
create unique index if not exists waitlist_email_unique
  on public.waitlist (lower(email));

-- ── Row Level Security: the single control that makes the public anon key safe.
alter table public.waitlist enable row level security;

-- Allow anonymous visitors to INSERT a signup...
drop policy if exists "anon can insert waitlist" on public.waitlist;
create policy "anon can insert waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- ...and DO NOT create any SELECT/UPDATE/DELETE policy for anon.
-- With RLS on and no read policy, the public key CANNOT read the list back.
-- You read it yourself in the Dashboard → Table Editor, or via the
-- service_role key from a trusted server (never in the page).

-- ── How to verify after wiring the form:
--   1. Submit the form on the live page → a row appears in Table Editor.
--   2. In the page's browser console:
--        const c = supabase.createClient(URL, ANON_KEY);
--        await c.from('waitlist').select('*');   // must return []  (reads blocked)
--   Inserts succeed, reads return nothing. That is the correct, secure state.
