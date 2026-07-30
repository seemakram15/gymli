-- GymLi — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL → New Query)

-- ─────────────────────────────────────────────────────────────────
-- PROFILES (extends auth.users)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  phone_number text,
  cnic_number text,          -- Pakistani CNIC: 35202-1234567-1
  cnic_front_url text,
  cnic_back_url text,
  gender text check (gender in ('male', 'female', 'other')),
  date_of_birth date,
  address text,
  city text,
  state text,
  country text default 'Pakistan',
  emergency_contact_name text,
  emergency_contact_phone text,
  medical_notes text,
  avatar_url text,
  role text not null default 'member'
    check (role in ('superadmin', 'manager', 'instructor', 'staff', 'member')),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'suspended', 'frozen')),
  gym_id uuid,               -- FK added after gyms table
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'role', 'member')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────
-- GYMS (one owner → many gyms)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.gyms (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  address text,
  city text not null,
  phone text,
  email text,
  logo text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Add FK from profiles to gyms
alter table public.profiles
  add constraint profiles_gym_id_fkey
  foreign key (gym_id) references public.gyms(id) on delete set null;

-- ─────────────────────────────────────────────────────────────────
-- BILLING CYCLES
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.cycles (
  id uuid primary key default gen_random_uuid(),
  name text not null,          -- Monthly, Quarterly, Annual, etc.
  interval_days integer not null default 30,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now()
);

insert into public.cycles (name, interval_days) values
  ('Daily', 1),
  ('Weekly', 7),
  ('Monthly', 30),
  ('Quarterly', 90),
  ('Semi-Annual', 180),
  ('Annual', 365)
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────────
-- SERVICES
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now()
);

insert into public.services (name) values
  ('Gym Floor'), ('Personal Training'), ('Group Classes'), ('Swimming Pool'),
  ('Steam Room'), ('Locker'), ('Parking')
on conflict do nothing;

-- ─────────────────────────────────────────────────────────────────
-- PACKAGES (membership plans)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  cycle_id uuid not null references public.cycles(id),
  name text not null,
  amount numeric(10,2) not null default 0,
  description text,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz default now()
);

-- Package → Services (many-to-many)
create table if not exists public.package_services (
  package_id uuid references public.packages(id) on delete cascade,
  service_id uuid references public.services(id) on delete cascade,
  primary key (package_id, service_id)
);

-- ─────────────────────────────────────────────────────────────────
-- SUBSCRIPTIONS
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  package_id uuid references public.packages(id),
  gym_id uuid references public.gyms(id),
  start_date date,
  due_date date,
  expires_at timestamptz,
  amount_due numeric(10,2) not null default 0,
  amount_paid numeric(10,2) not null default 0,
  discount numeric(10,2) default 0,
  payment_status text not null default 'pending'
    check (payment_status in ('paid', 'pending', 'overdue')),
  status text not null default 'active'
    check (status in ('active', 'inactive', 'suspended', 'cancelled')),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_subscriptions_user on public.subscriptions(user_id);
create index if not exists idx_subscriptions_payment_status on public.subscriptions(payment_status);
create index if not exists idx_subscriptions_due_date on public.subscriptions(due_date);

-- ─────────────────────────────────────────────────────────────────
-- PAYMENTS
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  subscription_id uuid references public.subscriptions(id),
  gym_id uuid references public.gyms(id),
  amount numeric(10,2) not null,
  method text not null default 'cash'
    check (method in ('cash', 'card', 'bank_transfer', 'online')),
  status text not null default 'completed'
    check (status in ('completed', 'failed', 'refunded')),
  reference_number text,
  notes text,
  paid_at timestamptz default now(),
  created_at timestamptz default now()
);

create index if not exists idx_payments_user on public.payments(user_id);
create index if not exists idx_payments_paid_at on public.payments(paid_at);
create index if not exists idx_payments_gym on public.payments(gym_id);

-- ─────────────────────────────────────────────────────────────────
-- ATTENDANCE
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  gym_id uuid references public.gyms(id),
  branch_id uuid,
  checked_in_at timestamptz not null default now(),
  checked_out_at timestamptz
);

create index if not exists idx_attendance_user on public.attendance(user_id);
create index if not exists idx_attendance_date on public.attendance(checked_in_at);

-- ─────────────────────────────────────────────────────────────────
-- REMINDER SETTINGS
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.reminder_settings (
  id uuid primary key default gen_random_uuid(),
  gym_id uuid references public.gyms(id),
  due_soon_days integer not null default 3,
  due_soon_email boolean not null default true,
  due_soon_sms boolean not null default false,
  due_today_email boolean not null default true,
  due_today_sms boolean not null default false,
  overdue_intervals text not null default '3,7,14',
  overdue_email boolean not null default true,
  overdue_sms boolean not null default false,
  expiry_reminder_email boolean not null default true,
  expiry_reminder_sms boolean not null default false,
  expiry_reminder_days integer not null default 7,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(gym_id)
);

-- Insert default reminder settings
insert into public.reminder_settings (gym_id) values (null) on conflict do nothing;

-- ─────────────────────────────────────────────────────────────────
-- STORAGE BUCKETS
-- ─────────────────────────────────────────────────────────────────
-- Run in Supabase Dashboard → Storage → Create Buckets:
-- 1. "avatars"  — Public
-- 2. "cnic"     — Private (or authenticated-only)

-- ─────────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.gyms enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.packages enable row level security;
alter table public.cycles enable row level security;
alter table public.services enable row level security;
alter table public.package_services enable row level security;
alter table public.reminder_settings enable row level security;

-- Role-check helpers used by the policies below. These MUST be security
-- definer: a policy on `profiles` that subqueries `profiles` directly
-- re-triggers its own RLS evaluation and recurses infinitely ("infinite
-- recursion detected in policy for relation profiles"). Security definer
-- functions bypass RLS internally, breaking the cycle.
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

revoke all on function public.current_role_is_admin() from public;
revoke all on function public.current_role_is_admin_or_instructor() from public;
grant execute on function public.current_role_is_admin() to authenticated, anon, service_role;
grant execute on function public.current_role_is_admin_or_instructor() to authenticated, anon, service_role;

-- Gym-scoping helpers: RBAC is superadmin (sees everything) > manager
-- (CRUD scoped to their own gym_id) > instructor/staff (view own gym,
-- instructor can also record payments) > member (own records only).
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

-- Profiles: users can read/update their own row; superadmin sees/edits all;
-- managers CRUD member/instructor/staff rows in their own gym; instructors
-- and staff can view (not edit) their own gym's roster.
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

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

-- Gyms: superadmin manages all; managers can update only their own gym;
-- everyone can view active gyms (for dropdowns).
create policy "Anyone can view active gyms" on public.gyms
  for select using (status = 'active' or owner_id = auth.uid());

create policy "Superadmin manage all gyms" on public.gyms
  for all using (public.is_superadmin() or owner_id = auth.uid());

create policy "Managers update own gym" on public.gyms
  for update using (public.current_user_role() = 'manager' and id = public.current_user_gym_id())
  with check (public.current_user_role() = 'manager' and id = public.current_user_gym_id());

-- Subscriptions: gym-scoped (superadmin sees all); members view own
create policy "Gym-scoped manage subscriptions" on public.subscriptions
  for all using (public.can_access_gym(gym_id)) with check (public.can_access_gym(gym_id));

create policy "Members view own subscriptions" on public.subscriptions
  for select using (user_id = auth.uid());

-- Payments: gym-scoped (superadmin sees all); members view own
create policy "Gym-scoped manage payments" on public.payments
  for all using (public.can_access_gym(gym_id)) with check (public.can_access_gym(gym_id));

create policy "Members view own payments" on public.payments
  for select using (user_id = auth.uid());

-- Packages, cycles, services: read-only for everyone; mutation superadmin-only
-- (global config, not gym-scoped).
create policy "Anyone can view packages" on public.packages for select using (status = 'active');
create policy "Superadmin and managers manage packages" on public.packages
  for all using (public.is_superadmin() or public.current_user_role() = 'manager');

create policy "Anyone can view cycles" on public.cycles for select using (true);
create policy "Superadmin and managers manage cycles" on public.cycles
  for all using (public.is_superadmin() or public.current_user_role() = 'manager');

create policy "Anyone can view services" on public.services for select using (status = 'active');
create policy "Superadmin and managers manage services" on public.services
  for all using (public.is_superadmin() or public.current_user_role() = 'manager');

create policy "Anyone can view package_services" on public.package_services for select using (true);
create policy "Superadmin and managers manage package_services" on public.package_services
  for all using (public.is_superadmin() or public.current_user_role() = 'manager');

-- Attendance: gym-scoped (superadmin sees all); members view own
create policy "Gym-scoped manage attendance" on public.attendance
  for all using (public.can_access_gym(gym_id)) with check (public.can_access_gym(gym_id));
create policy "Members view own attendance" on public.attendance
  for select using (user_id = auth.uid());

-- Reminder settings: superadmin only (global config)
create policy "Superadmin manage reminder settings" on public.reminder_settings
  for all using (public.is_superadmin());

-- ─────────────────────────────────────────────────────────────────
-- REMINDER LOG (dedup so the daily cron doesn't re-send same-day)
-- ─────────────────────────────────────────────────────────────────
create table if not exists public.reminder_log (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.subscriptions(id) on delete cascade,
  kind text not null check (kind in ('due_soon', 'due_today', 'overdue', 'expiry')),
  sent_date date not null default current_date,
  created_at timestamptz default now(),
  unique(subscription_id, kind, sent_date)
);

alter table public.reminder_log enable row level security;

create policy "Superadmin manage reminder log" on public.reminder_log
  for all using (public.is_superadmin());

-- Lets the reminders cron (service role) resolve a member's login email —
-- profiles has no email column; it lives on auth.users.
create or replace function public.get_auth_email(uid uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select email from auth.users where id = uid;
$$;

revoke all on function public.get_auth_email(uuid) from public;
revoke all on function public.get_auth_email(uuid) from anon;
revoke all on function public.get_auth_email(uuid) from authenticated;
grant execute on function public.get_auth_email(uuid) to service_role;
