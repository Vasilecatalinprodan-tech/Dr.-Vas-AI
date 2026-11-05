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
