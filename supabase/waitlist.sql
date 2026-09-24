create table public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null check (char_length(email) <= 254 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  first_name text check (char_length(first_name) <= 80),
  role text check (role in ('MBA student','First-time founder','Working professional','Just curious')),
  interests text[] default '{}' check (interests <@ array['A startup idea','A life decision','A work proposal','A belief I want to test']::text[]),
  first_challenge text check (char_length(first_challenge) <= 280),
  source text check (char_length(source) <= 100),
  consent boolean not null check (consent = true),
  created_at timestamptz not null default now()
);

create unique index waitlist_email_unique on public.waitlist (lower(email));

alter table public.waitlist enable row level security;

create policy "Anyone can join the waitlist"
  on public.waitlist for insert
  to anon
  with check (consent = true);

-- No select, update or delete policies: nobody can read or change the list from the browser.
