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
Migration `202611030006_conversation_management.sql` defines `drvas_conversation_metadata` with title and archive state only; it has no module or conversation-kind discriminator. The existing messages table is queried by owner and conversation ID. Attachments do include a module field, so the chat's attachment scope can diverge from the conversation's visible context if a conversation ID is reused across modules.

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

## 5. Business module — proposed feature catalogue

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

## 6. Other module dashboards — feature separation

- **Health:** general health information, explain terminology/results, appointment preparation, medication-information questions, symptom/visit notes. No diagnosis, prescribing or treatment changes; file analysis remains gated by privacy/security approvals.
- **Studio:** separate entries for Video & Reels, Script/Series, Books & eBooks, Music & Lyrics, Translation, Social Content, Render/Export, Monetisation Plan and My Projects. Keep rendering/publishing/payment approvals explicit.
- **Academy:** course builder, lessons, exercises/quizzes, learning plans, progress, certificates only if properly supported, saved courses.
- **Commerce:** product research, supplier comparison, unit economics, pricing/margin, store setup plan, order/returns operations and saved product projects. No purchases or supplier contact without explicit approval.
- **Free:** pure general-purpose AI chat with its own independent conversation history.

## 7. Implementation sequence

1. **History and chat separation first:** restore sidebar visibility, add module/kind/feature metadata, create independent conversation IDs, preserve and display legacy chats, add search/filter and reliable reopen.
2. **Navigation shell:** platform dashboard → module dashboard → feature workspace → optional dedicated module assistant chat; consistent breadcrumbs/back buttons.
3. **Business first:** split Accounting, Self Assessment, Invoices/Expenses, Cashflow, Business Plan, Compliance and Reports into dedicated feature pages.
4. **Apply the same reusable feature-shell pattern to Health, Studio, Academy and Commerce.**
5. Add end-to-end tests for all journeys and user isolation.
6. Review migrations/RLS, preserve old data, run CI, then merge/deploy through the established safe release workflow.
7. Do not replace the Android APK until web changes and release checks pass; no paid services, subscriptions, provider credits or external spending without explicit approval.

## 8. Acceptance criteria

- Free chat displays its previous conversations in a left sidebar after login and after reload.
- A user can open a past Free conversation and continue it; messages remain in that same thread only.
- Starting a new chat always creates a new thread.
- Switching between Free, Health, Studio, Academy, Commerce and Business never appends to another module's conversation.
- Each chat in the history has a correct module/context label and opens in its original context.
- The main **Vorbește cu Dr.Vas** opens an independent general chat.
- Every module dashboard has separate feature cards; selecting one opens a dedicated workspace rather than leaving all forms stacked.
- Every feature workspace has a clear back-to-module action.
- Business Accounting and Self Assessment are distinct pages with independent saved records and assistant contexts.
- Desktop and mobile navigation both work; mobile history is a drawer/toggle, not removed.
- Existing legacy messages, attachments, saved projects and metadata remain intact.
- Owner A cannot read, list, edit or delete Owner B's conversations or workspaces.
- CI tests cover persistence, cross-module isolation, navigation, back actions, feature forms, accessibility and responsive layout.
- No claim of completion until CI and a production smoke test pass.

## 9. Current implementation status

This document is a product/technical specification and a verified defect analysis. The new navigation, metadata migration and UI refactor have **not yet been implemented**. No Supabase migration has been applied. The current branch contains this specification and handoff updates only. The founder explicitly asked to save the work and resume later.

## 10. Related voice fix completed in this session

PR #36 — https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/36 — passed GitHub browser E2E workflow run `42279655390` and was squash-merged to `main` as `bbb97c26636c2c8b867c02f12b97f51cc219fe0b`. It adds a cross-language feminine voice fallback for Sarah. Actual speaker playback and perceived voice quality still require device verification.
