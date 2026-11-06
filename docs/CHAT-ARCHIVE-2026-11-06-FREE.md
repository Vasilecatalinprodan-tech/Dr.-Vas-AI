# Conversation archive — Dr.Vas Free requirements — 6 November 2026

## User's exact request

> „dr.vas free trebuie sa fie asa : atasaze fisiere langa trimite,cursorul sa se duca pana jos,chatul trebuie sa fie exact cat pagina nu sa dai de cursor in sus toata pagina ci sa ai cursor in chenarul in care vorbesti,in stanga chatului trebuie sa fie exact ca la tine cu ,new chat,images,schelduled,library,plugins si ..(explore),projects si recents ...vreau toate optiunile functionale cu exact ce scrie sa fie in ele....cand termini continuam cu urmatoru modul...vreau sa salvezi chatul si tot ce am spus sa modifici si sa ramana aici sa nu o mai luam de la capat”

## Captured requirements

### Chat and composer
- File attachment control immediately beside Send.
- Chat app occupies viewport; browser/page itself must not be the scrolling transcript.
- Scrollbar is inside the conversation transcript panel.
- Transcript auto-scrolls to newest message after sending/receiving/restoring/opening, but does not force-scroll if user deliberately reads older messages.
- Composer remains fixed/anchored at bottom of chat viewport.
- Selected attachments are visible/removable before sending; upload uses secure validated pipeline and correct owner/conversation/module context.

### Left sidebar order and expected behaviour
1. New chat — creates a new independent Free conversation ID.
2. Images — actual image workspace and real history/create/upload actions.
3. Scheduled — real scheduled tasks/reminders with supported management controls; honest availability/connect state if capability unavailable.
4. Library — user's actual saved resources, search and preview/open actions, permission-respecting.
5. Plugins — actual installed/connected integrations and discovery/connection flow; user explicitly authorises connections.
6. Explore — discovery of real tools/capabilities, distinct from Plugins.
7. Projects — persistent projects independent from chat history.
8. Recents — conversations ordered by actual latest activity and reopening the exact thread.

Every destination must work or honestly explain that an integration/capability is unavailable. No dead buttons, fake records or success claims before confirmation.

### Responsive layout
- Desktop: persistent left sidebar, chat fills remaining viewport.
- Mobile/tablet: accessible sidebar drawer/toggle, full-height chat, composer above keyboard/safe area.
- Preserve current chat/draft when navigating where practical.
- Keyboard accessibility, visible focus, screen-reader labels and explicit empty/loading/error/disconnected states.

## Cross-module requirements retained from previous conversation
- Free general chat is independent of all module assistants and feature workspaces.
- Every module has a dashboard; each feature opens a dedicated page/workspace, not a crowded long panel.
- Every workspace has a clear return-to-module/platform action.
- Same chat-history and conversation-isolation model across modules.
- Business first: separate Accounting/Cashbook, Self Assessment, Invoices/Expenses, Cashflow, Business Plan, Compliance Calendar, Reports/Exports and Business Assistant.
- Preserve all legacy conversations, attachments and project records. Unknown legacy context stays unclassified; do not guess or destructively backfill.
- Owner-scoped RLS for every user's records.
- No paid services, subscriptions, provider credits or external spending without explicit approval.
- No release completion claims until automated checks AND real production smoke tests pass.

## Implementation status at archive time
- Requirements and detailed acceptance criteria saved in docs/UX-REDESIGN-CHAT-AND-MODULE-WORKSPACES-2026-11-06.md.
- Saved to branch feature/chat-sidebar-module-workspaces-2026-11-06.
- The current change is documentation/specification only. No Free UI implementation or production deployment has been performed for these new requirements yet.
- Next work: inspect current main/PR state; implement conversation history/isolation and the Free viewport/chat shell; then implement each sidebar destination with real backing functionality; run E2E and production checks; merge and deploy autonomously under the standing user authorisation.
- After Dr.Vas Free is completed and verified, ask the founder to describe the next module. Do not make him repeat these Free requirements.


## Implementation checkpoint — Dr.Vas Free — 6 November 2026 20:08 UTC

- Implementation PR: #38 — https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/38
- Working branch: `feature/free-chat-shell-navigation-2026-11-06`
- Current verified branch head at checkpoint: `9cc28ac0d05427d0093440f1f18ce9086aee5fa3` (later commits may advance this).
- Implemented in source (not yet merged/deployed): viewport-height Free chat shell; transcript-only scrolling; bottom-follow logic that preserves intentional reading position; fixed composer; attachment picker beside Send; persistent desktop sidebar and mobile drawer; eight requested navigation entries; owner-scoped attachment listing with signed URLs; Projects view using existing project tables; Recents with exact thread reopen; Explore module directory; live internal integration health status under Plugins; one-time Scheduled reminder form/list/complete/delete/in-app notifications.
- Added additive Supabase migrations: `202611060001_conversation_context.sql` and `202611060002_scheduled_reminders.sql`. Legacy conversation context remains NULL/unclassified; no bulk backfill or deletion. Local per-user context fallback is included until the migration is applied.
- Added Cloudflare Worker `scheduled` handler and `*/5 * * * *` cron for due in-app reminders. No email, push or paid AI action is triggered.
- Important capability boundaries: Images currently lists images attached to Free conversations; image generation is not wired into the Dr.Vas app. Library currently lists private conversation attachments, not a separate saved-file collection. Plugins reports real internal service health; an external plugin marketplace/OAuth connection flow is not yet implemented. These must not be described as complete beyond their implemented scope.
- Supabase migrations are NOT applied by the existing Cloudflare deploy workflow. The repository has no connected Supabase tool in this session; the Supabase plugin is not installed. Do not claim cross-device conversation context or Scheduled reminders are live until both migrations are applied and live-tested.
- Browser regression run for the prior PR head passed static Worker/inline-JS validation and was running Playwright at checkpoint; latest commit's run was queued. Do not merge until the latest E2E run completes successfully and any failures are corrected.
- Do not deploy or replace the APK until PR #38 is green, Supabase migrations are applied, production smoke tests confirm the new Free shell, and the actual desktop/mobile UI is verified.


## Founder release instruction and expanded Free implementation — 6 November 2026

Founder explicitly reaffirmed: „Ordinea în care voi construi Dr.Vas Free: 1. Chatul să ocupe exact spațiul disponibil, cu scroll numai în fereastra conversației. 2. Cursorul să ajungă automat la ultimul mesaj, fără să te împiedice să citești mesajele vechi. 3. Caseta de scriere să rămână jos, cu atașarea fișierelor lângă Trimite. 4. Bara laterală cu toate cele opt opțiuni, în ordinea cerută. 5. Fiecare opțiune să aibă funcționalitatea reală promisă de numele ei. 6. Istoricul să păstreze conversațiile separate și să le poți redeschide. 7. Verificare pe desktop și mobil, teste, apoi merge și deploy. pai fale si dai merge si deploy cand termini tot si salveaza tot”

Expanded implementation now on PR #38:
- `Images` and `Library` use a dedicated private Library table, not just chat attachments. Users can upload supported files, view signed previews/links and delete their saved Library items. Images filters the same independent collection to image MIME types.
- Added `supabase/migrations/202611060003_library_items.sql` with owner-only RLS and a storage path constrained to `{user_id}/library/...`; existing private `drvas-media` storage policies scope the first path segment to the authenticated owner.
- Added tests for Library table RLS and upload/read/delete wiring.
- Added mobile sidebar drawer, bottom logout retention, Recents action in the sidebar, and corrected the delayed auto-scroll so pending animation frames re-check whether the user is still near the bottom before moving the transcript.
- Latest code branch at the time of this note: `feature/free-chat-shell-navigation-2026-11-06`, commit `cf348846f064a969cb3bfc14fd6708f0f7bc0a9d`. PR #38 remains open pending current E2E checks.
- Previous E2E runs revealed six regressions (bottom logout hidden, mobile history toggle hidden, Recents button missing its navigation key, and delayed auto-scroll interrupting history reading). These were corrected in subsequent commits; do not claim fixed until the latest complete run passes.
- The Free sidebar's external Plugins marketplace/OAuth connections and image-generation engine are not yet implemented. Plugins currently shows live internal service health and truthfully states the external catalog is unavailable. Images currently manages the user's saved image collection; it does not generate new images. No fake controls or false connection statuses.
- Supabase SQL migrations 202611060001_conversation_context.sql, 202611060002_scheduled_reminders.sql and 202611060003_library_items.sql are committed but NOT applied by the existing Cloudflare deploy workflow. Scheduled and Library cannot be called production-ready until the three migrations are applied and live-tested. The app's local conversation-context fallback preserves module separation on this device until the metadata migration is applied; cross-device context requires the database migration.
- User's standing authorization remains: autonomously merge and deploy routine Dr.Vas changes once all checks and production verification pass; do not ask for routine approval. Do not incur paid provider/service charges or use new paid image-generation/plugin APIs without explicit approval.


## Verification update — 6 November 2026 20:20 UTC

- PR #38 latest code head: `5d21479d3ab67270394b5f024afde3914125442e`; PR remains OPEN and not merged: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/38
- Latest browser regression workflow run `42287129054` completed SUCCESS: 81/81 Playwright tests passed. Static Worker/inline JS validation also passed.
- The 81-test suite includes desktop Free shell/sidebar, mobile sidebar drawer, exact navigation destinations, per-module conversation ID separation, transcript-only scroll behaviour, and the guard against yanking a user away from older messages.
- Three additive database migrations are part of the PR: `202611060001_conversation_context.sql`, `202611060002_scheduled_reminders.sql`, `202611060003_library_items.sql`.
- Current code capabilities: Images = private image library/upload/open; Library = independent private file library/upload/open/delete; Scheduled = one-time in-app reminders with notification inbox and 5-minute Cloudflare Cron; Plugins = live status of internal Worker/Supabase/Gemini/Studio-renderer/file-analysis services; Projects = saved project lists; Explore = module directory; Recents = reopen exact Free thread; New chat = new independent conversation.
- Explicit scope not yet implemented: image generation inside Dr.Vas; external plugin marketplace and third-party OAuth connections. Do not claim these are working. Scheduled reminders are in-app only (no email/push, no AI execution).
- Critical release blocker: migrations are committed but not applied to Supabase. Existing Cloudflare deployment workflow does not apply SQL. No Supabase connector is currently available in this session, so do not merge/deploy until the database migrations are applied through an authorised Supabase connection and verified.
- After database access is available: apply migrations in order; test user-owned RLS and Storage; merge PR #38; allow Cloudflare Worker/static asset deploy and cron trigger to publish; check production /health; perform real desktop/mobile smoke tests; rebuild APK only after web release verification.
- Founder expressly authorises autonomous merge/deploy after all requirements and release gates pass. No new paid provider services or image-generation spend without explicit approval.


## Projects workspace implementation checkpoint — 6 November 2026

- Added a separate owner-scoped `public.drvas_projects` model in `supabase/migrations/202611060004_projects.sql`; it stores title, description, module association, notes, archive state and timestamps independently of chat history.
- Free Projects now supports create, open, edit/save, rename, archive, restore, delete, and a separate archived-projects view. Existing Studio and module-specific project records remain accessible through separate module shortcuts.
- The project form limits module options according to the current user's access; every query/update/delete filters by the current user ID and database RLS enforces `auth.uid() = user_id`.
- Added migration and browser-source tests for standalone project CRUD. Latest relevant E2E run `42287908611` was still running at the time of this note; the previous project-code run `42287773249` passed all 81 Playwright tests. Do not claim the newest added tests pass until run `42287908611` completes.
- Four additive migrations now accompany PR #38: conversation context (`202611060001`), Scheduled reminders (`202611060002`), independent Library files (`202611060003`), and standalone Projects (`202611060004`). None are applied to live Supabase yet.
- PR #38 remains open and mergeable; do not merge or deploy until the newest CI run passes and all four SQL migrations are applied and live RLS/Storage behavior is verified.
