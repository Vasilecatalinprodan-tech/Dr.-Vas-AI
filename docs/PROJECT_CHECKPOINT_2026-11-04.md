# Dr.Vas AI — Project checkpoint (4 November 2026)

## Product direction
Dr.Vas is one integrated platform with six modules:
1. Dr.Vas Free — general AI assistant.
2. Dr.Vas Health — general health information and support; never a replacement for clinicians.
3. Dr.Vas Studio — creative and video-production tools.
4. Dr.Vas Academy — learning and course-building tools.
5. Dr.Vas Commerce — e-commerce and dropshipping support.
6. Dr.Vas Business — business planning and management support.

The Android app is a companion build of the same platform, not a separate product.

## Repository and deployment
- Repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`
- Working branch: `drvas-integrated-platform`
- Frontend: `www/index.html`
- Cloudflare Worker: `worker/index.js`
- Supabase project ref: `bqgshoqspcfbflgsnntn`
- Worker production URL: https://dr--vas-ai.vasilecatalinprodan.workers.dev/
- Worker health URL: https://dr--vas-ai.vasilecatalinprodan.workers.dev/health

## Verified engineering progress
- Chat workspace was moved outside the module-selection section so module visibility rules no longer hide the chat parent.
- Desktop chat uses a left-side six-module rail and a separate conversation area.
- Mobile chat hides the module rail and offers a return-to-modules action.
- Conversation scroll and fixed composer layout are covered by browser regression tests.
- Browser voice selection now refreshes when system voices load asynchronously and falls back to an available system voice if the selected language has no installed voice.
- The Worker has origin restrictions, authenticated sensitive endpoints, server-side rate limiting, and audit logging.
- Academy, Commerce and Business project drafts have per-user Supabase ownership and row-level security.
- The latest APK workflow run recorded before this checkpoint completed successfully and uploaded a `DrVas-APK` artifact. Run: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/actions/runs/41824074859
- The APK artifact belongs to source commit `3d31d0d347e7ceec761777d5e02304b3d2fabe34`; it is a successful build artifact, not proof of installation or device-level testing.

## Rate-limit repair — important pending verification
The original user-facing error, “Protecția de utilizare nu este disponibilă momentan”, is returned when the Worker cannot successfully call the Supabase RPC `public.drvas_consume_rate_limit` or cannot parse its result. The Worker intentionally fails closed; do not remove or bypass this security control.

Migration:
`supabase/migrations/202611040002_repair_rate_limit_rpc.sql`

It sets the function search path to `pg_catalog, public`, revokes execution from `PUBLIC`, `anon`, and `authenticated`, grants execution to `service_role`, and reloads the PostgREST schema cache.

The user reported running this SQL in Supabase, but has not yet reported whether the SQL editor returned Success or an error. Do not claim the live RPC or authenticated AI chat is fixed until verified. Next verification when the user is available:
1. Check the SQL editor result (Success or exact error).
2. Reload the deployed app, sign in, and send a simple message.
3. If it still fails, inspect Cloudflare Worker logs for the safe RPC status/error text and diagnose without exposing secrets.
4. Test normal text chat, browser text-to-speech, and Live Voice separately.

## CI improvement in this checkpoint
The Worker deployment workflow now statically validates the repair migration's expected function signature, hardened search path, revoked public/user-role execution, and service-role grant before deployment. This is committed as:
`922237b74b462ca30547a01d5d86319dea1d89b0`

## Remaining release gates
- Verify the Supabase SQL execution result and a real authenticated production chat request.
- Test desktop and mobile flows on real browsers/devices.
- Test browser TTS and Live Voice independently; do not treat them as the same feature.
- Install and test the APK on a physical Android device before calling it release-ready.
- Review privacy, terms, data retention, security, accessibility, and medical-safety boundaries before public launch.
- Keep Studio video rendering honest about provider limits, costs, watermarking, and storage ownership.


## Licensing and release governance additions
- Added `docs/LICENSING_IP_PRIVACY_AND_COMPLIANCE_ROADMAP.md` covering UK-first privacy, potential UK/EU medical-device obligations, AI/voice/video provider terms, code/dependency licences, trade marks, consumer subscriptions, accessibility and Android distribution. This is planning guidance, not legal advice or certification.
- Updated `README.md` to link the roadmap.
- Updated the Worker deployment workflow to generate a CycloneDX SBOM from the npm lockfile and upload it as a 90-day GitHub Actions artifact named `DrVas-SBOM`. The first run of this new step is still required to validate the installed npm version and artifact upload.
- Do not make the repository public or add a blanket open-source licence until ownership and third-party dependencies are reviewed.


## Business Desk MVP — 4 November 2026
- Added Dr.Vas Books cashbook UI: income/expense entries, date, category, amount, currency, VAT rate/inclusion setting, currency-separated summaries, per-entry delete and CSV export.
- Added migration `supabase/migrations/202611040003_business_cashbook.sql` with user-owned rows, RLS enabled, public/anon revoked and CRUD granted only to authenticated users under `auth.uid() = user_id`. This migration has NOT yet been applied/verified in the user's Supabase project; cashbook persistence remains pending until it is applied and real account tests pass.
- Added Student Desk in Business: assignment brief, rubric and student draft inputs; it creates a formative-feedback prompt, revision guidance and citation checks without fabricated sources or deceptive authorship. Private projects use the existing `drvas_module_projects` table with project_type `student_assessment_coach`.
- Added logout/account-switch cleanup for Student Desk drafts and local ledger data.
- Added browser E2E coverage for the cashbook's VAT calculations and Student Desk prompt; added CI static checks for the new table's RLS and frontend functions. The next deployment workflow run must pass before these changes are treated as verified.
- Added `docs/BUSINESS_DESK_AND_STUDIO_MVP_PLAN_2026-11-04.md` describing scope, limits and release gates.

## Studio provider status refreshed
- The connected Runway workspace currently reports 500 plan credits, 0 purchased credits, available image models, and no available video, speech, music or sound-effect models. Video generation/editing is currently gated. Do not claim a finished MP4 renderer until a provider or tested rendering pipeline is connected.
- Target for the next 1–2 days: deliver a complete Studio production package and activate actual video export only when provider/renderer, watermark-in-final-render and Dr.Vas-owned media storage are verified.


## Studio MP4 renderer — 4 November 2026
- Added a 9:16 / 1080×1920 Studio Render UI. Users can upload up to 8 private still images, add per-scene captions, optionally upload voice-over/music, or create a text-only teaser.
- Added Worker actions `studio_render_create` and `studio_render_status`. They require a valid Supabase user session, administrator allow-list membership, the server-side `CREATOMATE_API_KEY` secret, and server-side rate-limit approval.
- Worker validates RenderScript elements and only accepts media source URLs from signed objects in the user's private Supabase `drvas-media` bucket. It injects `MADE BY VPC` at a fixed top layer for the full video duration.
- Added migration `supabase/migrations/202611040004_studio_render_storage.sql`: private `drvas-media` bucket, per-user storage-object policies, and RLS-protected `drvas_studio_render_jobs` table.
- On provider completion, Worker copies the MP4 into the user's private Supabase storage; frontend creates short-lived signed URLs for preview/download. Project metadata can restore the private preview after reopening a saved Studio project.
- Added E2E coverage for a text-only render request and private preview. That test run is in progress as of this checkpoint.
- **Not yet production-verified:** live Supabase migration has not been applied; Creatomate API key has not been configured; no real MP4 has been rendered. The connected Runway workspace currently has image models but no video, speech, music or sound-effect models. This renderer assembles uploaded images/captions/optional supplied audio; it is not generative motion video.
- Creatomate trial currently advertises 50 credits without a card; provider-hosted output is temporary (up to 30 days), so the private Supabase copy is intentional. References: https://creatomate.com/docs/api/reference/create-a-render and https://creatomate.com/pricing.

## Repository confidentiality note
- GitHub repository visibility was checked and is currently `public`. The available GitHub integration can read/write source but does not expose a repository-visibility change action. Before adding proprietary voice samples, confidential customer/student/health data or any secrets, the owner should change the repository to private in GitHub Settings. No provider secrets should ever be committed to the repository.


## Final verification update — 4 November 2026, 12:23 UTC
- Latest Worker deployment workflow run `41828699601` completed successfully. It passed inline JavaScript validation, security/migration static checks, **16 browser E2E tests**, Worker deployment, production health/smoke test and CycloneDX SBOM artifact upload.
- Run: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/actions/runs/41828699601
- The deployment includes the Studio MP4 renderer actions and private storage workflow. This confirms code deployment and smoke test only; it does not confirm a live Creatomate render.
- Latest APK build run `41828699645` is still in progress as of this checkpoint. A previous APK build for commit `4cc9f805` completed successfully and produced artifact `DrVas-APK` (6,056,674 bytes); the latest build includes subsequent Studio render changes and should be preferred when complete.
- Studio production prerequisites remain: apply migration `202611040004_studio_render_storage.sql` and configure Cloudflare Worker secret `CREATOMATE_API_KEY`. No real production MP4 has yet been created.
- Added phase-two accounting architecture: double-entry journals, immutable posting/reversal, fixed-precision money, organisation-level permissions, tax localisation and Student Desk rubric/versioning. See `docs/BUSINESS_DESK_AND_STUDIO_MVP_PLAN_2026-11-04.md`.


## Android build completed — 4 November 2026, 12:24 UTC
- Latest APK workflow run `41828699645` completed successfully from commit `52298315d17317104950bef0c3b27d5e67f197e7`.
- Artifact `DrVas-APK`: 6,056,746 bytes, SHA-256 `9bb05e072d9c3d7849a20ae76bedfe89a8c8d48b6090cf86c08cdff7e9c93d3c`; expires 2 February 2027.
- Download via the GitHub Actions run page: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/actions/runs/41828699645
- Build success does not equal physical-device installation or release approval; still needs install/device testing.
