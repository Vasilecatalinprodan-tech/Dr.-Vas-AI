-- Private, owner-scoped Library files stored independently of chat history.
begin;

create table if not exists public.drvas_library_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  original_name text not null check (char_length(original_name) between 1 and 255),
  mime_type text not null check (mime_type in ('image/jpeg','image/png','image/webp','application/pdf','text/plain','text/csv')),
  file_size bigint not null check (file_size between 1 and 15728640),
  storage_path text not null unique,
  created_at timestamptz not null default now(),
  constraint drvas_library_items_storage_path_owner
    check (storage_path like user_id::text || '/library/%')
);

create index if not exists drvas_library_items_owner_created_idx
  on public.drvas_library_items(user_id, created_at desc);

alter table public.drvas_library_items enable row level security;
revoke all on table public.drvas_library_items from public, anon;
grant select, insert, delete on public.drvas_library_items to authenticated;

drop policy if exists "Users can read their own DrVas Library items" on public.drvas_library_items;
create policy "Users can read their own DrVas Library items"
  on public.drvas_library_items for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can add their own DrVas Library items" on public.drvas_library_items;
create policy "Users can add their own DrVas Library items"
  on public.drvas_library_items for insert to authenticated
  with check (
    auth.uid() = user_id
    and storage_path like auth.uid()::text || '/library/%'
  );

drop policy if exists "Users can delete their own DrVas Library items" on public.drvas_library_items;
create policy "Users can delete their own DrVas Library items"
  on public.drvas_library_items for delete to authenticated
  using (auth.uid() = user_id);

comment on table public.drvas_library_items is
  'Private user-owned files independent of chat attachments and conversation retention. Binary objects remain in the private drvas-media bucket under {user_id}/library/.';

commit;
