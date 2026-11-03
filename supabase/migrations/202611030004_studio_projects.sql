-- Private, user-owned Dr.Vas Studio project workspace.
create table if not exists public.drvas_studio_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  project_type text not null default 'general' check (char_length(project_type) <= 40),
  brief jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drvas_studio_projects_user_updated_idx
  on public.drvas_studio_projects (user_id, updated_at desc);

alter table public.drvas_studio_projects enable row level security;

drop policy if exists "Users can read their own Studio projects" on public.drvas_studio_projects;
create policy "Users can read their own Studio projects"
  on public.drvas_studio_projects for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own Studio projects" on public.drvas_studio_projects;
create policy "Users can create their own Studio projects"
  on public.drvas_studio_projects for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own Studio projects" on public.drvas_studio_projects;
create policy "Users can update their own Studio projects"
  on public.drvas_studio_projects for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own Studio projects" on public.drvas_studio_projects;
create policy "Users can delete their own Studio projects"
  on public.drvas_studio_projects for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.drvas_studio_projects to authenticated;
revoke all on public.drvas_studio_projects from anon;
