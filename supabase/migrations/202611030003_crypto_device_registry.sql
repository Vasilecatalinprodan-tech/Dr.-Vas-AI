-- Dr.Vas Crypto: administrator-controlled device registry only.
-- This migration does NOT enable mining, wallet custody, exchange access, or trading.
begin;

create table if not exists public.drvas_crypto_devices (
  id uuid primary key default gen_random_uuid(),
  device_name text not null,
  platform text not null,
  device_key_fingerprint text not null unique,
  public_key_jwk jsonb not null,
  status text not null default 'pending',
  requested_by uuid not null references auth.users(id) on delete restrict,
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  revoked_at timestamptz,
  last_seen_at timestamptz,
  constraint drvas_crypto_devices_name_check check (length(device_name) between 2 and 80),
  constraint drvas_crypto_devices_platform_check check (platform in ('windows','macos','linux','android','ios','other')),
  constraint drvas_crypto_devices_fingerprint_check check (length(device_key_fingerprint) between 32 and 128),
  constraint drvas_crypto_devices_status_check check (status in ('pending','authorized','revoked')),
  constraint drvas_crypto_devices_approval_check check (
    (status = 'authorized' and approved_by is not null and approved_at is not null)
    or status <> 'authorized'
  )
);

create index if not exists drvas_crypto_devices_status_created_idx
  on public.drvas_crypto_devices(status, created_at desc);
create index if not exists drvas_crypto_devices_requester_idx
  on public.drvas_crypto_devices(requested_by, created_at desc);

alter table public.drvas_crypto_devices enable row level security;
revoke all on public.drvas_crypto_devices from anon, authenticated;
grant select, insert, update, delete on public.drvas_crypto_devices to service_role;

comment on table public.drvas_crypto_devices is
  'Server-only registry for administrator-authorized devices. No client-role access. Does not itself execute mining or trading.';
comment on column public.drvas_crypto_devices.device_key_fingerprint is
  'SHA-256 fingerprint of a device public key; never a private key or secret.';
comment on column public.drvas_crypto_devices.public_key_jwk is
  'Public verification key only. Never store private key material, seed phrases, API secrets, or passwords.';

commit;
