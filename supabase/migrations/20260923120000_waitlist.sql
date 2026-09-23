-- Waitlist signups from the Devils Advocate site.
--
-- The site is static (GitHub Pages), so visitors' browsers write to this
-- table directly, using the project's public anon/publishable key. That is
-- only safe because the table is locked down: the public may INSERT a new
-- row and do nothing else. Nobody can read, change, or delete signups
-- except you, through the Supabase dashboard (or a service-role key, which
-- must never go in the site).
--
-- Safe to run more than once. Run it in Supabase: SQL Editor > New query.

create table if not exists public.waitlist (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  email       text not null,
  first_name  text,
  role        text,
  bring       text[] not null default '{}',
  idea        text,

  -- The site lowercases emails, so one person can only join once.
  constraint waitlist_email_unique unique (email),
  constraint waitlist_email_valid check (
    email = lower(email)
    and length(email) <= 254
    and email ~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]{2,}$'
  ),
  constraint waitlist_first_name_length check (first_name is null or length(first_name) <= 80),
  constraint waitlist_role_valid check (
    role is null or role in ('mba_student', 'first_time_founder', 'working_professional', 'just_curious')
  ),
  constraint waitlist_bring_valid check (
    bring <@ array['startup_idea', 'life_decision', 'work_proposal', 'belief']::text[]
  ),
  constraint waitlist_idea_length check (idea is null or length(idea) <= 200)
);

comment on table public.waitlist is 'Waitlist signups from the marketing site. Public can insert only.';

-- Row-level security on, and the public role may only add rows, and only
-- these columns (so it can't set id or created_at).
alter table public.waitlist enable row level security;

revoke all on table public.waitlist from anon, authenticated;
grant insert (email, first_name, role, bring, idea) on table public.waitlist to anon;

drop policy if exists "Anyone can join the waitlist" on public.waitlist;
create policy "Anyone can join the waitlist"
  on public.waitlist
  for insert
  to anon
  with check (true);

-- No select, update, or delete policies: with RLS on, that means no one
-- using the public key can read or change the list.
