# Dr.Vas AI — Chat handoff: persistent logout controls
**Date:** 6 November 2026  
**Repository:** `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
**Feature branch:** `fix/global-top-bottom-logout-2026-11-06`  
**Branch head:** `123e50eff44097cea5209bdb45bb585bb514b141`

## User request
The founder reported that sign-out is difficult to find and explicitly requested a logout control on every page, at the very top and at the very bottom of the page, never buried in the middle. The founder also requested that all work and this chat context be saved.

## Implementation prepared
- Added a persistent global **Deconectare** control in the main application header.
- Added a persistent global **Deconectare** control at the true bottom/footer of every page.
- Controls appear only while an authenticated user is active; they remain hidden on public/unauthenticated screens.
- In the full-screen chat workspace, the bottom footer control is fixed to the bottom edge and respects mobile safe-area inset; the top control remains in the global header.
- Removed the redundant logout button from the in-content chat navigation and from the chat-only footer action row, so sign-out is not buried among workspace controls.
- Added `syncGlobalLogoutControls()`; called when `showUser()` establishes an authenticated user and when `showLogin()` clears the session.
- Added Playwright regression coverage for signed-in vs signed-out visibility, top/bottom placement, and fixed bottom placement in chat focus mode. Updated the existing workspace test to assert the global controls.
- Files changed: `www/index.html`, `tests/e2e/homepage.spec.cjs`.

## Validation and next actions
- The changes are committed on the feature branch. PR and CI validation are pending.
- Review the PR diff, run the browser E2E workflow, fix any real regressions, then merge after green tests.
- After merge, verify the production Worker deployment and test the controls on desktop/mobile and each module workspace.
- Do not claim the controls are live until production deploy and smoke tests succeed.
- Android APK remains deferred.

## Conversation preservation
This handoff records the user's exact UX requirement, implementation design, files, branch, commit and validation steps. The actual ChatGPT chat remains in the user's conversation history; this file preserves the engineering context for continuation.
