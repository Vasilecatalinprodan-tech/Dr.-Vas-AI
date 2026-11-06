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
