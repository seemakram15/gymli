-- Service Provider role + gated subscription-request flow.
--
-- A new signup's account starts 'pending' (no admin-dashboard access) until
-- the service provider approves a subscription_requests row, which flips
-- their profile to 'active' with the requested plan. 'suspended'/'inactive'
-- let the service provider revoke access later. The service_provider role
-- itself is never signup-able — seeded directly into the DB.

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('superadmin', 'manager', 'instructor', 'staff', 'member', 'service_provider'));

alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check
  check (status in ('active', 'inactive', 'suspended', 'frozen', 'pending'));

create table if not exists public.subscription_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  gym_id uuid references public.gyms(id) on delete set null,
  plan text not null check (plan in ('starter', 'pro')),
  amount numeric(10,2) not null,
  payment_method text not null check (payment_method in ('bank_transfer', 'jazzcash')),
  reference_number text,
  receipt_url text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.subscription_requests enable row level security;

-- The requester submits via their own session (locals.supabase), same as
-- how a payment or member-enrollment insert works today — so they need an
-- explicit insert/select policy for their own rows. The service-provider
-- dashboard reads/writes via the service-role admin client, which bypasses
-- RLS entirely, so no service_provider-specific policy is needed here.
create policy "Requesters manage own subscription requests"
  on public.subscription_requests for select
  using (user_id = auth.uid());

create policy "Requesters create own subscription requests"
  on public.subscription_requests for insert
  with check (user_id = auth.uid());
