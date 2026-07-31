-- Each gym-owning superadmin is one billing account; the plan they're on
-- (set on their own profile row) caps how many gyms/members/staff that
-- account can create across every gym they own.
alter table public.profiles
  add column if not exists plan text not null default 'starter'
  check (plan in ('starter', 'pro', 'custom'));
