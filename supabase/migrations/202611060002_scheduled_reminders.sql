-- Private in-app reminders and notifications for the Dr.Vas Free Scheduled workspace.
begin;

create table if not exists public.drvas_scheduled_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(btrim(title)) between 1 and 160),
  details text not null default '' check (char_length(details) <= 2000),
  timezone text not null default 'UTC' check (char_length(timezone) between 1 and 64),
  run_at timestamptz not null,
  next_run_at timestamptz not null,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  last_run_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists drvas_scheduled_tasks_due_idx
  on public.drvas_scheduled_tasks(status, next_run_at)
  where status = 'active';
create index if not exists drvas_scheduled_tasks_owner_idx
  on public.drvas_scheduled_tasks(user_id, status, run_at desc);

alter table public.drvas_scheduled_tasks enable row level security;
drop policy if exists "Users manage their own scheduled tasks" on public.drvas_scheduled_tasks;
create policy "Users manage their own scheduled tasks"
  on public.drvas_scheduled_tasks
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
grant select, insert, update, delete on public.drvas_scheduled_tasks to authenticated;
revoke all on public.drvas_scheduled_tasks from anon;

create table if not exists public.drvas_notifications (
  id uuid primary key default gen_random_uuid(),
  task_id uuid unique references public.drvas_scheduled_tasks(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 160),
  body text not null default '' check (char_length(body) <= 2000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists drvas_notifications_owner_idx
  on public.drvas_notifications(user_id, created_at desc);

alter table public.drvas_notifications enable row level security;
drop policy if exists "Users read and manage their own notifications" on public.drvas_notifications;
create policy "Users read and manage their own notifications"
  on public.drvas_notifications
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
grant select, update, delete on public.drvas_notifications to authenticated;
revoke insert on public.drvas_notifications from authenticated;
revoke all on public.drvas_notifications from anon;

comment on table public.drvas_scheduled_tasks is
  'Owner-scoped one-time in-app reminders. Cloudflare Cron creates one notification at due time; no email, push or paid AI execution.';
comment on table public.drvas_notifications is
  'Owner-scoped in-app notifications created by the Worker scheduled handler. task_id uniqueness prevents duplicate reminder delivery.';

commit;
