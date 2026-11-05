-- Private user-owned bookkeeping entries for the Dr.Vas Business workspace.
begin;

create table if not exists public.drvas_business_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  transaction_date date not null default current_date,
  entry_type text not null check (entry_type in ('income','expense')),
  description text not null check (char_length(description) between 1 and 240),
  category text not null default 'General' check (char_length(category) between 1 and 80),
  amount numeric(14,2) not null check (amount > 0),
  currency text not null default 'GBP' check (currency in ('GBP','EUR','RON','CHF','USD')),
  vat_rate numeric(5,2) not null default 0 check (vat_rate between 0 and 100),
  vat_included boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drvas_business_transactions_owner_date_idx
  on public.drvas_business_transactions (user_id, transaction_date desc, created_at desc);

alter table public.drvas_business_transactions enable row level security;
revoke all on table public.drvas_business_transactions from public, anon;
grant select, insert, update, delete on public.drvas_business_transactions to authenticated;

drop policy if exists "Users can read their own bookkeeping entries" on public.drvas_business_transactions;
create policy "Users can read their own bookkeeping entries"
  on public.drvas_business_transactions for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own bookkeeping entries" on public.drvas_business_transactions;
create policy "Users can create their own bookkeeping entries"
  on public.drvas_business_transactions for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own bookkeeping entries" on public.drvas_business_transactions;
create policy "Users can update their own bookkeeping entries"
  on public.drvas_business_transactions for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own bookkeeping entries" on public.drvas_business_transactions;
create policy "Users can delete their own bookkeeping entries"
  on public.drvas_business_transactions for delete to authenticated
  using (auth.uid() = user_id);

comment on table public.drvas_business_transactions is
  'Private user-owned cashbook entries for Dr.Vas Business. Not a statutory accounting ledger or tax filing system.';

commit;
