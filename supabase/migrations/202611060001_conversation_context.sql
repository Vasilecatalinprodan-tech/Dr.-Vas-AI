-- Add explicit context to new Dr.Vas conversations without guessing legacy history.
begin;

alter table public.drvas_conversation_metadata
  add column if not exists module text,
  add column if not exists conversation_kind text,
  add column if not exists feature_key text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'drvas_conversation_metadata_module_check'
      and conrelid = 'public.drvas_conversation_metadata'::regclass
  ) then
    alter table public.drvas_conversation_metadata
      add constraint drvas_conversation_metadata_module_check
      check (module is null or module in ('free','health','studio','academy','commerce','business'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'drvas_conversation_metadata_kind_check'
      and conrelid = 'public.drvas_conversation_metadata'::regclass
  ) then
    alter table public.drvas_conversation_metadata
      add constraint drvas_conversation_metadata_kind_check
      check (conversation_kind is null or conversation_kind in ('general','module_assistant','feature_assistant'));
  end if;

  if not exists (
    select 1 from pg_constraint
    where conname = 'drvas_conversation_metadata_feature_key_check'
      and conrelid = 'public.drvas_conversation_metadata'::regclass
  ) then
    alter table public.drvas_conversation_metadata
      add constraint drvas_conversation_metadata_feature_key_check
      check (feature_key is null or char_length(feature_key) <= 100);
  end if;
end $$;

create index if not exists drvas_conversation_metadata_context_idx
  on public.drvas_conversation_metadata(user_id, module, archived_at, updated_at desc);

comment on column public.drvas_conversation_metadata.module is
  'Owning Dr.Vas module for newly classified conversations. NULL means legacy context is unknown and must not be guessed.';
comment on column public.drvas_conversation_metadata.conversation_kind is
  'general, module_assistant, or feature_assistant; NULL is retained for legacy conversations.';
comment on column public.drvas_conversation_metadata.feature_key is
  'Optional stable feature workspace key, e.g. business_accounting.';

commit;
