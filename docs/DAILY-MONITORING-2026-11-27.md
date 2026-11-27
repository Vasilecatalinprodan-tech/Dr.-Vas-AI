# Daily Dr.Vas AI monitoring — 2026-11-27

## Verified repository state
- `main`: `61a5b57cbbec7b7b111f3ef0506bc595c9d8043f` (branch endpoint read directly).
- `main` protection: disabled; required status checks are not enforced.
- Open PRs returned by the open-PR endpoint: #143. PR #139 was checked separately and is still open (endpoint listing discrepancy noted).

## PR #139 — Mining stale network data safeguard
- Head: `74c7859d9002ac7289935cd2ffb07b35c72a1910`; base recorded in PR: `3e0e5dad92cf74ddc04e1a8477940423874a0c4d`.
- Compare to current main: diverged, 5 ahead / 5 behind; merge base `3e0e5dad92cf74ddc04e1a8477940423874a0c4d`.
- Browser E2E run #887 / ID `43761439183`: failed, historical head `53a693a293fb7a40258d733bc954a3d6a9947b92`; browser/session-restoration step failed.
- Run #888 / ID `43762012231`: success on current PR head; Worker validation, migration-safety guard and browser/session restoration steps passed.
- Cloudflare check for current PR head remains failed, build `1f3620aa-c1c3-48ef-9bed-ed4e6bee7930`. Private build log unavailable.
- Do not merge until synchronized with main and exact-head browser + Cloudflare checks pass.

## PR #143 — archive/checkpoint
- Current checked head before this checkpoint: `7a62c41ee4ff18e4a168e1c7112d564d3f49bce7`.
- Browser run #906 / ID `45878278053`: success on exact head; browser regression steps completed.
- Cloudflare Preview check on that exact head failed: build `db4797ac-ddea-4ad9-a815-f3919673f32e`. Private log unavailable.
- PR #143 remains open. This documentation commit will require its own CI confirmation.

## Cloudflare production / deployment
- Current main classic commit status endpoint returned no individual statuses (total_count 0); this does not prove deployment health.
- No fresh production deployment or live HTTP smoke test was verified in this run.
- Last known successful production deployment remains run #568 / ID `43472877005`, app SHA `3e0e5dad92cf74ddc04e1a8477940423874a0c4d` (2026-11-13); deploy and smoke test passed at that time.
- Latest Cloudflare failure observed on PR #143 exact head is listed above; no cause available without private dashboard log.

## Module capability boundaries
- Existing browser suites exercise parts of Free/Voice AI, Health, Studio, Academy, Commerce, Business, Crypto & Mining and Online Income. No separate fresh per-module run was launched today.
- Subscriptions/Google Play: full purchase verification and entitlement flow not verified.
- Mining remains simulator/public-data freshness protection; no real miner, pool connection or hardware agent verified.
- TTS tests are automated only; no acoustic listening confirmation for Sarah, Dr.Vas or Dr.Jan today.
- APK remains deferred and manual-only.

## Safety and next steps
- No Codespaces created/started; no files, artifacts, volumes or user data deleted.
- No database/schema/RLS/migration/Supabase setting/secret changes; no SQL requested.
- No paid services used; no APK build.
- Next: inspect Cloudflare private build logs; synchronize PR #139 with main; rerun exact-head browser E2E and Cloudflare Preview. Merge/deploy only after green checks and SHA reconfirmation.
