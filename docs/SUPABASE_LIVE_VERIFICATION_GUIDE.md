# Dr.Vas — live Supabase verification guide

Updated: 5 November 2026

## Why this step is still required

The GitHub workflow validates migration files and their security rules, but it cannot prove that those migrations have been applied to the live Supabase project. No authorized Supabase database connector is available in this development session, so do not claim that the live database is verified.

## Read-only verification

1. Sign in to the Supabase dashboard for the Dr.Vas project.
2. Open **SQL Editor** and create a new query.
3. Open `docs/SUPABASE_READONLY_VERIFICATION.sql` from the repository and copy its complete contents into the SQL Editor.
4. Run the query. It only reads PostgreSQL catalog metadata, policies, grants, function privileges and the private Storage bucket configuration. It does not create, alter, delete or update data.
5. Export or copy the result sets for review. Do not send API keys, service-role secrets, passwords, access tokens or customer data.

## What must be reviewed

- Expected tables/functions exist, especially module projects, Business transactions, Studio render jobs and chat attachments.
- RLS is enabled on every user-data table; check whether FORCE RLS is appropriate for each table and server-side access pattern.
- User-owned policies consistently use `auth.uid() = user_id`.
- Sensitive profile, consent, audit, rate-limit and Crypto tables have no unintended anon/authenticated grants.
- The `drvas-media` bucket remains private and the Storage object policies isolate each user's folder.
- The rate-limit function is executable only by the intended server role.

## If migrations are missing

Do not apply every migration blindly. First compare the live schema and migration history with the repository. Back up the project, review migration order and dependencies, then apply only missing migrations through the approved Supabase workflow. Re-run the read-only verification afterwards.

## Required runtime isolation test

Use two disposable test accounts (User A and User B). Verify that each can create/read/update/delete only their own module projects, Business transactions, Studio render jobs and chat attachments. Test Storage signed URLs and object paths for both users. Do not use real customer or Health data for this test.

## Release gate

Until the live query outputs and two-account tests have been reviewed, record Supabase as **source-reviewed, live verification outstanding** — not complete.

## 2026-11-05 — Academy, Commerce and Business migration request

- Founder found the Academy UI message requesting migration `202611040001_module_projects.sql`.
- Reviewed the exact migration. It creates one shared `public.drvas_module_projects` table for the `academy`, `commerce` and `business` module values; it is not three separate migrations.
- The migration creates an owner/module/updated index, enables RLS, revokes public/anon privileges, grants authenticated CRUD, and adds per-user `auth.uid() = user_id` policies for select/insert/update/delete. It is wrapped in a transaction and uses `IF NOT EXISTS`/drop-and-recreate policies, so it is intended to be re-runnable.
- Do not apply three copies. Apply this exact migration once in the correct Dr.Vas Supabase project. Then verify the table, RLS and four policies, and test all three module values with two disposable user accounts.
- No live Supabase connector or authorized database session is available in this development session. Therefore the SQL has been reviewed and documented, but has NOT been executed against the live database. Do not claim the Academy/Commerce/Business project persistence is fixed until the migration has been applied and verified in Supabase.
- User-facing next action: Supabase Dashboard → correct Dr.Vas project → SQL Editor → New query → paste the full contents of `supabase/migrations/202611040001_module_projects.sql` → Run. Then run the read-only checks in `docs/SUPABASE_READONLY_VERIFICATION.sql` and complete the two-account isolation tests described in `docs/SUPABASE_LIVE_VERIFICATION_GUIDE.md`. Never paste secrets into chat.

## Founder-reported migration execution — 2026-11-05

The founder has now confirmed that `202611040001_module_projects.sql` was executed successfully in the correct Supabase project. This is recorded as a user-reported successful execution, not as an independently observed database verification.

Next verify in the Supabase SQL Editor using the read-only checks in `docs/SUPABASE_READONLY_VERIFICATION.sql`:
- `public.drvas_module_projects` exists and has RLS enabled.
- The four expected owner-scoped policies exist (SELECT, INSERT, UPDATE, DELETE).
- Authenticated grants are present and anon/public grants are absent.
- Academy, Commerce and Business each complete save → list → reopen using two disposable accounts, with no cross-account visibility.

Do not rerun the migration merely because this checklist remains open; it is designed to be applied once and should only be reapplied if the read-only audit identifies a concrete missing object/policy. Never share service-role keys or passwords in chat.

## Academy / Commerce / Business saved-project behavior

- The shared project table supports all three modules.
- When the user already has a saved project open, the frontend now writes each new AI reply back into that existing project together with its current brief. A new project is not created automatically for every chat; the user can still choose when to save a new draft.
- The UI also supports listing, reopening, exporting and deleting each module project. Verify these actions in the live Supabase project after running the read-only checks, including a second disposable account to confirm owner isolation.


## 2026-11-06 — Dr.Vas Free chat, Scheduled, Library and Projects migrations

The Free sidebar and its independent workspaces now require these additive migrations, in this order, after confirming the earlier migration history is current:

1. `supabase/migrations/202611060001_conversation_context.sql`
   - Adds nullable `module`, `conversation_kind` and `feature_key` to `drvas_conversation_metadata`.
   - Existing rows intentionally remain NULL/unclassified. Do not bulk assign legacy conversations to Free or another module.
   - Confirm owner-scoped RLS and authenticated grants from the existing conversation metadata migration remain unchanged.
2. `supabase/migrations/202611060002_scheduled_reminders.sql`
   - Creates owner-scoped `drvas_scheduled_tasks` and `drvas_notifications`.
   - Notifications are inserted by the Worker service role; authenticated clients cannot insert notifications directly.
   - Cloudflare Cron checks due one-time reminders every five minutes. Notifications are in-app only.
3. `supabase/migrations/202611060003_library_items.sql`
   - Creates owner-scoped `drvas_library_items`.
   - Verify the private `drvas-media` bucket remains private and the existing storage object policy allows only the authenticated user's first path segment. Library objects use `{user_id}/library/...`.
4. `supabase/migrations/202611060004_projects.sql`
   - Creates owner-scoped `drvas_projects` for standalone Free projects, notes, module association and archive state.

### Verification after applying

- Confirm all three new tables (`drvas_scheduled_tasks`, `drvas_notifications`, `drvas_library_items`, `drvas_projects`) exist and have RLS enabled.
- Confirm each table's policies use `auth.uid() = user_id`; confirm authenticated notification INSERT is revoked.
- Confirm `drvas_conversation_metadata` has the three new context columns and legacy rows remain NULL unless explicitly classified by the owner.
- Confirm `drvas_library_items.storage_path` is constrained to the current owner's `/library/` folder and signed URLs cannot be created by another account.
- Use two disposable accounts to test create/list/open/update/archive/delete for reminders, Library items and standalone Projects; verify neither account can access the other's rows or Storage objects.
- Test a due reminder through the actual Cloudflare Cron and confirm one in-app notification is created once, then the task is completed.
- Do not merge/deploy PR #38 until this database verification is complete. The current Cloudflare deploy workflow does not execute Supabase SQL migrations.
