# Dr.Vas six-module continuity checkpoint — 7 November 2026

## Founder direction
Continue implementation across all modules and chat experiences, not just the latest Health scrolling fix. Preserve progress in this repository after each meaningful milestone. The Android APK remains deferred until the web platform is stable and the founder explicitly moves to the final APK stage.

## Confirmed state entering this work
- PR #51 merged into `main` at `1a8120cda3a79d162f6ef71fafb9d295965e6a2f`.
- PR #51 browser E2E run `42368785501` completed successfully.
- Health now has independent document/page scrolling and transcript scrolling; attachment controls remain reachable.
- The Android workflow is manual-only (`workflow_dispatch`), so web pushes do not automatically consume time rebuilding APKs.
- The founder operating directive is recorded in `docs/FOUNDER-OPERATING-DIRECTIVE-2026-11-07.md`.

## Product-wide requirements to preserve
1. One integrated platform with six module experiences: Free, Health, Studio, Academy, Commerce and Business.
2. All six chats use the shared professional shell: desktop conversation history/sidebar, mobile history drawer, New chat, Images, Scheduled, Library, Plugins, Explore, Projects, Recents, attachment control beside Send, voice controls, and clear navigation/logout.
3. Each module and feature conversation remains isolated by owner, module and feature key. Never merge histories across modules or reclassify legacy conversations without explicit safe context.
4. Module workspaces remain dedicated feature pages; moving existing form nodes must preserve IDs, validation and event handlers.
5. Health remains informational and must not be presented as a replacement for clinicians.
6. Studio, Academy, Commerce and Business remain founder-gated until paid access, entitlement enforcement, compliance and billing are genuinely ready.
7. Do not claim provider-backed rendering, publishing, integrations or live data until the relevant service has been configured and verified.
8. Never weaken Worker authorization, Supabase RLS, consent gates, rate limits or admin allowlists.
9. Do not spend money, purchase credits, publish content or connect external accounts without explicit approval.
10. Crypto/mining remains hidden/founder-only; real mining, custody, trading and withdrawals remain disabled pending separate safety controls.

## Current implementation in this continuation
- Branch: `test/all-six-mobile-chat-shells-2026-11-07`.
- Added a mobile Playwright regression that cycles through all six modules and verifies the history drawer opens, displays the conversation list, closes when navigating away, and the shared attachment/Send controls remain available when returning to chat.
- This is test coverage, not yet proof that the test passed. Wait for CI before merging.

## Next execution order
1. Run browser E2E and fix genuine failures without weakening meaningful assertions.
2. Merge the passing regression into `main`.
3. Verify the canonical production deployment and smoke test for the merged commit.
4. Continue module-by-module functional audits: feature controls, form validation, prompts, save/open/update/delete/export, independent conversation history, attachments, voice, responsive layout and server-side authorization.
5. Verify Supabase migrations and RLS against live deployment gates; add two-owner tests where coverage is missing.
6. Record each PR, commit, CI result, deployment run and remaining manual device checks here or in a dated follow-up checkpoint.
7. Only after web modules are stable, return to physical Android testing and the final APK build.

## Conversation preservation
The ChatGPT conversation remains in the user's ChatGPT history. This checkpoint records the actionable requirements and implementation state; it is not a verbatim export of the full conversation.
