# Dr.Vas AI — Chat handoff: persistent logout controls
**Date:** 6 November 2026  
**Repository:** `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
**Feature branch:** `fix/global-top-bottom-logout-2026-11-06`  
**Latest branch head at last documented checkpoint:** `0a64e84ffe4491b37380bfc96914ec54703f7c64`

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
- The changes are committed on the feature branch. PR [#30](https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/30) is open.
- Browser regression workflow #362, run ID `42247938978`, was triggered on the initial PR commit `f7ba344201c9aa66f53735cfd42c85d9ea85fe09`. A follow-up commit `80b83ddd...` added a defensive sync when changing workspaces. The first run must finish; if it checked out the earlier SHA, rerun CI against the latest branch head before merging.
- Review the PR diff, run the browser E2E workflow, fix any real regressions, then merge after green tests.
- After merge, verify the production Worker deployment and test the controls on desktop/mobile and each module workspace.
- Do not claim the controls are live until production deploy and smoke tests succeed.
- Android APK remains deferred.

## Conversation preservation
This handoff records the user's exact UX requirement, implementation design, files, branch, commit and validation steps. The actual ChatGPT chat remains in the user's conversation history; this file preserves the engineering context for continuation.


## Founder follow-up — DNA landing design, Sarah female voice, universal logout (6 Nov 2026)
- The founder clarified that the landing-page DNA must be highly realistic, with one rotating helix on the left and one on the right, extending from the top to the bottom of the first/home page. Preserve the existing rotation/motion character while extending the visual composition; do not change other page layouts.
- Sarah must have a clearly feminine voice in both ordinary chat playback and the three-presenter landing presentation. Current code routes Sarah's authenticated TTS through the server-side `ELEVENLABS_SARAH_VOICE_ID` secret, but the browser fallback does not yet select a female voice and the presentation currently assigns one shared voice to all three presenters. Prefer an available female device voice; do not invent a provider ID, add secret values to source control, or activate paid provider usage without explicit budget/configuration approval. If no suitable female voice exists on the device and the dedicated voice is not configured, communicate the limitation honestly rather than claiming a female voice was played.
- All modules (Free, Health, Studio, Academy, Commerce and Business) must retain the same easy-to-find global logout controls at the top and true bottom; no module-specific exception and no return of a buried middle logout button.
- Browser run #362 failed because two legacy assertions in `tests/e2e/homepage.spec.cjs` still searched for `.chat-logout-button`. The run had 66 passing tests and 8 failures from those stale assertions. Commit `800d5e9dde61c0afb89b57f606bc0f7f00805ec5` replaces both stale selectors with assertions for `#globalLogoutTop` and `#globalLogoutBottom`. Rerun the browser workflow on the new head before merging PR #30.
- Preserve the current ChatGPT conversation in its own history; this handoff records the engineering decisions and continuation context, not a verbatim private transcript.
