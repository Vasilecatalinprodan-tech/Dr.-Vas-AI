-- Owner-scoped standalone projects for Dr.Vas Free, independent of chat threads.
begin;

create table if not exists public.drvas_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  description text not null default '' check (char_length(description) <= 1000),
  module text not null default 'free' check (module in ('free','health','studio','academy','commerce','business')),
  notes text not null default '' check (char_length(notes) <= 30000),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drvas_projects_owner_recent_idx
  on public.drvas_projects(user_id, archived_at, updated_at desc);

alter table public.drvas_projects enable row level security;
revoke all on table public.drvas_projects from public, anon;
grant select, insert, update, delete on public.drvas_projects to authenticated;

drop policy if exists "Users manage their own DrVas projects" on public.drvas_projects;
create policy "Users manage their own DrVas projects"
  on public.drvas_projects for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

comment on table public.drvas_projects is
  'Standalone user-owned Dr.Vas projects with notes and module context, separate from chat history and module-specific records.';

commit;
