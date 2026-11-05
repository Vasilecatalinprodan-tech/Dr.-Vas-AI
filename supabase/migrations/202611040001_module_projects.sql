-- Private, user-owned project drafts for the Academy, Commerce and Business workspaces.
begin;
create table if not exists public.drvas_module_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in ('academy','commerce','business')),
  title text not null check (char_length(title) between 1 and 160),
  project_type text not null check (char_length(project_type) between 1 and 60),
  brief jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drvas_module_projects_owner_module_updated_idx
  on public.drvas_module_projects (user_id, module, updated_at desc);

alter table public.drvas_module_projects enable row level security;
revoke all on table public.drvas_module_projects from public, anon;
grant select, insert, update, delete on public.drvas_module_projects to authenticated;

drop policy if exists "Users can read their own module projects" on public.drvas_module_projects;
create policy "Users can read their own module projects"
  on public.drvas_module_projects for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own module projects" on public.drvas_module_projects;
create policy "Users can create their own module projects"
  on public.drvas_module_projects for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own module projects" on public.drvas_module_projects;
create policy "Users can update their own module projects"
  on public.drvas_module_projects for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own module projects" on public.drvas_module_projects;
create policy "Users can delete their own module projects"
  on public.drvas_module_projects for delete to authenticated
  using (auth.uid() = user_id);

comment on table public.drvas_module_projects is
  'Private user-owned drafts for Dr.Vas Academy, Commerce and Business. Never store payment credentials or unnecessary sensitive personal data.';
commit;
