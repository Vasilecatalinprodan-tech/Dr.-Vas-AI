# Dr.Vas founder operating directive — 7 November 2026

The founder explicitly reiterated that Dr.Vas work must be implementation-led, not conversation-only. Continue to make actual repository changes, run checks, merge passing changes into `main`, deploy the web/Worker production release, and verify the live result. Do not stop after proposing plans or creating PRs.

## Release order

1. Implement and stabilize the web platform and all modules.
2. Run browser, unit/static, persistence, security/RLS and provider integration tests.
3. Merge suitable passing PRs into `main`.
4. Deploy the website/Worker and run production smoke checks; record the deployed commit and result.
5. Verify module functionality, responsive layout, accessibility, attachments, history and voice using browser and manual device checks where required.
6. **Defer Android APK builds/rebuilds until the platform is stable and the founder explicitly moves the work to the final APK stage.** Do not spend time rebuilding APKs for every web iteration.

## Working expectations

- Preserve the integrated product and all existing working features; no destructive shortcuts or cosmetic-only fixes.
- Treat every user-reported defect as a reproducible issue: inspect the current implementation, add a regression test, fix, run tests, merge, deploy, verify.
- Keep all six public/future module workspaces coherent and usable, with independent conversation history and attachment controls. Founder-only premium modules remain gated until entitlements/compliance are ready.
- Keep Crypto/mining hidden and founder-only with real device and safety controls not yet enabled.
- Maintain a durable checkpoint after each meaningful implementation/release: user requirements, branches/PRs/commits, test results, deployment status, known gaps and next concrete task.
- The ChatGPT conversation remains in the account's chat history. Repository checkpoints preserve actionable decisions and progress but are not a verbatim export of the full conversation. Do not claim a verbatim chat archive unless one is actually created and verified.
