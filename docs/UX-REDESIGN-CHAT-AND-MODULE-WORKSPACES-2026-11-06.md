# Dr.Vas AI — Chat, platform navigation and module workspace redesign
**Date:** 6 November 2026  
**Repository:** `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
**Working branch:** `feature/chat-sidebar-module-workspaces-2026-11-06`  
**Base:** `main` after Sarah PR #36 merge, commit `bbb97c26636c2c8b867c02f12b97f51cc219fe0b`

## 1. Founder request — product direction

The founder says the current Dr.Vas interface feels crowded and does not behave like a complete AI platform. He explicitly requests:
- Dr.Vas Free must show previous conversations in a persistent left sidebar, like ChatGPT.
- The user must be able to reopen previous chats and continue each one without messages being appended to an unrelated existing chat.
- The same history/navigation principles must apply consistently across every module.
- The main **„Vorbește cu Dr.Vas”** action must open a separate general-assistant chat, not the currently selected module's workspace or its conversation.
- Each module must have a clear **„Înapoi la platformă”** / return-to-module-dashboard action.
- Every module feature must open as its own dedicated page/workspace/form. Do not stack every tool and form into one long crowded page.
- Example for Business: choose **Contabilitate** and open a dedicated accounting workspace; choose **Self Assessment** and open a separate guided form/workspace; offer separate business-plan, cashflow, invoice/expense and other tools.
- Make the product substantially more complete and structured, not merely cosmetically rearranged.
- Save this conversation and the full product decisions in the repository so work can resume later without asking the founder to repeat them.

## 2. Verified current defects and root causes

### 2.1 History exists but is hidden in the UI
The current app already has:
- `getConversationIds()`
- `loadConversationList()`
- `openConversation()`
- `newConversation()`
- rename, archive, restore and delete actions
- automatic message persistence in `chat_messages`
- a left-side `#conversationList` / `.history-panel` component in the chat markup.

However, CSS explicitly hides the history panel:
- `body.module-workspace-mode #chatSection .history-panel{display:none!important}`
- `body.free-module-mode #chatSection .history-panel` and `.chat-history-toggle` are hidden.
This explains why Free does not visibly show previous conversations despite the history code being present.

### 2.2 Conversations are not isolated by module or purpose
The frontend currently has one global `currentConversationId` and one `ACTIVE_CONVERSATION_PREFIX` per user. Switching `activeModule` does not necessarily create a fresh conversation ID. `send()` snapshots the current ID and module separately, then stores messages in `chat_messages` under that ID. `getConversationIds()` loads all of a user's messages without a module filter. This can mix general Free chat and module-specific work in the same thread, and can show a chat under the wrong context.

### 2.3 Existing metadata does not identify chat context
Migration `202611030006_conversation_management.sql` defines `drvas_conversation_metadata` with title and archive state only; it has no module or conversation-kind discriminator. The existing messages table is queried by owner and conversation ID. Attachments do include a module field, so the chat's attachment scope can diverge from the conversation's visible context if a conversation ID is reused.

### 2.4 Workspace functions are crowded together
The module markup contains many long forms and tools in a single large workspace. For example, Studio contains creative briefs, video render controls, project manager, income tracker, capability catalogue and social connections together. Business contains multiple workflows in one large panel. This is not a clear feature-navigation model.

## 3. Target information architecture

### A. Platform dashboard
A clear home/dashboard with the six modules and their descriptions/status. Keep a prominent global **Vorbește cu Dr.Vas** action.

### B. Global Dr.Vas Free chat
A separate general assistant experience:
- left sidebar with the user's Free conversations;
- new chat, search/filter, rename, archive/restore, delete;
- opening a previous chat restores that exact thread;
- new chats always receive a new conversation ID;
- return-to-platform button;
- never silently reuse a module workspace conversation.

### C. Module dashboards
Each module opens its own dashboard, not a huge form. Show clear feature tiles/cards and short explanations. Each tile opens a dedicated workspace view. Every workspace has:
- module breadcrumb and feature title;
- a clear **Înapoi la [Modul]** action;
- its own form, project records and output area;
- a separate **Discută cu asistentul [Modul]** action where appropriate;
- its own conversation context, not the global Free thread;
- save/open/export controls appropriate to that feature.

### D. Unified chat-history system
Use one reusable sidebar component across Free and module-specific chat views. It can show all chats or filter by module, with a clear module badge on each conversation. It must not mix message histories. Desktop: persistent left sidebar. Mobile: accessible drawer/toggle, not permanently hidden. The sidebar must remain visible in every chat mode unless the user explicitly collapses it.

## 4. Conversation model and migration plan

Introduce explicit conversation context metadata, for example:
- `module`: `free | health | studio | academy | commerce | business`
- `conversation_kind`: `general | module_assistant | feature_assistant`
- optional `feature_key`: stable key such as `business_accounting` or `business_self_assessment`
- title, archived_at, timestamps.

A new additive Supabase migration must:
1. add nullable/context columns to `drvas_conversation_metadata` (or create a separately reviewed context table if compatibility requires);
2. add safe owner/module indexes;
3. preserve the existing RLS owner policy and authenticated-only grants;
4. avoid deleting or rewriting any existing chat messages;
5. leave legacy conversations with unknown module/context until safely classified; never guess and never silently discard them;
6. support legacy metadata rows without requiring an unsafe bulk backfill.

Frontend requirements:
- use a distinct current conversation ID per user + module + conversation kind/feature;
- switching module or feature must never reuse another context's ID;
- create a fresh conversation for a fresh chat action;
- write/update metadata when a conversation starts and after a useful first user message, with a sensible title;
- list and reopen conversations using the saved context, not whichever module happens to be selected now;
- enforce `user_id` filters on every metadata/message/file read, update and delete;
- preserve attachment module context and ensure the opened conversation determines the correct attachment scope.

## 5. Dr.Vas Free — exact ChatGPT-style requirements (captured 6 November 2026)

The founder's latest exact request, retained verbatim:

> „dr.vas free trebuie sa fie asa : atasaze fisiere langa trimite,cursorul sa se duca pana jos,chatul trebuie sa fie exact cat pagina nu sa dai de cursor in sus toata pagina ci sa ai cursor in chenarul in care vorbesti,in stanga chatului trebuie sa fie exact ca la tine cu ,new chat,images,schelduled,library,plugins si ..(explore),projects si recents ...vreau toate optiunile functionale cu exact ce scrie sa fie in ele....cand termini continuam cu urmatoru modul...vreau sa salvezi chatul si tot ce am spus sa modifici si sa ramana aici sa nu o mai luam de la capat”

### 5.1 Chat viewport and composer
- The Free chat must occupy the available app/page viewport; it must not become a long document that forces the whole browser page to scroll.
- The conversation transcript is the scrollable region inside the chat panel. Its scrollbar/cursor must be inside that transcript container, not on the outer page.
- The transcript must automatically scroll to the newest message after opening a chat, sending a message, receiving streamed/final assistant output, and restoring a conversation, while respecting a user who intentionally scrolls upward to read history (do not yank them to bottom if they are reading older messages).
- The message composer stays anchored at the bottom of the chat viewport. It must remain usable while the transcript scrolls independently.
- The input area must support multiline text and keep the send control visible.
- Add an attachment control immediately beside the Send button, not hidden in a separate distant toolbar. It must open the file picker, display selected files, permit removal before sending, upload through the existing secure/validated attachment flow, and associate each attachment with the correct user, conversation ID and `free` module context. Show upload progress/errors and enforce supported type/size limits.
- On narrow/mobile screens, keep composer controls accessible, avoid horizontal overflow, and account for the on-screen keyboard and safe areas.

### 5.2 Left navigation — exact visible destinations
The Free desktop layout has a persistent left navigation rail/sidebar and a main chat area. The sidebar must contain these labelled entries, in this order and with the spelling corrected for the UI:
1. **New chat** — creates a genuinely new Free/general conversation ID and clears the composer/transcript view without deleting old conversations.
2. **Images** — opens a dedicated image workspace showing the user's generated/uploaded image history and available image creation flow. Each action must work; do not render a dead link.
3. **Scheduled** — opens scheduled tasks/reminders created by the user, with status, schedule, pause/resume/cancel/edit controls as supported. Creating or managing a scheduled task must use a real connected scheduling/automation capability; if unavailable, show an honest connect/availability state, not a fake success.
4. **Library** — opens the user's saved files/resources, with search, open/preview, and supported file actions. Respect file permissions and distinguish conversation attachments from saved Library items.
5. **Plugins** — opens connected integrations and a discover/browse/connect experience. Show connection state and permissions; connecting/installing always requires the user's explicit action. Never imply an unconnected plugin is active.
6. **Explore** (the founder's “... (explore)”) — opens the discovery area for available tools, assistants, and supported capabilities. Do not use it as a duplicate of Plugins; explain and expose what is actually available.
7. **Projects** — opens a project list/workspace with create, open, rename and archive actions, with project content saved independently from ordinary chat history.
8. **Recents** — displays recent conversations in reverse chronological order, with title, last activity and context. Selecting an item reopens that exact conversation. It must not duplicate or merge data with Projects.

The labels must remain clear and recognisable. Each destination must open a dedicated view within the same application shell, with a clear way back to the Free chat/platform. No placeholder item may masquerade as a working feature. Where an external integration or capability is not connected or not available, the view must explain that state and provide the real next action (for example, connect an integration) without fabricating data or completion.

### 5.3 Responsive layout and interaction
- Desktop: sidebar fixed to the left within the app shell; chat occupies remaining width and height.
- Tablet/mobile: sidebar becomes an accessible drawer/toggle; chat remains full-height and composer stays anchored above the keyboard.
- Sidebar navigation must preserve the currently open conversation and unsent draft when appropriate, unless the user explicitly starts a new chat or leaves a view that cannot retain the draft.
- Keyboard navigation, focus states, screen-reader labels, visible focus and sensible empty/loading/error states are required.
- Layout should visually follow the familiar hierarchy and interaction pattern requested by the founder, while retaining Dr.Vas branding and not copying protected proprietary assets.

### 5.4 Functional integrity — no decorative or fake controls
Every visible entry must do exactly what its label promises. Before release, verify:
- New chat creates a distinct conversation and old chats remain accessible.
- Images opens actual image history and a real supported create/upload flow.
- Scheduled lists real scheduled work and performs only supported schedule actions.
- Library reads the user's real saved Library resources and respects permissions.
- Plugins displays actual available/connected integrations and invokes real connection flows only after user consent.
- Explore displays real available capabilities and opens them.
- Projects persist independently and can be reopened.
- Recents is sorted by actual last activity and reopens the exact saved thread.
- Every empty, disconnected, unavailable, loading and error state is explicit and truthful.
- No UI control is left inert, no fake records are inserted, and no action reports success before the underlying service confirms it.

## 6. Business module — proposed feature catalogue

Business should be a feature dashboard with independent entries, not a single giant page:

1. **Contabilitate / Cashbook** — income and expense entries, categories, monthly totals, cashflow, reconciliation notes, CSV export, saved records.
2. **Self Assessment** — a separate guided UK self-employment/tax-return preparation workspace with tax-year selection, income sources, allowable-expense categories, records checklist, calculation summary, missing-information warnings and exportable review pack. Ask/record the applicable country and tax jurisdiction; do not assume every user is UK-based.
3. **Facturi și cheltuieli** — invoice drafts, customer/supplier details, line items, due dates, payment status and expense receipts/records. No payment execution.
4. **Cashflow și profitabilitate** — monthly forecast, actual-vs-estimate, margins, break-even and scenarios.
5. **Business Plan** — guided sections for idea, market, customer, operations, pricing, costs, risks and milestones.
6. **Tax Calendar & Compliance Checklist** — jurisdiction-aware reminders/checklists and official-source links, not claims of legal/accounting certification.
7. **Rapoarte și exporturi** — summaries, CSV/PDF-ready reports and accountant handoff pack.
8. **Asistent Business** — separate chat thread for business planning, distinct from Free and from each feature's saved form.

Self Assessment safeguards:
- clearly label as preparation/organisation support, not a substitute for a qualified accountant or HMRC;
- calculations must disclose assumptions and rates/year, and be verified against official current sources before use;
- never submit a tax return, authenticate to HMRC, pay tax or make a regulated decision automatically;
- user reviews and approves every value and export;
- keep financial records private and owner-scoped.

## 7. Other module dashboards — feature separation

- **Health:** general health information, explain terminology/results, appointment preparation, medication-information questions, symptom/visit notes. No diagnosis, prescribing or treatment changes; file analysis remains gated by privacy/security approvals.
- **Studio:** separate entries for Video & Reels, Script/Series, Books & eBooks, Music & Lyrics, Translation, Social Content, Render/Export, Monetisation Plan and My Projects. Keep rendering/publishing/payment approvals explicit.
- **Academy:** course builder, lessons, exercises/quizzes, learning plans, progress, certificates only if properly supported, saved courses.
- **Commerce:** product research, supplier comparison, unit economics, pricing/margin, store setup plan, order/returns operations and saved product projects. No purchases or supplier contact without explicit approval.
- **Free:** pure general-purpose AI chat with its own independent conversation history.

## 8. Implementation sequence

1. **History and chat separation first:** restore sidebar visibility, add module/kind/feature metadata, create independent conversation IDs, preserve and display legacy chats, add search/filter and reliable reopen.
2. **Free shell and chat ergonomics:** implement viewport-height shell, independent transcript scrolling, sticky bottom composer, near-Send attachment picker, auto-scroll behaviour and the full left navigation described in section 5.
3. **Functional navigation destinations:** Images, Scheduled, Library, Plugins, Explore, Projects and Recents must be real working views or honest integration availability states; no decorative/inert placeholders.
4. **Navigation shell:** platform dashboard → module dashboard → feature workspace → optional dedicated module assistant chat; consistent breadcrumbs/back buttons.
5. **Business first:** split Accounting, Self Assessment, Invoices/Expenses, Cashflow, Business Plan, Compliance and Reports into dedicated feature pages.
6. **Apply the same reusable feature-shell pattern to Health, Studio, Academy and Commerce.**
7. Add end-to-end tests for all journeys and user isolation.
8. Review migrations/RLS, preserve old data, run CI, then merge/deploy through the established safe release workflow.
9. Do not replace the Android APK until web changes and release checks pass; no paid services, subscriptions, provider credits or external spending without explicit approval.

## 9. Acceptance criteria

- Free chat displays its previous conversations in a left sidebar after login and after reload.
- A user can open a past Free conversation and continue it; messages remain in that same thread only.
- Starting a new chat always creates a new thread.
- Switching between Free, Health, Studio, Academy, Commerce and Business never appends to another module's conversation.
- Each chat in the history has a correct module/context label and opens in its original context.
- The main **Vorbește cu Dr.Vas** opens an independent general chat.
- The transcript alone scrolls; the full page does not scroll during ordinary chat use.
- Newest messages are brought into view automatically unless the user is intentionally reading older content.
- Composer stays at the bottom and file attachment sits beside Send and really uploads.
- All eight sidebar destinations (New chat, Images, Scheduled, Library, Plugins, Explore, Projects, Recents) are functional and truthful.
- Every module dashboard has separate feature cards; selecting one opens a dedicated workspace rather than leaving all forms stacked.
- Every feature workspace has a clear back-to-module action.
- Business Accounting and Self Assessment are distinct pages with independent saved records and assistant contexts.
- Desktop and mobile navigation both work; mobile history is a drawer/toggle, not removed.
- Existing legacy messages, attachments, saved projects and metadata remain intact.
- Owner A cannot read, list, edit or delete Owner B's conversations or workspaces.
- CI tests cover persistence, cross-module isolation, navigation, back actions, feature forms, attachment flows, accessibility and responsive layout.
- No claim of completion until CI and a production smoke test pass.

## 10. Current implementation status

This document is a product/technical specification and a verified defect analysis. The new navigation, metadata migration and UI refactor have **not yet been implemented**. No Supabase migration has been applied. The current branch contains this specification and handoff updates only. The founder explicitly asked to save the work and resume later.

## 11. Related voice fix completed in this session

PR #36 — https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/36 — passed browser E2E workflow run `42279655390` and was squash-merged to `main` as `bbb97c26636c2c8b867c02f12b97f51cc219fe0b`. It adds a cross-language feminine voice fallback for Sarah. Actual speaker playback and perceived voice quality still require device verification.


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
