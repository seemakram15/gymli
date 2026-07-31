-- The "receipts" Storage bucket was just created (previously missing
-- entirely — payment-receipt uploads were failing silently) with default
-- RLS: no policies means no access at all. Subscription-request receipts
-- are uploaded by the requester's own session to
-- receipts/subscription-requests/{their auth.uid()}/..., so they need an
-- explicit insert/select policy for that path. The service-provider
-- dashboard reads receipt_url via the admin (service-role) client, which
-- bypasses storage RLS entirely, same as elsewhere in this app.

create policy "Users upload own subscription receipts"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = 'subscription-requests'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

create policy "Users view own subscription receipts"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] = 'subscription-requests'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Existing payment-receipt uploads (payments/{user_id}/...) go through the
-- same bucket via the recording staff member's own session — cover that
-- path shape too so that pre-existing flow isn't left just as broken as it
-- was before this bucket existed.
create policy "Authenticated users upload payment receipts"
  on storage.objects for insert
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1] != 'subscription-requests'
    and auth.role() = 'authenticated'
  );

create policy "Authenticated users view payment receipts"
  on storage.objects for select
  using (
    bucket_id = 'receipts'
    and auth.role() = 'authenticated'
  );
