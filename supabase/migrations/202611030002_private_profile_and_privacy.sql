-- Dr.Vas private account data and privacy consent foundations.
-- Sensitive profile attributes are stored only as authenticated ciphertext written by the Worker.
-- Never write plaintext phone, DOB, address or company identifiers into this table.
begin;

create table if not exists public.drvas_private_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  encrypted_payload text not null,
  encryption_version smallint not null default 1,
  key_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint drvas_private_profiles_payload_nonempty check (length(encrypted_payload) > 20),
  constraint drvas_private_profiles_key_version_nonempty check (length(key_version) between 1 and 64)
);

comment on table public.drvas_private_profiles is 'Worker-only encrypted profile payload. Client roles must never read or write this table directly.';
comment on column public.drvas_private_profiles.encrypted_payload is 'Authenticated ciphertext produced server-side with AES-256-GCM; never plaintext or client-generated ciphertext.';
comment on column public.drvas_private_profiles.key_version is 'Identifier for the Cloudflare Worker encryption-key version; contains no key material.';

alter table public.drvas_private_profiles enable row level security;
revoke all on public.drvas_private_profiles from anon, authenticated;
grant select, insert, update, delete on public.drvas_private_profiles to service_role;

create table if not exists public.drvas_privacy_consents (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  policy_version text not null,
  granted boolean not null,
  recorded_at timestamptz not null default now(),
  constraint drvas_privacy_consents_type_check check (consent_type in ('terms_of_service','privacy_notice','marketing_email','marketing_sms','optional_profile_data','health_data_processing')),
  constraint drvas_privacy_consents_policy_version_nonempty check (length(policy_version) between 1 and 64)
);

create index if not exists drvas_privacy_consents_user_time_idx on public.drvas_privacy_consents(user_id, recorded_at desc);
comment on table public.drvas_privacy_consents is 'Minimal versioned consent evidence. Do not store full form payloads, IP addresses or secrets here.';

alter table public.drvas_privacy_consents enable row level security;
revoke all on public.drvas_privacy_consents from anon, authenticated;
grant select, insert, update, delete on public.drvas_privacy_consents to service_role;
grant usage, select on sequence public.drvas_privacy_consents_id_seq to service_role;

commit;
