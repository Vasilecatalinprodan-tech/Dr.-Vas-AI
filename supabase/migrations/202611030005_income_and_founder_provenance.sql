-- Dr.Vas independent income tracker + immutable founder provenance records.
-- Income opportunities are private and user-owned. Founder evidence is server-only.
begin;

create table if not exists public.drvas_income_opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  platform text not null default '' check (char_length(platform) <= 120),
  opportunity_type text not null check (opportunity_type in (
    'writing','translation','music','video','digital_product','freelance','other'
  )),
  status text not null default 'idea' check (status in (
    'idea','research','ready','submitted','accepted','paid','rejected'
  )),
  estimated_amount numeric(12,2) not null default 0 check (estimated_amount >= 0),
  actual_amount numeric(12,2) not null default 0 check (actual_amount >= 0),
  currency char(3) not null default 'GBP',
  next_action text not null default '' check (char_length(next_action) <= 500),
  notes text not null default '' check (char_length(notes) <= 10000),
  target_url text not null default '' check (char_length(target_url) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists drvas_income_user_updated_idx
  on public.drvas_income_opportunities(user_id, updated_at desc);
create index if not exists drvas_income_user_status_idx
  on public.drvas_income_opportunities(user_id, status);

alter table public.drvas_income_opportunities enable row level security;
drop policy if exists "Users manage their own income opportunities" on public.drvas_income_opportunities;
create policy "Users manage their own income opportunities"
  on public.drvas_income_opportunities for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
grant select, insert, update, delete on public.drvas_income_opportunities to authenticated;
revoke all on public.drvas_income_opportunities from anon;

create table if not exists public.drvas_founder_provenance (
  id uuid primary key default gen_random_uuid(),
  record_version integer not null default 1 check (record_version > 0),
  encrypted_payload text not null,
  payload_sha256 char(64) not null,
  signature_base64 text not null,
  signature_algorithm text not null default 'Ed25519'
    check (signature_algorithm = 'Ed25519'),
  public_key_id text not null check (char_length(public_key_id) between 1 and 100),
  encryption_algorithm text not null default 'AES-256-GCM'
    check (encryption_algorithm = 'AES-256-GCM'),
  source_commit_sha text not null default '' check (char_length(source_commit_sha) <= 64),
  signed_at timestamptz not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create index if not exists drvas_founder_provenance_signed_idx
  on public.drvas_founder_provenance(signed_at desc);
alter table public.drvas_founder_provenance enable row level security;
revoke all on public.drvas_founder_provenance from anon, authenticated;
grant select, insert on public.drvas_founder_provenance to service_role;

comment on table public.drvas_income_opportunities is
  'Private per-user tracker for legitimate online income opportunities; it does not execute payments or publish content.';
comment on table public.drvas_founder_provenance is
  'Server-only encrypted and digitally signed founder-origin records. Never store plaintext private keys or personal secrets here.';
comment on column public.drvas_founder_provenance.payload_sha256 is
  'SHA-256 digest of the canonical plaintext provenance record; integrity commitment, not standalone proof of identity.';
comment on column public.drvas_founder_provenance.signature_base64 is
  'Ed25519 signature over the canonical record digest and signed timestamp.';

commit;
