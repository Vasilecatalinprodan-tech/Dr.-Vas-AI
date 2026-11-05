-- Private, per-user attachments for all Dr.Vas chat modules.
-- Files remain in the private drvas-media bucket; this table stores only metadata and ownership.
begin;

alter table public.drvas_privacy_consents
  drop constraint if exists drvas_privacy_consents_type_check;

alter table public.drvas_privacy_consents
  add constraint drvas_privacy_consents_type_check
  check (consent_type in (
    'terms_of_service',
    'privacy_notice',
    'marketing_email',
    'marketing_sms',
    'optional_profile_data',
    'health_data_processing',
    'file_processing'
  ));

create table if not exists public.drvas_chat_attachments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id text not null check (char_length(conversation_id) between 1 and 160),
  module text not null check (module in ('free','health','studio','academy','commerce','business')),
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null check (mime_type in (
    'image/jpeg','image/png','image/webp',
    'application/pdf','text/plain','text/csv'
  )),
  file_size bigint not null check (file_size between 1 and 15728640),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  constraint drvas_chat_attachments_storage_path_owner
    check (storage_path like user_id::text || '/%')
);

create index if not exists drvas_chat_attachments_conversation_idx
  on public.drvas_chat_attachments(user_id, conversation_id, module, created_at desc);

alter table public.drvas_chat_attachments enable row level security;
revoke all on table public.drvas_chat_attachments from public, anon;
grant select, insert, delete on public.drvas_chat_attachments to authenticated;

drop policy if exists "Users can read their own DrVas chat attachments" on public.drvas_chat_attachments;
create policy "Users can read their own DrVas chat attachments"
  on public.drvas_chat_attachments for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own DrVas chat attachments" on public.drvas_chat_attachments;
create policy "Users can create their own DrVas chat attachments"
  on public.drvas_chat_attachments for insert to authenticated
  with check (
    auth.uid() = user_id
    and storage_path like auth.uid()::text || '/' || conversation_id || '/' || module || '/%'
  );

drop policy if exists "Users can delete their own DrVas chat attachments" on public.drvas_chat_attachments;
create policy "Users can delete their own DrVas chat attachments"
  on public.drvas_chat_attachments for delete to authenticated
  using (auth.uid() = user_id);

-- Keep the existing private bucket and per-user Storage RLS policies.
-- Expand only the allow-list needed by the universal chat uploader.
update storage.buckets
set public = false,
    file_size_limit = 52428800,
    allowed_mime_types = array[
      'image/jpeg','image/png','image/webp',
      'application/pdf','text/plain','text/csv',
      'video/mp4','audio/mpeg','audio/wav','audio/mp4','audio/aac'
    ]
where id = 'drvas-media';

comment on table public.drvas_chat_attachments is
  'Private per-user file metadata for Dr.Vas chat across all six modules. Binary content stays in the private drvas-media bucket.';

commit;
