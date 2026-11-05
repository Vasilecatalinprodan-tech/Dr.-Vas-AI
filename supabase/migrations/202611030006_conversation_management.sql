-- Private per-user conversation labels and archive state for Dr.Vas.
begin;

create table if not exists public.drvas_conversation_metadata (
  user_id uuid not null references auth.users(id) on delete cascade,
  conversation_id text not null check (char_length(conversation_id) between 1 and 160),
  title text not null default '' check (char_length(title) <= 120),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, conversation_id)
);

create index if not exists drvas_conversation_metadata_archived_idx
  on public.drvas_conversation_metadata(user_id, archived_at);

alter table public.drvas_conversation_metadata enable row level security;
drop policy if exists "Users manage their own conversation metadata" on public.drvas_conversation_metadata;
create policy "Users manage their own conversation metadata"
  on public.drvas_conversation_metadata
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.drvas_conversation_metadata to authenticated;
revoke all on public.drvas_conversation_metadata from anon;

comment on table public.drvas_conversation_metadata is
  'Private per-user titles and archive state for Dr.Vas chat conversations; message content remains in chat_messages.';

commit;
