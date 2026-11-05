# Dr.Vas — branch integration review

Date: 2026-11-05  
Repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
Current continuation branch: `universal-chat-attachments`  
Feature branch inspected: `founder-workbenches-development`

## Why this review exists

A repository-wide branch search found eight branches. The branch `founder-workbenches-development` contains substantial founder-only workbench implementation that is not present in the current continuation branch. It must not be overlooked, but it must not be merged blindly.

## Comparison result

GitHub compare was run with base `universal-chat-attachments` and head `founder-workbenches-development`:

- Status: `diverged`.
- Feature branch is 58 commits ahead and 147 commits behind the current continuation branch at the time of comparison.
- Merge base: `5bb13b80d5dcc3e1ce348cd1c39ec29af7a0fa17`.
- The compare response listed the following files in the feature branch's ahead-side comparison: `docs/DRVAS_FOUNDER_WORKBENCHES_2026-11-05.md`, `docs/DRVAS_PRESENTATION_THREE_ASSISTANTS_2026-11-05.md`, `docs/DRVAS_SESSION_2026-11-05_CONTINUATION.md`, `docs/DRVAS_WORK_LOG_2026-11-05_CONTINUED.md`, `tests/e2e/homepage.spec.cjs`, and `www/index.html`.
- This is a divergent history, not a simple fast-forward. Do not merge or reset either branch until a full diff and tests are reviewed.

## Existing founder-only features found in the feature branch

Inspection of `www/index.html` and its feature record shows these implemented source-level workbenches:

- Creator & Online Income Lab, restricted to the founder/admin dashboard.
- Book Workshop and Music Lab, staging structured briefs through the existing Studio save/open/export workflow.
- Online Income planner and AI Evaluation & Training Lab.
- Digital Product Studio, Publishing Lab and Music Release Lab.
- Commerce Profit Lab and Business Operations Planner.
- Mining Sensitivity Lab and a Bitcoin profitability calculator with manually entered revenue, electricity, cooling, downtime, pool fee, maintenance and tax-reserve assumptions.
- Customer Journey & Retention Planner and Content & Campaign Planner.
- Existing private income tracker search/filter/CSV export and cashflow reporting.
- An administrator-only, read-only crypto device registry. Mining and trading are explicitly disabled.
- An animated three-assistant public introduction (Dr.Vas, Dr.Jan and Sarah), with browser-native speech synthesis and a manual continue fallback.

The feature branch's Worker contains admin-verified, read-only crypto device listing and related cryptographic provenance functions. The inspected workbench record says no database migration, production secret, Worker route for live mining, payment, entitlement, RLS or production data was changed in this feature increment.

## Test and deployment status

- The feature branch workbench record explicitly says the initial workbench increments were not tested or deployed at the time of those changes.
- The continuation notes record subsequent Playwright regression work and historical CI runs. The last recorded calculator test change is commit `e2d5893274366c70b834a1beeebd2149ac0af97e`; the notes say a fresh completed CI run is still required for that latest test commit.
- The three-assistant presentation notes record an earlier failing test and a code/test correction, with a fresh CI run required.
- Do not treat a historical passing run for an earlier commit as proof that the latest branch head passes.
- No merge or production deployment of `founder-workbenches-development` is confirmed by this inspection.

## Integration recommendation

1. Preserve `universal-chat-attachments` as the current continuation branch while verifying the Android voice replay fix.
2. Determine the exact current head of `founder-workbenches-development`, inspect its full diff against the merge base and the current branch, and identify any overlapping edits to `www/index.html` and E2E tests.
3. Run the feature branch's latest CI and fix all failures; establish a reproducible local/CI test command.
4. Port or merge the feature work in small reviewed increments onto the continuation branch, resolving conflicts deliberately. Preserve newer session restore, voice/TTS and privacy fixes.
5. Re-run regression tests and Android build after integration. Deploy only after the founder approves the tested release.
6. Keep all founder-only workbench actions server-authorized; do not rely solely on hidden UI or localStorage flags.

## Important safety limits

- Crypto remains simulation/research only. No mining execution, wallet custody/signing, exchange connection, trade, transfer, visitor-device compute or automatic investing.
- Books/music/digital products remain drafts until rights, content, metadata and platform requirements are reviewed; no automatic publishing or distribution.
- Business/commerce calculators are estimates, not tax/accounting advice or demand forecasts.
- Customer journey/campaign tools create reviewable plans only; no CRM, messaging, ad spend or automatic publishing.
- The feature branch is not production-ready merely because the controls appear in its HTML source.
