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

-- ============================================================
-- Profiles & member approval
-- ============================================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  name text not null,
  phone text,
  role text not null default 'member' check (role in ('admin','member')),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_status_idx on profiles(status);
create index if not exists profiles_role_idx on profiles(role);

-- Auto-create a profile row when a Supabase Auth user signs up.
-- The signup form supplies name/phone via raw_user_meta_data so the
-- trigger can lift them into the profile.
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, name, phone)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''), '@', 1)),
    new.raw_user_meta_data->>'phone'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_user();

-- ============================================================
-- Cross-user calendar viewing
-- ============================================================
create table if not exists calendar_views (
  user_id uuid not null references auth.users(id) on delete cascade,
  viewed_user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, viewed_user_id)
);

create index if not exists tasks_user_done_idx on tasks(user_id, done);
create index if not exists tasks_due_at_idx on tasks(due_at);
create index if not exists events_user_starts_idx on events(user_id, starts_at);
create index if not exists notes_user_created_idx on notes(user_id, created_at desc);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table tasks enable row level security;
alter table events enable row level security;
alter table notes enable row level security;
alter table google_tokens enable row level security;
alter table profiles enable row level security;
alter table calendar_views enable row level security;

-- Tasks: owner can do anything; other approved users can SELECT only
-- if the viewer added the owner to their calendar_views.
drop policy if exists "tasks_owner" on tasks;
create policy "tasks_owner" on tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tasks_view_shared" on tasks;
create policy "tasks_view_shared" on tasks
  for select using (
    user_id in (
      select viewed_user_id from calendar_views where user_id = auth.uid()
    )
  );

drop policy if exists "events_owner" on events;
create policy "events_owner" on events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "notes_owner" on notes;
create policy "notes_owner" on notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Profiles: a user can read their own profile; approved members can read
-- the (limited) set of approved profiles for the member-selector. Admins
-- can read/write everyone via a separate policy enforced server-side
-- with the service role client.
drop policy if exists "profiles_self_read" on profiles;
create policy "profiles_self_read" on profiles
  for select using (auth.uid() = id);

drop policy if exists "profiles_self_update" on profiles;
create policy "profiles_self_update" on profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles_approved_read" on profiles;
create policy "profiles_approved_read" on profiles
  for select using (
    status = 'approved' and exists (
      select 1 from profiles me where me.id = auth.uid() and me.status = 'approved'
    )
  );

-- Calendar views: each user manages their own list of "I want to see X" rows.
drop policy if exists "calendar_views_owner" on calendar_views;
create policy "calendar_views_owner" on calendar_views
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ============================================================
-- Helper: promote an account to admin + approved.
-- Run AFTER the user has signed up at /signup.
-- Example:
--   select promote_to_admin('you@example.com');
-- ============================================================
create or replace function public.promote_to_admin(target_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id uuid;
begin
  select id into target_id from auth.users where email = target_email limit 1;
  if target_id is null then
    raise exception 'No auth user with email %', target_email;
  end if;
  update profiles
     set role = 'admin', status = 'approved', updated_at = now()
   where id = target_id;
end;
$$;
