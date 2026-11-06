# Dr.Vas platform audit — 2026-11-06

## Scope requested by founder
A general audit of Dr.Vas Free, Health, Studio, Academy & Commerce, Business & Management, Android APK, security/infrastructure, and release readiness (website, APK, Google Play). On 2026-11-06 the founder explicitly granted standing authorization to continue development, merge suitable fixes, trigger APK builds and deploy the platform without routine approval prompts. Pause only for genuine safety/legal risk, payment, personal credentials, or actions that require the founder's direct account access.

## Repository baseline
- Repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`
- Default branch: `main`
- Main HEAD at audit start: `74740f9412e5c04aaaf60a078a5d4c10042d32f1`
- Previous presenter-assets integration is present in main.
- The long-lived `drvas-integrated-platform` branch is divergent from main (107 commits ahead, 34 behind at comparison time). Do not merge that branch wholesale; inspect and selectively port changes because it has substantial divergence and overlapping historical changes.
- At the latest audit update, main commit `db811d21ea67ec0ef0ed56404eccd013a3cc2017` has a successful Cloudflare Workers production build check; the main-branch Android debug APK workflow succeeded and uploaded artifact `DrVas-APK` (artifact ID `13510761136`, SHA-256 `cb500fb0f953a8d4449ecaad2679ae70af51929199855d8b3432a4642eff093c`). Main browser E2E failed 1 of 88 tests, and the `Deploy Dr.Vas Worker` workflow stopped before its deploy step because the browser suite failed. Production health endpoint smoke test has not run.

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
- PR #22 was merged to `main` on 2026-11-06 at `db811d21ea67ec0ef0ed56404eccd013a3cc2017`. Its main-branch browser E2E reported 87 passed / 1 failed; the sole remaining failure is presenter fallback visibility after the Dr.Jan image is deliberately broken. Its Android debug build passed and uploaded the artifact noted above. Cloudflare's automatic production build check succeeded with version ID `921a778b-231d-45ec-a1b9-9daad4fa632e`.
- A Cloudflare preview build for an earlier PR commit failed. That is a preview build, not evidence that production deployment succeeded or failed. Production deployment remains unverified.
- No live Supabase data/schema, production secrets, Cloudflare production configuration or paid services were intentionally changed.

## Next work sequence
1. PR #23 (`fix/presenter-fallback-ci-2026-11-06`) contains a stronger image-error/recovery handler; run the browser regression and Android workflows, fix any further failures, then merge when checks and diff are sound.
2. The main Android debug build already passed; inspect and retain its artifact. Continue to a signed release APK only when signing credentials are available through the founder's secure account access. Debug APK compilation is not device runtime QA or a Play release.
3. Re-run main browser/security tests and the Worker deployment workflow after the presenter fallback fix; verify deploy and production `/health` smoke test before calling production deployment complete.
4. Perform a focused runtime pass for Free/Health/Studio/Academy/Commerce/Business, with explicit consent and test accounts.
5. Verify live Supabase migrations/RLS/storage policies using read-only checks first; apply write migrations only after checking the exact migration plan and backups.
6. Test APK installation and voice on a physical device; then prepare a signed release build and Play Console compliance package.
7. Implement payment/entitlement only after merchant/legal/tax/refund/privacy requirements and webhook test plan are complete.
8. Keep all work in feature branches, add regression tests, merge and deploy autonomously under the founder's standing authorization. Never describe failed or unavailable checks as successful.

## Conversation preservation
This is a structured engineering checkpoint of the user's 2026-11-06 audit request and work performed. It is not a verbatim export of the complete ChatGPT UI transcript. The conversation remains in ChatGPT history; repository commits and this document preserve the technical state and key decisions.


## Execution update — 2026-11-06 14:16 UTC
- Founder clarified that development, merge, APK build and deployment are pre-authorized; do not ask for routine approvals again.
- PR #22 successfully merged to main: `db811d21ea67ec0ef0ed56404eccd013a3cc2017`.
- Cloudflare Workers Build check for production service `dr--vas-ai` succeeded; version ID `921a778b-231d-45ec-a1b9-9daad4fa632e`. This proves Cloudflare built/deployed a production version, but the application health smoke test remains unverified.
- Main Android debug build run #342 succeeded. Artifact `DrVas-APK`, ID `13510761136`, SHA-256 `cb500fb0f953a8d4449ecaad2679ae70af51929199855d8b3432a4642eff093c`.
- Main browser regression run #329 failed: 87 passed, 1 failed. The failure is specifically the Dr.Jan portrait fallback span remaining hidden after the test changes the image src to a missing asset.
- Main deploy workflow run #502 failed before the Worker deploy and production smoke-test steps because its browser regression stage failed. The SBOM artifact was still uploaded.
- Created PR #23 to explicitly remove the fallback's `hidden` attribute and set its display to grid on image error; on image load it restores the hidden attribute and removes the inline display override. Browser and Android PR checks are running.
- Production health URL is `https://dr--vas-ai.vasilecatalinprodan.workers.dev/health`; direct check via the available web viewer was not accessible. Do not claim health smoke test passed.
- PR #23 URL: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/23


## Follow-up correction — presenter fallback PR #24 (2026-11-06 14:18 UTC)
- PR #23 was closed as superseded after its first code attempt still failed the browser regression. Its changes and archive checkpoint were carried forward into PR #24.
- PR #24: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/24
- Branch: fix/presenter-fallback-display-2026-11-06; latest code commit at this note: e0aaa7f0e34ea132f2f7031d21874a91016e36c3.
- The fallback implementation now uses explicit CSS display state instead of toggling the HTML hidden attribute: image error hides the broken image and displays the fallback; image load restores the image and hides the fallback.
- PR #24 browser regression and Android checks have started. Merge is pending their results. The next main deploy workflow must run the expanded 88-test suite before its Worker deploy and production smoke-test steps can complete.


## Follow-up correction — presenter fallback PR #25 (2026-11-06 14:20 UTC)
- PR #24 was closed as superseded after its browser test still reproduced the same race.
- PR #25: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/25
- Branch: fix/presenter-fallback-race-2026-11-06; code commit: 7ff26e8f8bcd9537809301820deff920dfeecd81.
- Root-cause hypothesis supported by test timing: a stale image load event may hide the fallback after the error event. The revised code keeps fallback hidden by default, shows it only on error, and checks naturalWidth before restoring/hiding it on load.
- PR #25 browser and Android workflows are queued. Merge only after the new browser test passes; then main deploy workflow must complete all 88 browser tests and production health smoke test.
