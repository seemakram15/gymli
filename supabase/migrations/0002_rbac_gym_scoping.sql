-- GymLi — RBAC + gym-scoping migration
-- Renames 'owner' role to 'superadmin', adds gym-scoped RLS so managers/
-- instructors/staff only see their own gym's data, and adds a status
-- column to cycles so it can soft-delete like packages/services.

-- ─────────────────────────────────────────────────────────────────
-- 1. Role rename: owner -> superadmin
-- Constraint must be dropped BEFORE the data update, since the old
-- constraint doesn't allow 'superadmin' as a value.
-- ─────────────────────────────────────────────────────────────────
alter table public.profiles drop constraint if exists profiles_role_check;

update public.profiles set role = 'superadmin' where role = 'owner';

alter table public.profiles add constraint profiles_role_check
  check (role in ('superadmin', 'manager', 'instructor', 'staff', 'member'));

-- ─────────────────────────────────────────────────────────────────
-- 2. cycles.status — lets Billing Cycles soft-delete like packages/services
-- ─────────────────────────────────────────────────────────────────
alter table public.cycles add column if not exists status text not null default 'active'
  check (status in ('active', 'inactive'));

-- ─────────────────────────────────────────────────────────────────
-- 3. New security-definer helper functions
-- ─────────────────────────────────────────────────────────────────
create or replace function public.current_user_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.current_user_gym_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select gym_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'superadmin'
  );
$$;

create or replace function public.can_access_gym(target_gym_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select public.is_superadmin()
    or (target_gym_id is not null and target_gym_id = public.current_user_gym_id());
$$;

revoke all on function public.current_user_role() from public;
revoke all on function public.current_user_gym_id() from public;
revoke all on function public.is_superadmin() from public;
revoke all on function public.can_access_gym(uuid) from public;
grant execute on function public.current_user_role() to authenticated, anon, service_role;
grant execute on function public.current_user_gym_id() to authenticated, anon, service_role;
grant execute on function public.is_superadmin() to authenticated, anon, service_role;
grant execute on function public.can_access_gym(uuid) to authenticated, anon, service_role;

-- Update existing helpers in place (still used for global, non-gym-scoped
-- config: packages/cycles/services/package_services/reminder_settings).
create or replace function public.current_role_is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('superadmin', 'manager')
  );
$$;

create or replace function public.current_role_is_admin_or_instructor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('superadmin', 'manager', 'instructor')
  );
$$;

-- ─────────────────────────────────────────────────────────────────
-- 4. Rewritten RLS policies
-- ─────────────────────────────────────────────────────────────────

-- profiles
drop policy if exists "Admins can view all profiles" on public.profiles;
drop policy if exists "Admins can update all profiles" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;

create policy "Superadmin full access to profiles" on public.profiles
  for all using (public.is_superadmin());

create policy "Managers manage own-gym staff-tier profiles" on public.profiles
  for all using (
    public.current_user_role() = 'manager'
    and gym_id = public.current_user_gym_id()
    and role in ('member', 'instructor', 'staff')
  ) with check (
    public.current_user_role() = 'manager'
    and gym_id = public.current_user_gym_id()
    and role in ('member', 'instructor', 'staff')
  );

create policy "Instructors and staff view own-gym profiles" on public.profiles
  for select using (
    public.current_user_role() in ('instructor', 'staff')
    and gym_id = public.current_user_gym_id()
  );

-- gyms
drop policy if exists "Owners can manage their gyms" on public.gyms;

create policy "Superadmin manage all gyms" on public.gyms
  for all using (public.is_superadmin() or owner_id = auth.uid());

create policy "Managers update own gym" on public.gyms
  for update using (public.current_user_role() = 'manager' and id = public.current_user_gym_id())
  with check (public.current_user_role() = 'manager' and id = public.current_user_gym_id());

-- subscriptions / payments / attendance — gym-scoped instead of blanket admin
drop policy if exists "Admins full access to subscriptions" on public.subscriptions;
create policy "Gym-scoped manage subscriptions" on public.subscriptions
  for all using (public.can_access_gym(gym_id)) with check (public.can_access_gym(gym_id));

drop policy if exists "Admins full access to payments" on public.payments;
create policy "Gym-scoped manage payments" on public.payments
  for all using (public.can_access_gym(gym_id)) with check (public.can_access_gym(gym_id));

drop policy if exists "Admins view all attendance" on public.attendance;
create policy "Gym-scoped manage attendance" on public.attendance
  for all using (public.can_access_gym(gym_id)) with check (public.can_access_gym(gym_id));

-- packages / cycles / services / package_services / reminder_settings —
-- global config, mutation tightened to superadmin-only. Anyone-can-view
-- select policies stay untouched (still needed for dropdowns).
drop policy if exists "Admins manage packages" on public.packages;
create policy "Superadmin manage packages" on public.packages for all using (public.is_superadmin());

drop policy if exists "Admins manage cycles" on public.cycles;
create policy "Superadmin manage cycles" on public.cycles for all using (public.is_superadmin());

drop policy if exists "Admins manage services" on public.services;
create policy "Superadmin manage services" on public.services for all using (public.is_superadmin());

drop policy if exists "Admins manage package_services" on public.package_services;
create policy "Superadmin manage package_services" on public.package_services for all using (public.is_superadmin());

drop policy if exists "Admins manage reminder settings" on public.reminder_settings;
create policy "Superadmin manage reminder settings" on public.reminder_settings for all using (public.is_superadmin());

drop policy if exists "Admins manage reminder log" on public.reminder_log;
create policy "Superadmin manage reminder log" on public.reminder_log for all using (public.is_superadmin());
