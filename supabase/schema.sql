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
    check (role in ('owner', 'manager', 'instructor', 'staff', 'member')),
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

-- Profiles: users can read their own; owners/managers can read all
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

create policy "Admins can view all profiles" on public.profiles
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
  );

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can update all profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
  );

create policy "Admins can insert profiles" on public.profiles
  for insert with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
  );

-- Gyms: owners can manage their own gyms; everyone can view active gyms
create policy "Anyone can view active gyms" on public.gyms
  for select using (status = 'active' or owner_id = auth.uid());

create policy "Owners can manage their gyms" on public.gyms
  for all using (owner_id = auth.uid());

-- Subscriptions: admins full access; members view own
create policy "Admins full access to subscriptions" on public.subscriptions
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
  );

create policy "Members view own subscriptions" on public.subscriptions
  for select using (user_id = auth.uid());

-- Payments: admins full access; members view own
create policy "Admins full access to payments" on public.payments
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
  );

create policy "Members view own payments" on public.payments
  for select using (user_id = auth.uid());

-- Packages, cycles, services: read-only for members; full for admins
create policy "Anyone can view packages" on public.packages for select using (status = 'active');
create policy "Admins manage packages" on public.packages for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
);

create policy "Anyone can view cycles" on public.cycles for select using (true);
create policy "Admins manage cycles" on public.cycles for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
);

create policy "Anyone can view services" on public.services for select using (status = 'active');
create policy "Admins manage services" on public.services for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
);

create policy "Anyone can view package_services" on public.package_services for select using (true);
create policy "Admins manage package_services" on public.package_services for all using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
);

-- Attendance: members see own; admins see all
create policy "Admins view all attendance" on public.attendance
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager','instructor'))
  );
create policy "Members view own attendance" on public.attendance
  for select using (user_id = auth.uid());

-- Reminder settings: admins only
create policy "Admins manage reminder settings" on public.reminder_settings
  for all using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('owner','manager'))
  );
