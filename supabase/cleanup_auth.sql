-- ============================================================
-- Cleanup: drop everything added by the reverted auth/member work.
-- Run this once in the Supabase SQL editor.
-- ============================================================

-- Drop helper function
drop function if exists public.promote_to_admin(text);

-- Drop trigger + function that mirrored auth.users -> profiles
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_auth_user();

-- Drop cross-user calendar viewing table
drop table if exists calendar_views;

-- Drop the "view shared tasks" policy (profiles is going away so this
-- can no longer be satisfied anyway).
drop policy if exists "tasks_view_shared" on tasks;

-- Drop profile-related policies and the table itself.
drop policy if exists "profiles_self_read" on profiles;
drop policy if exists "profiles_self_update" on profiles;
drop policy if exists "profiles_approved_read" on profiles;
drop table if exists profiles;
