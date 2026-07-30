-- GymLi — extend manager permissions to Membership Plans / Billing Cycles /
-- Services (global config shared across gyms) and Staff CRUD (already
-- covered by the existing "Managers manage own-gym staff-tier profiles"
-- policy from 0002 — no RLS change needed there, only the app layer).

drop policy if exists "Superadmin manage packages" on public.packages;
create policy "Superadmin and managers manage packages" on public.packages
  for all using (public.is_superadmin() or public.current_user_role() = 'manager');

drop policy if exists "Superadmin manage cycles" on public.cycles;
create policy "Superadmin and managers manage cycles" on public.cycles
  for all using (public.is_superadmin() or public.current_user_role() = 'manager');

drop policy if exists "Superadmin manage services" on public.services;
create policy "Superadmin and managers manage services" on public.services
  for all using (public.is_superadmin() or public.current_user_role() = 'manager');

drop policy if exists "Superadmin manage package_services" on public.package_services;
create policy "Superadmin and managers manage package_services" on public.package_services
  for all using (public.is_superadmin() or public.current_user_role() = 'manager');
