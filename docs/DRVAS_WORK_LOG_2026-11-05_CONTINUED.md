# Dr.Vas work log — 2026-11-05 (continued)

## Owner request
Continue the implementation toward a complete, testable first release before optional enhancements. Preserve all previous product and access decisions. The owner also requests a branded public web address that does not expose the founder's personal name.

## Confirmed platform rules
- One integrated Dr.Vas platform and Android app.
- Welcome/language selection → sign in/register → module chooser.
- Dr.Vas Free and Dr.Vas Health are available to ordinary authenticated users without administrator status.
- Studio, Academy, Commerce and Business remain founder-only until the owner authorizes a separate entitlement/subscription launch.
- Only the founder account configured in Cloudflare `ADMIN_EMAILS` is administrator. Premium payment must never grant admin rights.
- Preserve separate workspaces, module-specific histories, Supabase auth, existing branding and existing user data.
- Do not change production secrets, admin allowlist, live Supabase schema/data, payments or Health Live without explicit approval.

## Studio audit findings
Inspected `worker/index.js`, `www/index.html`, `supabase/migrations/202611030004_studio_projects.sql`, and `supabase/migrations/202611040004_studio_render_storage.sql`.
- Studio project save/open is scoped by authenticated user ID.
- Video upload UI accepts up to 8 JPEG/PNG/WebP images (8 MB each) and an audio file up to 20 MB in the listed supported formats.
- The Worker render path checks the founder allowlist and applies a per-user render rate limit (3 per hour).
- Render media URLs are constrained to HTTPS URLs from the configured Supabase project; completed render downloads are restricted to Creatomate's CDN.
- MP4 output is validated and stored in the private `drvas-media` bucket; preview/download uses a 60-minute signed URL.
- The storage migration defines per-user RLS policies for projects, render jobs and media objects.
- IMPORTANT: these are source-code findings only. A real authenticated production render, upload, preview, download and cross-device reopen have NOT been demonstrated. Production health reporting `studio_renderer: configured` only proves the provider secret is configured.
- The migration files exist in the repository; their application to production Supabase has NOT been verified.

## Academy / Commerce / Business audit findings
Inspected `www/index.html`, `supabase/migrations/202611040001_module_projects.sql` and `supabase/migrations/202611040003_business_cashbook.sql`.
- Academy, Commerce and Business use a shared project table with a constrained module field and per-user RLS.
- The frontend save/open queries include user ID and module filters.
- Business cashbook entries are stored in a dedicated table with per-user RLS, date/type/amount/currency/VAT fields.
- The cashbook is an aid/record book, not statutory accounting, tax filing or regulated professional advice.
- The code audit does not yet prove production database migrations are applied or that all workflows have been exercised with real sessions.

## Public web address / privacy request
- Current Worker URL is `https://dr--vas-ai.vasilecatalinprodan.workers.dev/`; the account namespace exposes the founder's personal GitHub-style username.
- Desired outcome: branded custom domain such as `drvas.<chosen-domain>`, so the public address does not contain the founder's personal name.
- `wrangler.toml` currently defines Worker name, entry point, compatibility date, Supabase URL and static assets; it does not define a custom domain.
- No domain purchase, DNS change, Cloudflare custom-domain attachment or redirect has been made.
- Implementation depends on a domain controlled by the owner. Once selected/owned, configure the custom domain in Cloudflare for Worker `dr--vas-ai`, verify TLS/HTTPS, authentication redirects, Supabase allowed redirect URLs, canonical URL and old workers.dev handling. Do not expose personal email/account names in public metadata.
- Do not assume that a domain is already owned or choose/purchase one without owner approval.

## Verified prior release checkpoint (2026-11-05)
- Repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`
- Branch: `drvas-integrated-platform`
- Previous recorded HEAD: `f7b17c9828065ff62a99be529430ae9a617dfefe`
- Worker deploy + browser regression run `41940129821`: success; 38 Playwright tests passed, Worker deployed, production smoke test passed, SBOM uploaded.
- Android build run `41940558834`: success; debug APK artifact `DrVas-APK` ID `13375717907`, about 6.1 MB.
- Android manifest has `android:allowBackup="false"`; debug APK has not been installed/tested on a physical device and is not a signed Google Play release.
- Existing tests are browser simulations/mocks; do not describe them as a full real-user/real-provider integration test.

## Outstanding first-release work
1. Verify production Supabase migrations and RLS state without destructive changes.
2. Complete a real authenticated Studio MP4 render through Creatomate → private Supabase storage → signed preview/download → reopen saved project.
3. Exercise Academy, Commerce and Business save/open workflows, including Business cashbook, with the founder account and a separate ordinary account where permitted.
4. Verify module navigation, history isolation, responsive desktop/mobile behavior, and Free/Health public access.
5. Run full browser regression and Worker production smoke after any source changes.
6. Build and physically test an Android APK; prepare signed release only after the web release is stable.
7. Complete privacy/legal/provider readiness before public premium modules, payments or Health clinician services.

## Conversation continuity
This log records the durable decisions, technical findings, evidence and outstanding work from the 2026-11-05 continuation. It is not a verbatim transcript of every chat message; the conversation remains in ChatGPT history. Keep this file and the consolidated continuity document updated at each meaningful milestone.


## Follow-up work — module persistence regression tests
- Added `tests/e2e/module-persistence.spec.cjs` in commit `68b829dcc016fffeee66d13e0826dc66916344a8`.
- The new Playwright coverage exercises the Academy, Commerce and Business project-save functions with a stubbed Supabase client and asserts each write carries the authenticated owner ID, correct module key, title and module-specific brief provenance.
- CI runs triggered for this commit: browser regression `42002256508` and Worker deploy/regression `42002256604`. Their outcomes must be checked before claiming these new tests pass or that the Worker was redeployed.
- These are mocked persistence regression tests, not a substitute for real production Supabase sessions or a live database write/read test.

- Test harness correction in commit `50fbe3e5557d5fde85c5930cbe5243596c45083e`: the Playwright fixture now overrides the initialized Supabase client's `from()` method rather than attempting to reassign the application's `const supabaseClient`. This was caught during source review before CI results; final pass/fail remains pending.


## Follow-up — restore the last active module after browser restart (2026-11-05)
Owner request: when a signed-in customer closes and reopens Dr.Vas, resume the last selected module and the conversation they were using, until they explicitly choose another module or sign out.

Implementation committed:
- Runtime change: commit `fce0dadc80d81c7237cecb5bd83a0f82a4940368`.
- Added per-account local preference key `drvas_active_module:<user-id>` with validated module values.
- Selecting an authorized module stores it for the current account. On a valid restored Supabase session, `showChat()` restores that module and the remembered conversation; if an ordinary user has a stale/private module selection, it safely falls back to Free.
- A new visitor / explicit “enter modules” flow still sees the module chooser. Choosing a different module updates the remembered choice.
- Explicit logout clears the remembered module for that account. Authentication persistence still follows the “Păstrează-mă conectat” checkbox (checked by default in the current UI).
- Removed the extra session-resume confirmation prompt: a valid remembered session now resumes directly; users can switch accounts through explicit logout.
- The chat already scrolls to the latest message after opening a saved conversation; that behavior is retained during module restoration.

Regression coverage:
- Updated the browser expectation that previously required restored sessions to return to the landing page; new expectation verifies the last selected Health module opens.
- Added a per-account module preference test, including isolation from another account and clearing on logout.
- Test commits: `79289080d95ddfa5b888a65b281220ee9f8010d8` and `af55b9eea346a74a1e2e799f934bad87dd65267d`.
- The earlier run failed because the old test still asserted the now-obsolete landing-page behavior (37 passed, 1 obsolete expectation failed). That expectation was updated. The latest browser and deploy/regression workflows for `af55b9eea346a74a1e2e799f934bad87dd65267d` were still running when this log entry was written; do not claim their results until checked.

## Follow-up — three realistic speaking presenters
Owner's creative direction:
- Dr.Vas presenter: use the owner's own portrait and own voice.
- Sarah presenter: use Sarah's supplied portrait, creating an adult 23–24-year-old visual interpretation.
- Dr.Jan presenter: create an original AI presenter portrait/avatar.
- All three should be animated as realistic human presenters with natural speech/lip-sync, introducing the Dr.Vas story and presenting modules and the platform.

Assets still required from owner: one clear portrait of the owner, one clear portrait of Sarah, and a clean 30–60 second voice recording of the owner speaking naturally for voice reference. No portrait or voice asset has been uploaded in this turn, and no avatar/video has been generated yet.
Runway connection check: authenticated personal workspace is on the Free plan with 500 credits but currently exposes no video or speech models. The plans card was shown; Pro includes custom voice with lip-sync. No plan purchase or paid generation was made. Treat realistic talking-video production as pending until suitable video/speech capability and the required reference assets are available.
