# Dr.Vas platform audit — 2026-11-06

## Scope requested by founder
A general audit of Dr.Vas Free, Health, Studio, Academy & Commerce, Business & Management, Android APK, security/infrastructure, and release readiness (website, APK, Google Play). The founder requires separate confirmation before each merge, APK build/release action and production deployment; never infer approval for one action from approval for another.

## Repository baseline
- Repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`
- Default branch: `main`
- Main HEAD at audit start: `74740f9412e5c04aaaf60a078a5d4c10042d32f1`
- Previous presenter-assets integration is present in main.
- The long-lived `drvas-integrated-platform` branch is divergent from main (107 commits ahead, 34 behind at comparison time). Do not merge that branch wholesale; inspect and selectively port changes because it has substantial divergence and overlapping historical changes.
- Latest main commit has no workflow run or combined status returned by the available GitHub Actions connector queries. This means CI/deploy status is unverified, not passing or failing.

## Findings by area

### 1. Dr.Vas Free
- General assistant policy is present in the Worker.
- Supabase authentication, conversation/history handling, language selection, voice/TTS and universal chat attachment paths are present in source.
- The Worker enforces bounded request/history sizes, provider timeout and rate-limit calls.
- Remaining verification: signed-in end-to-end chat, history round-trip across reload/device, provider fallback, long prompts, attachment consent and actual file processing with approved configuration.

### 2. Dr.Vas Health
- Dedicated educational health policy and UK emergency escalation guidance are present.
- Health Live voice is separately gated by `GEMINI_LIVE_HEALTH_ENABLED`.
- Health document/file analysis is fail-closed behind `DRVAS_FILE_ANALYSIS_ENABLED`; do not enable until special-category data handling, lawful basis/consent, DPIA, provider terms/retention and private-storage controls are reviewed.
- Remaining verification: clinical-safety scenarios, urgent escalation, consent withdrawal, no diagnosis/prescribing claims, and professional-care handoff. This product is not a medical device or substitute for clinicians on the basis of source code alone.

### 3. Dr.Vas Studio
- Presenter portrait assets and speaking-animation/fallback paths are integrated in main.
- Worker has render create/status routes and checks for a server-side Creatomate secret; the UI has render controls and private preview code.
- Source presence does not prove the provider is configured, paid rendering works, jobs complete, or MP4 files can be retrieved. Verify with a controlled, approved test render before claiming production video generation.
- Social OAuth and public auto-publishing must remain disabled until official platform permissions, token security, review and user approval are complete.

### 4. Academy & Commerce
- Academy/Commerce/Business project persistence code and owner-scoped migration are present in main.
- Migration `202611040001_module_projects.sql` creates one shared table with module values academy/commerce/business and per-user RLS policies.
- A committed migration is not proof it was applied to the live Supabase project. Live table, policies and two-user isolation still require read-only verification and controlled tests.
- Premium module server-side gates remain in place; do not expose paid modules publicly without verified entitlement and billing enforcement.

### 5. Business & Management
- Business project persistence, cashbook/ledger and break-even calculation paths are present in source.
- Owner-scoped RLS migrations and static regression assertions exist.
- Remaining verification: live schema/RLS, create/read/update/delete/export under two separate accounts, currency/tax assumptions, calculations and clear separation of estimates from actuals.
- Regulated accounting, tax, legal or investment decisions must remain subject to qualified professional review.

### 6. Android APK
- Capacitor config uses app ID `com.drvas.ai`, app name Dr.Vas AI and webDir `www`.
- Android workflow runs `npm ci`, `npx cap sync android`, privacy-default checks and `./gradlew assembleDebug`.
- The workflow's push trigger previously targeted only `drvas-integrated-platform`, not `main`. Thus production-branch changes did not consistently trigger APK builds.
- APK compilation is not device installation or runtime QA. Voice output, microphone permissions, file selection, navigation, offline/startup recovery and physical Samsung device behaviour remain unverified here.

### 7. Security and infrastructure
- Worker source contains server-side Supabase token validation, allowlisted CORS, security headers, bounded payloads, rate-limit RPC calls and server-side module gating.
- Migrations include RLS/owner checks for projects, cashbook, render jobs and chat attachment metadata.
- Live Supabase migration state, actual bucket policies, production secrets, key rotation, backup/restore and two-account isolation are not observable from repository inspection alone.
- Do not put service-role keys, provider keys, OAuth tokens or payment credentials in frontend code or Git.
- Payment/subscription execution is not implemented as a verified operational flow. The repository's payment/privacy docs are plans, not proof of live Stripe checkout/webhooks/entitlements/refunds.

### 8. Publishing
- Cloudflare Worker deployment workflow is configured for pushes to main when Worker/frontend/config/migration/test paths change, and includes syntax/static checks, browser tests, deploy and production smoke checks.
- The latest main commit's deploy result was not returned by the available Actions queries; production version therefore remains unverified in this audit.
- No evidence here establishes a signed release APK, Play App Signing configuration, Play Console listing, privacy/data-safety submission, store review or publication. Google Play readiness is not yet confirmed.

## Changes made during this audit
- Created branch `audit/platform-ci-coverage-2026-11-06` from main.
- Updated `.github/workflows/android.yml` so relevant pushes to both `main` and `drvas-integrated-platform` can build the APK.
- Updated `.github/workflows/browser-e2e.yml` so relevant pushes to `main` also run browser regression tests.
- Opened PR #22: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/22
- Initial PR head commit: `4d88ef2879628773751d8eebfb6f2bd2e4ba387e`; subsequent commits add regression fixes and CI trigger coverage.
- Initial browser run on the first PR commit: static Worker/HTML/migration validation passed; Playwright reported 61 passed and 2 failed. Failures exposed a stale accessibility-label assertion and a real portrait fallback recovery issue.
- Follow-up changes on the PR branch: presenter portrait images now restore visibility and hide fallback on successful reload; E2E assertions match the current descriptive alt text; browser workflow runs on PR `synchronize`; Android workflow now runs for relevant PRs targeting main.
- Latest observed PR head at this checkpoint: `348d687c52b77ff88062f01231ecf2cd97d976f5`. GitHub reports the PR open and mergeable=true, but its new browser and Android workflows are still in progress. No successful result has yet been established.
- A Cloudflare preview build for an earlier PR commit failed. That is a preview build, not evidence that production deployment succeeded or failed. Production deployment remains unverified.
- No live Supabase data/schema, production secrets, Cloudflare production configuration or paid services were intentionally changed.

## Next work sequence
1. Wait for PR #22 browser and Android checks; review logs/artifacts, confirm mergeability, then request the founder's separate merge confirmation.
2. After the founder separately authorises the APK build/release step, confirm the main-branch Android workflow produces an artifact; inspect build logs and artifact metadata. A PR debug build is not a release APK.
3. After separate deploy confirmation, run the full main-branch browser/security suite and verify the main-branch Worker deploy plus production smoke test.
4. Perform a focused runtime pass for Free/Health/Studio/Academy/Commerce/Business, with explicit consent and test accounts.
5. Verify live Supabase migrations/RLS/storage policies using read-only checks first; do not apply unverified write migrations automatically.
6. Test Android APK installation and voice on a physical device; then prepare a signed release build and Play Console compliance package.
7. Implement payment/entitlement only after merchant/legal/tax/refund/privacy requirements and webhook test plan are complete.
8. Keep all work in feature branches, add regression tests, and use PRs. The founder has authorised merge/deploy, but failed or unavailable checks must not be represented as successful.

## Conversation preservation
This is a structured engineering checkpoint of the user's 2026-11-06 audit request and work performed. It is not a verbatim export of the complete ChatGPT UI transcript. The conversation remains in ChatGPT history; repository commits and this document preserve the technical state and key decisions.


---

## Execution checkpoint — Crypto discovery, DNA interface and production deploy (2026-11-06 14:54 UTC)

- PR #26 merged to `main` by squash merge: `91671d5287509f5fb1421630cbbb92398e58c90f`.
- PR: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/26
- Presenter fallback recovery was integrated with guarded image lifecycle listeners. The regression test now explicitly opens the chat workspace before testing the portrait fallback; the previous test was running against a hidden parent and produced a false failure.
- Browser E2E on the final PR head passed: 66/66 in run #42237561426 (commit `a10d9c28134baf68c00312854ed34a14b683d062`).
- Main browser E2E passed: 66/66 in run #42237810062 (commit `91671d5287509f5fb1421630cbbb92398e58c90f`).
- Main deploy workflow #42237810171 passed: 91/91 browser/data-isolation tests, Wrangler production deploy, production health smoke test, homepage marker checks for all six public modules, unauthenticated admin endpoint check, and SBOM upload.
- Production Worker version ID: `b489c7ed-14ef-402c-88b8-f8e791c8845e`.
- Production deploy run: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/actions/runs/42237810171
- Main browser run: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/actions/runs/42237810062
- SBOM artifact: `DrVas-SBOM`, artifact ID `13513256382`, 28,581 bytes.
- PR #25 (separate presenter fallback attempt) was closed as superseded; PR #26 carries the tested fallback implementation.
- Android workflow is now manual-dispatch only. No APK work was started as part of this stage.

### Feature boundary after deploy
The Crypto feature currently deployed is the PoW discovery/profitability core: supported-coin catalog, market price lookup, strict > USD 1 filter, hardware/algorithm compatibility, and net-daily estimate. It is not yet a live native mining agent and has not extracted coins. The red/black emergency button currently latches local discovery commands only; it cannot stop an external miner until a signed native agent and authenticated stop channel are implemented. The catalogue is a supported set, not a claim to cover every token or every PoW network.

### Remaining platform completion work
- Continue functional completion and runtime validation of Free, Health, Studio, Academy, Commerce and Business.
- Verify live Supabase migrations/RLS/storage and provider secrets using authorized read-only checks first.
- Studio MP4 rendering still depends on valid Creatomate configuration and private storage.
- Health professional/clinic workflows require clinical governance, privacy and jurisdictional review; the module remains informational and does not diagnose or replace clinicians.
- Academy/Commerce paid access requires tested entitlements, payment provider configuration, refund/tax terms and consumer-law review.
- Business tools remain planning/bookkeeping support, not statutory accounting or tax filing.
- Build the native Crypto agent only after device ownership, hardware, power/thermal limits, cryptographic enrolment, signed miner adapters, pool telemetry and verified global stop are designed and tested.
- APK and Google Play remain deferred per the founder's instruction.

### Conversation preservation
The latest founder message is recorded verbatim in `docs/CHAT-ARCHIVE-2026-11-06-MINING-DNA-MODULES.md`. The archive is a technical continuity record, not a verbatim export of the entire ChatGPT UI transcript. The original conversation remains in ChatGPT history.
