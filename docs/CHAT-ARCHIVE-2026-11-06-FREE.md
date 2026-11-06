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
