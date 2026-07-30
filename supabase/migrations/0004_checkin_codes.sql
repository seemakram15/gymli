-- Rotating member check-in codes, attendance method tracking, and reminder
-- settings/log extensions for grace-period access blocking and the new
-- attendance-based re-engagement reminder.

-- ─────────────────────────────────────────────────────────────────
-- Member self-service check-in codes
-- ─────────────────────────────────────────────────────────────────
alter table public.profiles add column if not exists checkin_code text;
alter table public.profiles add column if not exists checkin_code_expires_at timestamptz;

create unique index if not exists idx_profiles_checkin_code
  on public.profiles(checkin_code) where checkin_code is not null;

-- ─────────────────────────────────────────────────────────────────
-- Attendance: track whether a check-in was staff-picked or code-based
-- ─────────────────────────────────────────────────────────────────
alter table public.attendance add column if not exists checkin_method text
  not null default 'manual' check (checkin_method in ('manual', 'code'));

-- ─────────────────────────────────────────────────────────────────
-- Reminder settings: overdue grace period + inactivity re-engagement
-- ─────────────────────────────────────────────────────────────────
alter table public.reminder_settings add column if not exists overdue_grace_days integer not null default 0;
alter table public.reminder_settings add column if not exists inactivity_days integer not null default 14;
alter table public.reminder_settings add column if not exists inactivity_email boolean not null default false;

-- ─────────────────────────────────────────────────────────────────
-- Reminder log: the inactivity reminder is per-member, not per-subscription,
-- so subscription_id must become optional and a user_id column is added.
-- ─────────────────────────────────────────────────────────────────
alter table public.reminder_log alter column subscription_id drop not null;
alter table public.reminder_log add column if not exists user_id uuid references public.profiles(id) on delete cascade;

alter table public.reminder_log drop constraint if exists reminder_log_kind_check;
alter table public.reminder_log add constraint reminder_log_kind_check
  check (kind in ('due_soon', 'due_today', 'overdue', 'expiry', 'inactivity'));

alter table public.reminder_log drop constraint if exists reminder_log_target_check;
alter table public.reminder_log add constraint reminder_log_target_check
  check (subscription_id is not null or user_id is not null);

-- The old unique(subscription_id, kind, sent_date) constraint still exists
-- and is harmless (never matched by user_id-only rows); add a matching one
-- for the user-scoped path so the inactivity reminder dedupes per day.
create unique index if not exists idx_reminder_log_user_kind_date
  on public.reminder_log(user_id, kind, sent_date) where user_id is not null;
