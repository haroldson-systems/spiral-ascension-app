-- ============================================================================
-- Billing ownership binding: billing_subscriptions.user_id  (idempotent, re-runnable)
--
-- Why: email is not a durable ownership key (it can change or be reused). New checkouts stamp the
-- Supabase user id on the Stripe session/subscription and the webhook writes it here; this migration
-- adds the column and back-fills existing rows once from auth.users, where the email is confirmed.
-- ============================================================================
begin;

alter table public.billing_subscriptions
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists billing_subscriptions_user_id_idx
  on public.billing_subscriptions (user_id);

-- One-time backfill: exact, case-insensitive email match against a CONFIRMED auth user.
-- auth.users.email is unique, so a match is unambiguous. Rows with no match stay unbound
-- (the app then refuses deletion with 409 and hides the portal button until support links them).
update public.billing_subscriptions b
   set user_id = u.id
  from auth.users u
 where b.user_id is null
   and b.customer_email is not null
   and lower(b.customer_email) = lower(u.email)
   and u.email_confirmed_at is not null;

-- Allow signed-in users to read their own row by user_id as well as by email (RLS; service role unaffected)
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public'
                   and tablename = 'billing_subscriptions' and policyname = 'billing_subscriptions_select_own_by_user_id') then
    create policy "billing_subscriptions_select_own_by_user_id"
      on public.billing_subscriptions for select to authenticated
      using (user_id = auth.uid());
  end if;
end $$;

notify pgrst, 'reload schema';
commit;

-- Postflight: how many rows are still unbound?
select count(*) filter (where user_id is null)     as unbound_rows,
       count(*) filter (where user_id is not null) as bound_rows
  from public.billing_subscriptions;
-- List unbound rows to hand-link via support (email + status only):
select id, customer_email, status, updated_at from public.billing_subscriptions where user_id is null order by updated_at desc;
