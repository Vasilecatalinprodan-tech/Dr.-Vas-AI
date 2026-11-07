# Session checkpoint — restore the page scrollbar and keep chat scrolling independent
**Date:** 7 November 2026  
**Repository:** `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
**Branch:** `fix/independent-document-and-chat-scroll-2026-11-07`

## User's exact clarification
The user explicitly requires two independent vertical scroll areas at the same time:
1. The conversation transcript itself has its own scrollbar and can be scrolled without moving the page.
2. The whole page/document has a separate scrollbar at the far right and can be scrolled down to the bottom controls, attachment area and remaining content.
The desktop left history/sidebar must remain visible. On mobile it may be an accessible history drawer. The user said the previous repair did not solve this and asked to stop other development until this is fixed. The user also asked to preserve all progress, including this chat.

## Root cause found in current main
- Free and Health both enter `free-module-mode`; the selector also adds `html.drvas-free-shell`.
- Earlier CSS sets `html.drvas-free-shell`, `body.free-module-mode`, `main`, `#appMain`, `#chatSection`, `.chat-main` and other ancestors to fixed viewport heights and/or `overflow:hidden`.
- Health-specific rules attempted to re-enable page scroll, but Free and Health share the fitted-shell classes. Multiple later rules compete, so the page-level scrollbar is still not reliably available.
- The previous regression only simulated generic `chat-focus-mode + module-workspace-mode` and did not exercise the actual state entered by `selectModule("free")` and `selectModule("health")`. This explains why CI passed while the founder still experienced the bug.

## Changes in this branch
- Added a final, high-specificity CSS scroll contract at the end of the inline stylesheet in `www/index.html`.
- For both Free and Health it restores natural document/body height and vertical overflow, lets the main/app/chat section grow naturally, keeps the desktop history sidebar visible, and makes the transcript its own bounded `overflow-y:auto` scroll container.
- The composer, attachment list, file toolbar and voice toolbar remain in normal page flow and are reachable by scrolling the page.
- The mobile history panel remains a drawer, with page scrolling still enabled and the transcript separately scrollable.
- Existing unrelated modules and the SVG/WebGL DNA implementation are not changed.

## New regression coverage
- Desktop: enter the actual Free and Health modes via `selectModule`; assert a real document scroll range, transcript overflow, visible desktop sidebar, and prove that moving the document does not move the transcript and moving the transcript does not move the document.
- Mobile: enter actual Free and Health modes; assert document and transcript both scroll and the history drawer opens.

## Verification and release gate
- Source and regression test changes committed on this branch.
- Pull request and GitHub Actions browser tests are the next gate.
- Do not merge or claim fixed until the new tests pass.
- After merge, verify production deployment and run production smoke checks. Founder must then test actual scrolling in their browser, including the far-right page scrollbar, the chat's internal scrollbar, sidebar and attachment composer.
- Do not resume other module development until the user confirms the scroll behavior is corrected.

## Conversation preservation
This file captures the user's explicit requirement and the technical decision from this chat. It is a durable engineering checkpoint, not a verbatim transcript export. The original chat remains in ChatGPT history.
