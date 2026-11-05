-- Dr.Vas operational audit log.
-- The table is accessible only to the service role used by the Cloudflare Worker.
create table if not exists public.drvas_audit_logs (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  user_id uuid,
  event_type text not null,
  module text not null default 'unknown',
  status integer not null default 200,
  model text,
  duration_ms integer,
  error_code text
);

create index if not exists drvas_audit_logs_created_at_idx
  on public.drvas_audit_logs (created_at desc);
create index if not exists drvas_audit_logs_module_created_at_idx
  on public.drvas_audit_logs (module, created_at desc);
create index if not exists drvas_audit_logs_user_created_at_idx
  on public.drvas_audit_logs (user_id, created_at desc);

alter table public.drvas_audit_logs enable row level security;

revoke all on table public.drvas_audit_logs from anon, authenticated;
grant all on table public.drvas_audit_logs to service_role;
grant usage, select on sequence public.drvas_audit_logs_id_seq to service_role;

comment on table public.drvas_audit_logs is
  'Operational metadata only. Never store chat content, passwords, access tokens, or provider secrets here.';
