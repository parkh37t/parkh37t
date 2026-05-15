-- Run in the Supabase SQL editor (or `supabase db push`)
-- to provision the dashboard schema.

create extension if not exists "uuid-ossp";

create table if not exists tasks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  done boolean not null default false,
  priority text check (priority in ('low','med','high')),
  category text check (category in ('work','personal','health','study','default')) default 'default',
  due_at timestamptz,
  ends_at timestamptz,
  google_event_id text,
  created_at timestamptz not null default now()
);

alter table tasks add column if not exists google_event_id text;
alter table tasks add column if not exists ends_at timestamptz;

create table if not exists events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  category text check (category in ('work','personal','health','study','default')) default 'default',
  source text check (source in ('local','google')) default 'local',
  external_id text,
  created_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists google_tokens (
  id text primary key default 'default' check (id = 'default'),
  access_token text not null,
  refresh_token text,
  expiry_date bigint,
  scope text,
  token_type text,
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_done_idx on tasks(user_id, done);
create index if not exists events_user_starts_idx on events(user_id, starts_at);
create index if not exists notes_user_created_idx on notes(user_id, created_at desc);

-- RLS
alter table tasks enable row level security;
alter table events enable row level security;
alter table notes enable row level security;
alter table google_tokens enable row level security;

create policy "tasks_owner" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "events_owner" on events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notes_owner" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
