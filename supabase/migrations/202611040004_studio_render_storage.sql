-- Private Studio media storage and per-user render-job tracking.
begin;

create table if not exists public.drvas_studio_render_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'creatomate' check (provider = 'creatomate'),
  render_id text,
  status text not null default 'queued'
    check (status in ('queued','planned','waiting','transcribing','rendering','succeeded','stored','failed')),
  storage_path text,
  duration numeric(6,2) not null check (duration between 1 and 180),
  width integer not null default 1080 check (width = 1080),
  height integer not null default 1920 check (height = 1920),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, render_id)
);

create index if not exists drvas_studio_render_jobs_owner_created_idx
  on public.drvas_studio_render_jobs (user_id, created_at desc);

alter table public.drvas_studio_render_jobs enable row level security;
revoke all on table public.drvas_studio_render_jobs from public, anon;
grant select, insert, update, delete on public.drvas_studio_render_jobs to authenticated;

drop policy if exists "Users can read their own Studio render jobs" on public.drvas_studio_render_jobs;
create policy "Users can read their own Studio render jobs"
  on public.drvas_studio_render_jobs for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their own Studio render jobs" on public.drvas_studio_render_jobs;
create policy "Users can create their own Studio render jobs"
  on public.drvas_studio_render_jobs for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own Studio render jobs" on public.drvas_studio_render_jobs;
create policy "Users can update their own Studio render jobs"
  on public.drvas_studio_render_jobs for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own Studio render jobs" on public.drvas_studio_render_jobs;
create policy "Users can delete their own Studio render jobs"
  on public.drvas_studio_render_jobs for delete to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'drvas-media',
  'drvas-media',
  false,
  52428800,
  array['image/jpeg','image/png','image/webp','video/mp4','audio/mpeg','audio/wav','audio/mp4','audio/aac']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Users can read their own DrVas media" on storage.objects;
create policy "Users can read their own DrVas media"
  on storage.objects for select to authenticated
  using (bucket_id = 'drvas-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can upload their own DrVas media" on storage.objects;
create policy "Users can upload their own DrVas media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'drvas-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can update their own DrVas media" on storage.objects;
create policy "Users can update their own DrVas media"
  on storage.objects for update to authenticated
  using (bucket_id = 'drvas-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'drvas-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Users can delete their own DrVas media" on storage.objects;
create policy "Users can delete their own DrVas media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'drvas-media' and (storage.foldername(name))[1] = auth.uid()::text);

comment on table public.drvas_studio_render_jobs is
  'Private per-user status and storage path for Studio MP4 renders. Provider temporary URLs are never persisted as public links.';

commit;
