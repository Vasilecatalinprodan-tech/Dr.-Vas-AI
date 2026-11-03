# Dr.Vas AI — Project checkpoint

Last updated: 2026-11-03
Repository: Vasilecatalinprodan-tech/Dr.-Vas-AI
Working branch: drvas-integrated-platform

## Product direction

Dr.Vas is one integrated platform with six areas:
1. Dr.Vas Free — general-purpose AI assistant, intended to remain free.
2. Dr.Vas Health — general health information and care-navigation support; not a doctor and never a replacement for clinicians.
3. Dr.Vas Studio — creative production and social-content workflows.
4. Dr.Vas Academy — education and entrepreneurship learning.
5. Dr.Vas Commerce — ethical e-commerce and dropshipping support.
6. Dr.Vas Business — business planning, operations and management.

Build and test the platform as one product. Do not represent unfinished features as operational. Complete a reliable foundation first, then improve each module in sequence.

## Verified repository state

- The branch `drvas-integrated-platform` exists.
- Frontend: `www/index.html`.
- Worker: `worker/index.js`.
- Cloudflare configuration: `wrangler.toml`.
- Capacitor configuration: `capacitor.config.json`.
- Supabase audit migration: `supabase/migrations/202611020001_admin_audit_logs.sql`.
- GitHub Actions workflow: `.github/workflows/deploy-worker.yml`.
- The Worker has GET health endpoints at `/health` and `/healthz`.
- The Worker contains Supabase-authenticated AI requests, admin checks, admin audit dashboard, client activity logging and a gated Gemini Live token endpoint.
- The frontend contains all six module cards and uses the Supabase publishable key in the browser (expected; never put a service-role key in browser code).
- Premium modules are currently restricted to configured admins for testing until subscription/payment entitlement checks are implemented.
- Dr.Vas Health Live voice is disabled by default pending privacy and medical-data safeguards.

## Changes made on 2026-11-03

1. Updated `wrangler.toml` Worker name from `drvas-ai` to `dr--vas-ai` to match the production Worker name.
   Commit: `16ea11758752971f453ba31f04511d313ede5c8b`
2. Updated frontend `API_URL` to `https://dr--vas-ai.vasilecatalinprodan.workers.dev`.
   Commit: `8efb450377c90f90e945f6f69268f3318ed7e73c`
3. Added durable project checkpoint.
   Commit: `abb506a194fc434f8aa5abfb1bb4092f0d7f284b`
4. Added a production Worker smoke test to GitHub Actions. It checks the `/health` JSON, Worker status, and configured assets/AI/database bindings.
   Commit: `368fc544ee7019d716764d79ef51d90fea84265c`
5. Hardened `.gitignore` for environment files, local keys/keystores, and generated Android/Gradle files.
   Commit: `48bad10801ea88fa4d214699c01a48ef0bb332c8`
6. Extended the smoke test to fetch the homepage and verify all six module cards. The first attempt exposed a bug in the test's shell pipeline (a `grep -q` early-close interacting with `pipefail`), not a confirmed application defect. Fixed the test to use a here-string.
   Latest fix commit: `1e547c931a70632f74c5134c6247661fa3207ff1`
7. Deployment and health/config smoke test passed on commit `48bad10801ea88fa4d214699c01a48ef0bb332c8`. The expanded homepage/six-module smoke test is being rerun after the shell-test fix; do not mark it passed until the latest run is green.
8. Android build workflow completed successfully on commit `abb506a194fc434f8aa5abfb1bb4092f0d7f284b`; a `DrVas-APK` artifact (debug APK, about 6 MB) was uploaded. A newer APK build is in progress; install/runtime behaviour is not yet verified.
9. CI `npm ci`, Worker syntax check, and inline browser JavaScript syntax check have passed. npm reported four moderate dependency advisories; review with `npm audit` before attempting any forced dependency updates.

Repository contents were re-fetched after the edits. Deployment of the Worker is confirmed on the latest health-smoke-test run noted above; end-to-end authenticated AI chat and Supabase audit inserts still need a real signed-in test.

10. Added a production security smoke check: an unauthenticated `admin_status` POST must return HTTP 401. The deploy run for commit `64c98e45f57d5c5c481f8ccf936ad38c36780426` completed successfully, including this expanded smoke-test step.
11. Refreshed `PROJECT-STATUS.md` to correct the production Worker URL/name, deployment workflow description, audit migration status and current verification boundaries.
   Commit: `b96cc4bcba4ca583d60974c7959b6e99f7b8e83b`
12. Latest verified Android APK build at this checkpoint: run `41612089004`, artifact `DrVas-APK`, about 6 MB. It compiled and uploaded successfully; installation/runtime on a physical device remains unverified.
13. End-to-end AI chat and Supabase runtime audit inserts/dashboard reads remain unverified because they require a real authenticated session. Do not ask the founder to share access tokens, passwords or service-role secrets.

## Immediate next steps

1. Confirm Cloudflare Worker secrets exist by name (never reveal or request their values):
   - `SUPABASE_URL`
   - `SUPABASE_KEY` — must be the Supabase service-role/secret server key, stored only as a Cloudflare Worker secret; never expose it in frontend files.
   - `GEMINI_API_KEY`
   - `ADMIN_EMAILS` — comma-separated administrator email allowlist.
   - Keep `GEMINI_LIVE_HEALTH_ENABLED` disabled until the Health Live feature has passed privacy, security and clinical-safety review.
2. Confirm GitHub Actions deployment workflow ran after the commits. The workflow validates Worker JavaScript and inline browser JavaScript, then runs `npx wrangler deploy`.
3. Check `https://dr--vas-ai.vasilecatalinprodan.workers.dev/health` and confirm the returned service, worker, assets, AI and database configuration statuses. A configured status does not prove database permissions work.
4. The user confirmed on 2026-11-02 that the audit migration was applied and the table/columns are visible in Supabase Table Editor. Do not ask them to reapply it; next verify runtime inserts and dashboard reads.
5. Sign in to Dr.Vas with the administrator account, generate one safe test event, then verify a row appears in `public.drvas_audit_logs` and the admin dashboard loads.
6. Test ordinary Free AI conversation, saved history, sign-in/sign-out, language selection, and voice separately. Do not use real patient data for testing.
7. Add automated tests and deployment checks before broad feature expansion.

## Important implementation notes

- The audit table stores operational metadata only; never store chat text, passwords, access tokens or provider secrets in it.
- The Worker uses `SUPABASE_KEY` for privileged REST access to audit records. Verify it is a server-only service-role/secret key in Cloudflare.
- Frontend `SUPABASE_KEY` is a separate publishable/anon key and is expected to be public.
- Do not enable Health Live until data minimisation, consent, retention, security, medical safety and applicable UK/EU requirements have been reviewed.
- Payment integration and real subscription entitlements are not yet verified. Admin-only access is a development gate, not a production subscription system.
- Android APK build/install and Google Play readiness remain separate verification tasks.

## Working rule

After each substantial work session, update this checkpoint with: completed changes, commit links/SHAs, tests actually run, outstanding blockers and the next exact action. Never mark an item complete unless it was verified.


## Dr.Vas Studio pilot workspace — 2026-11-03

- Added a dedicated Studio workspace to the frontend, visible when the administrator selects Dr.Vas Studio.
- The workspace offers structured inputs for the creative deliverable (dramatic series/episode, vertical short-form video package, YouTube video package, product/service advert, storyboard), target platform and original idea.
- The Studio builder composes a production-specific prompt and places it in the existing chat composer for review before submission. The existing Worker Studio system instructions then generate scripts, scenes, dialogue, production notes, social copy and prompts.
- Added clear disclosure: this pilot generates creative text and production instructions; it does not yet render finished video files or publish automatically.
- Added explicit commercial-access status: public paid access is not enabled yet. Premium Worker requests remain admin-only until server-verified paid entitlements and payment webhooks are implemented. Do not remove this server-side gate merely to make the UI appear public.
- Frontend change commit: `d0c5cce11ca7b899e877f9e78a9f4497d2eacb57`.
- Worker production deployment and smoke test before this frontend commit: run `41612475652` completed successfully on Worker history fix commit `25c9c95727a0e6d5c00d8a69a4ef5136ffc5468c`. The frontend commit triggers a new deployment/build workflow; verify its result before claiming this latest UI is live.
- Android debug APK build on commit `25c9c95727a0e6d5c00d8a69a4ef5136ffc5468c`: run `41612476208` completed successfully; artifact `DrVas-APK`, artifact id `13218709603`, approximately 5.7 MB. This is a debug APK artifact, not yet installed or tested on a physical phone and not a Google Play release.
- APK workflow URL: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/actions/runs/41612476208
- Latest verified APK checksum: `sha256:46146b604cabc7f4e7232c043ea39e4d20ae4c8c3a243cafb0ae3b379828f450`.

## Commercial Studio implementation still required

1. Connect the founder's Stripe account and configure product/price IDs for Studio plans.
2. Create a Supabase entitlement/subscription table with RLS and a Stripe webhook path; grant/revoke access only from verified Stripe webhook events. Keep the founder admin allowlist as a development override.
3. Add Worker checkout-session creation, Stripe signature verification and idempotent webhook processing. Never put Stripe secret keys or webhook signing secrets in the browser or repository.
4. Change Worker premium authorization to accept either the configured administrator or a current, server-verified Studio entitlement. Do not trust frontend flags.
5. Decide final public prices and usage quotas only after estimating Gemini/media-generation costs. The current Studio pilot produces text; video/image rendering is a separate integration and must have its own usage/cost controls.
6. Implement real media rendering, asset storage/gallery, project persistence and export before marketing Studio as a full video editor.
7. Connect official Meta/TikTok APIs only after the required app permissions/reviews; no auto-publishing is currently active.


## Studio social platform integration plan — 2026-11-03

- Added a Studio social integration panel in the frontend for Facebook + Instagram (Meta authorization) and TikTok (separate TikTok authorization).
- The panel clearly marks both integrations as in development; it does not display fake connected states or collect social passwords.
- Frontend commit: `c56b963bf61cc208ed3ff112167654fd48b12f2c`.
- Meta/Facebook Login route must be implemented server-side with OAuth state validation, authorization-code exchange, token refresh/secure storage, account/page discovery and per-user disconnect/revoke handling. For the Facebook Login route to Instagram publishing, the Instagram account must be a supported Professional account linked to a Facebook Page; supported permissions and App Review must be completed.
- TikTok requires a registered TikTok Developer app, Login Kit, configured HTTPS redirect URI, server-side OAuth code exchange, CSRF state validation, and secure token storage. Direct publishing additionally requires Content Posting API and approval for `video.publish`; unaudited clients have visibility restrictions.
- Do not store social access/refresh tokens in browser localStorage, frontend source, or Git. Store encrypted server-side, scoped per Dr.Vas user; implement revocation and deletion.
- Publishing must be opt-in and user-confirmed. Respect each platform's publishing restrictions, media formats, privacy choices, rate limits and app review.
- Official references checked 2026-11-03: TikTok Login Kit overview https://developers.tiktok.com/docs/en/login-kit-overview ; TikTok Content Posting API https://developers.tiktok.com/docs/en/content-posting-api-get-started ; TikTok app registration/review https://developers.tiktok.com/docs/en/getting-started-create-an-app ; Meta Instagram API docs https://www.postman.com/meta/instagram/documentation/6yqw8pt/instagram-api .
- Current state: social UI panel only; OAuth, connected-account storage, scheduled publishing, analytics and actual publishing are not yet implemented.

## Voice reliability, latency and governed research — 2026-11-03

- Worker now schedules successful and failed AI-request audit writes through the Cloudflare execution context `waitUntil` when available, so an operational audit insert does not hold the completed answer open. The existing synchronous fallback remains for runtimes without `waitUntil`. This is a code-level latency improvement; production p50/p95 measurements are still required.
- Browser Live voice now has a 15-second startup watchdog. If Gemini Live does not send `setupComplete`, the client closes the stalled session and reports a clear retry message. The timer is cleared on setup, close, error and manual stop.
- Live playback now bounds the scheduled audio queue: if playback falls more than eight seconds behind, the stale queue is cleared rather than allowed to grow without limit. This protects memory and recovery on slow devices/networks; perceived audio quality still needs device testing.
- Added `docs/SAFE_RESEARCH_AND_AUTONOMY.md` defining a future search-provider architecture, mandatory multilingual safety checks, restrictions for illegal exploitation/trafficking content, and a human-approved self-improvement pipeline.
- Onion/Tor and dark-web search are **not connected or enabled**. The current app has no external search provider. A future Tor gateway must be isolated, allowlisted, legally reviewed and unable to fetch arbitrary user-supplied destinations. No anonymous proxy, marketplace crawler, illegal-content cache or automatic file execution is permitted.
- Self-improvement is defined as monitoring, test generation, evaluation and proposing code/prompt changes in an isolated branch. Production deploys, secrets, permissions, payment controls and safety boundaries require human approval.
- Commits: Worker background audit scheduling `97ce20bfb3739c64fa46e094c93a012ab45e975b`; frontend Live watchdog/audio queue `f6f548a5fa1b3ce9d4f385c45bafc7a280e35252`; safe research/autonomy specification `b0794d173cf4c8caf40eb787e8e330036777ce2b`.
- CI/deploy/APK workflows triggered by these latest commits must be checked before describing the changes as deployed or built. No physical Android device test has been performed.
- Remaining blockers: Meta/TikTok developer app IDs, OAuth secrets and app reviews; a selected public search provider; isolated and reviewed Tor gateway (disabled); real production latency/cost metrics; Gemini Live browser and Android QA; subscription/payment entitlements; actual video rendering and publishing.

## Device voice selection and pacing — 2026-11-03

- Added a user-selectable browser/system speech voice list filtered to the currently selected Dr.Vas language. Available voices are ranked with likely higher-quality/natural options first, but the browser does not expose reliable voice-gender metadata; the UI therefore does not falsely guarantee a masculine voice.
- Voice choice is stored locally per language on the device, not in the server or user profile. The user can return to the automatic recommended voice at any time.
- Added speech pace options (calm, natural, fast, very fast); default remains natural. Adjustments apply to browser speech output/replay. Gemini Live remains on its configured Charon voice until separately evaluated and safely exposed as a server-approved choice.
- Voice options refresh when the browser loads its voice inventory and when the user changes Dr.Vas language.
- This improves user control and makes use of the best voices installed on each device. It does not install new voices or guarantee that every browser/device has a high-quality Romanian voice; device testing is required.
- Commits: `6cfcc408cebf1c13848cacf44744c43c44beba0c` (voice picker + pace controls), `eaff90464255433c23a062b9e062d0f3d8b51e4d` (refresh on language switch).



## Turkish audience and Instagram account confirmation — 2026-11-03

- Founder confirmed that the Instagram account has been switched to a **Creator** account. This satisfies the account-type prerequisite for the Meta professional-account route, subject to linking the Instagram account to a Facebook Page and meeting Meta's current API/app-review requirements.
- Turkish is already included as a first-class supported language: language selector, tr-TR speech recognition and browser speech output, and Gemini Live Turkish language/instructions.
- Expanded the Turkish interface dictionary to cover the Studio workflow, social-network integration disclosures, voice controls and voice privacy text. This improves the Turkish user journey but is not yet a complete professional human-reviewed translation of every screen.
- Browser speech quality still depends on the Turkish voices installed/provided by the device/browser. Gemini Live is configured to request Turkish; test it on Windows and the Samsung phone before public launch.
- Instagram Creator status does not itself connect the account to Dr.Vas. Meta OAuth, the linked Facebook Page, developer app credentials, approved permissions and secure server-side token storage remain to be configured. TikTok still requires its own developer app and OAuth credentials.
- The latest APK build completed successfully: workflow run 41615804712, artifact DrVas-APK, artifact id 13220403831, approximately 6.0 MB. This is a build artifact only; it has not yet been installed and tested on a physical device.


## Privacy, premium profiles and payment foundation — 2026-11-03

- Added `supabase/migrations/202611030002_private_profile_and_privacy.sql`: Worker-only encrypted private-profile ciphertext table and minimal versioned privacy-consent evidence table. Direct anon/authenticated access is revoked; service_role only. This migration is committed but has NOT yet been applied in Supabase.
- Added `docs/PRIVACY_SECURITY_PAYMENTS.md` covering data minimisation, staged premium/business profile fields, AES-256-GCM Worker-only encryption, key rotation, MFA/passkeys/recovery codes, OAuth token handling, privacy centre/localization, Stripe subscriptions and Apple Pay/Google Pay versus in-person NFC.
- Existing `profiles` table currently stores display name and country; do not put DOB, phone, addresses or company identifiers there in plaintext.
- No private-profile API, encryption secret, payment processor, subscription webhook, wallet checkout or NFC acceptance is live. Do not collect new sensitive fields until Worker encryption endpoints and secret are implemented and tested.
- Traditional secret questions are explicitly excluded; use MFA, passkeys and one-time recovery codes instead. Never store user/social passwords, card numbers, CVV or PIN.


## Private profile encryption API — 2026-11-03

- Founder confirmed that migration `202611030002_private_profile_and_privacy.sql` was successfully applied in Supabase. Do not ask them to run it again.
- Added authenticated Worker actions `private_profile_get` and `private_profile_save` in commit `f2444312e65e88a7d961344d8d4cf454bb7b7336`; corrected URL normalization and date-validation regular expressions in follow-up commit `f1caf661ae32d449658f74997bc23017099b7f22`.
- The API verifies the Supabase access token with Supabase Auth, derives the user ID from the verified session, validates an allowlisted profile schema (legal name, DOB, phone, billing/service addresses, company details, invoice preferences, locale/timezone), encrypts with AES-256-GCM using a fresh 96-bit nonce and user/schema-bound additional authenticated data, and writes ciphertext only to `drvas_private_profiles` using the server-only Supabase key.
- Read requests decrypt only after verifying the same user's token. Responses use `Cache-Control: no-store, private`. No private data is written to operational audit logs.
- **Not yet active:** Cloudflare secret `DRVAS_PROFILE_ENCRYPTION_KEY`; optional key-version variable; frontend profile form; key rotation; rate limiting; automated crypto/tamper/cross-user tests; production deploy verification. The endpoints must return 503 until the key is configured.
- Next exact step: verify GitHub Actions deploy/syntax checks; then have founder generate a random 32-byte key locally and add it as a Cloudflare Worker secret without sharing it in chat. Only after that build the localized profile UI and perform an authenticated save/read round trip.
- Never store plaintext DOB/phone/address/company identifiers in the existing public `profiles` table. Never collect IMEI; device-risk controls should use a privacy-preserving app-generated identifier if needed. IP logging requires a documented security purpose, access restrictions and retention policy.
