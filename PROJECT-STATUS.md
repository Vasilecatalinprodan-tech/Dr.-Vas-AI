# Dr.Vas AI — Project Status

Last updated: 2026-11-03
Working branch: `drvas-integrated-platform`

## Product direction

Dr.Vas is one integrated platform, with a web app, Android app (APK), and a later Google Play release. It is not intended to be split into unrelated projects.

Modules:
- **Dr.Vas Free** — free general-purpose AI assistant.
- **Dr.Vas Health** — free general health information and education; it does not replace a clinician.
- **Dr.Vas Studio** — premium creative production for video and social media.
- **Dr.Vas Academy** — premium entrepreneurship education.
- **Dr.Vas Commerce** — premium e-commerce and dropshipping education/tools.
- **Dr.Vas Business** — premium business planning, analysis and management support.

Free and Health are active. Studio, Academy, Commerce and Business remain gated while subscriptions and their full features are developed.

## Technical environment

- GitHub repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`
- Active branch: `drvas-integrated-platform`
- Cloudflare Worker service: `dr--vas-ai`
- Production Worker: `https://dr--vas-ai.vasilecatalinprodan.workers.dev`
- Health endpoint: `https://dr--vas-ai.vasilecatalinprodan.workers.dev/health`
- Frontend: `www/index.html`
- Worker source: `worker/index.js`
- Supabase project URL is configured in Worker settings and frontend; never place service-role keys or provider secrets in frontend code.
- GitHub Actions deployment workflow: `.github/workflows/deploy-worker.yml` (runs on pushes to `drvas-integrated-platform` and can also be manually dispatched).

## Verified repository and deployment state — 2026-11-03

- Active branch: `drvas-integrated-platform`.
- Production Worker name and frontend API URL now agree on `dr--vas-ai`.
- GitHub Actions successfully deployed the Worker and passed the production health/configuration check and homepage checks for all six module cards on commit `1e547c931a70632f74c5134c6247661fa3207ff1`.
- The deployment workflow has since been extended with a production check that an unauthenticated `admin_status` request is rejected with HTTP 401. That new check is awaiting its first run.
- Worker and inline browser JavaScript syntax checks passed in CI.
- An Android debug APK build completed successfully on commit `48bad10801ea88fa4d214699c01a48ef0bb332c8`; the `DrVas-APK` artifact was uploaded. This confirms compilation and artifact creation, not installation or runtime behaviour on a device.
- A newer APK build and Worker deployment are triggered automatically by pushes. Check GitHub Actions before claiming their latest status.
- End-to-end authenticated AI chat, saved conversation continuity, runtime audit-log inserts, and dashboard reads still require a signed-in test.
- Four moderate npm dependency advisories were reported during CI. Review them without applying breaking or forced upgrades blindly.

## Existing capabilities and decisions

- Supabase authentication and user profile flow.
- Conversation history and memory support in the Worker.
- Gemini-backed assistant with model fallback and timeout handling.
- Health module safety instructions and UK emergency guidance.
- Premium module server-side gate remains enabled.
- Studio has a dedicated creative-director/screenwriter/social-media-planner instruction set. It can create concepts, series bibles, episode outlines and scripts, character arcs, dialogue, production notes, captions, hooks, hashtags, schedules and prompts for separate video/image tools. It does not yet render finished videos.
- Founder story is factual: Vasile-Cătălin Prodan (Cătălin/Vas), approximately 25 years in Romanian public/political life, including adviser and personal courier work for a Romanian Member of Parliament; more than 8 years as a Senior Healthcare Assistant in the UK NHS (not a doctor). “Dr.” is a nickname from colleagues. Jan is a virtual AI collaborator, not a human co-founder. Do not disclose private health/family details in public founder copy.

## Studio publishing objective

The founder wants a dedicated administrator area, visible only to the authorized administrator after login, to manage a TikTok and Instagram content workflow:
- TikTok account currently remains **Personal**. Do not change it to Business without a fresh discussion; the Creator Rewards programme requires a Personal account.
- Current TikTok audience reported by founder: approximately 3,000 followers.
- Growth objective: 10,000+ followers, while noting that follower count alone does not guarantee monetization. Creator Rewards also has recent-view, originality, account-standing and video-length criteria.
- Target production cadence: two original serial episodes daily, one in the morning and one in the evening.
- The founder must review and approve each episode before publishing.
- No social account is connected yet; no scheduled or automatic publishing is currently active.
- TikTok public posting through its Content Posting API requires official developer configuration and app approval/audit; unaudited clients can be restricted to private posting. Do not promise public auto-publishing until approved.
- Instagram API publishing requires an eligible Professional account and official Meta permissions. Do not claim a Personal Instagram account can be published to via the same API.
- Avoid repetitive/low-quality mass posting and respect each platform's content and monetization rules.

## Work completed on 2026-11-02

1. Confirmed the founder's TikTok account is Personal and agreed to keep it Personal for now.
2. Added a server-side administrator-status endpoint to `worker/index.js`:
   - Accepts `action: "admin_status"` with a Supabase access token.
   - Verifies the token with Supabase Auth.
   - Checks the authenticated email against the Cloudflare Worker environment secret `ADMIN_EMAILS` (comma-separated allowlist).
   - Returns only whether the current user is an administrator; does not expose the allowlist.
3. Added a hidden Dr.Vas Studio administrator panel to `www/index.html`:
   - Frontend asks the Worker to verify admin status after login.
   - Panel is revealed only if the Worker returns `is_admin: true`.
   - Shows TikTok Personal, Instagram connection state, and the two-episodes-per-day target.
   - Clearly states that social connections and automatic publishing are not yet active.
4. Ran JavaScript syntax checks for both modified files; checks passed.
5. Fetched the branch files again and confirmed both changes are present.

Latest code commits:
- Worker admin verification: `04fa871ca112e942baf81f1c2b1d022fa8b2bfba`
- Frontend admin panel: `f5a6baa9516410ca52108b69ba2301fa3c18f539`

## Internationalization — 2026-11-02

Implemented and deployed the first multilingual experience.

- A language selection screen appears before the public hero and module selection.
- Available languages: Romanian, English, Italian, Turkish, German, French, Spanish and Russian.
- The selected language is stored in browser localStorage under `drvas_language`; a Language button allows changing it later.
- Core public content, founder story, module cards, health disclaimer, authentication/profile screens, administrator panel, history controls, common status/error messages, page title, footer and accessibility labels have translation entries.
- The selected language code is sent with chat requests. The Worker maps it to a full language name and instructs the AI to answer in that language.
- Common memory and conversation-management commands have multilingual intent patterns; canned memory/action replies are localized in the frontend.
- Language preference is currently device/browser-specific, not stored in the user's Supabase profile. Cross-device language sync is not implemented.
- GitHub Actions now validates Worker and inline browser JavaScript, then deploys automatically on pushes to `drvas-integrated-platform`.
- Latest deployment succeeded: commit `427234353a67688a827997378dc2229f3c25c100`, workflow run `41533789006`.
- Production URL: https://drvas-ai.vasilecatalinprodan.workers.dev

Remaining language work:
- Manually test all eight languages on desktop and mobile, including changing language while signed in and signed out.
- Review every page string, form validation, authentication/provider error and health-module response for missing or awkward translations.
- Check localized delete-confirmation and memory commands in each language.
- Refine wording with native-level review before treating the translations as final.

## Required next steps

1. The founder confirmed on 2026-11-02 that the SQL migration `supabase/migrations/202611020001_admin_audit_logs.sql` was applied and that the `drvas_audit_logs` table and all nine columns are visible in Supabase Table Editor. Do not ask them to reapply it; runtime inserts and dashboard reads still need verification.
2. Test administrator access in the browser:
   - Sign in with the authorized founder account and confirm the panel appears.
   - Sign in with a normal account and confirm the panel stays hidden and premium modules remain gated.
   - Refresh the dashboard and confirm metadata events appear after the SQL migration.
3. Verify that the Cloudflare Worker secret `SUPABASE_KEY` is the service-role key required for server-only audit inserts/reads. Do not reveal or paste the key into chat or Git. The frontend must continue to use only its public anon/publishable key.
4. Test the browser voice MVP and Gemini Live in desktop Chrome and Android Chrome: microphone permission, all supported languages, current-chat context, transcript saving, native audio, interruption, stop, sign-out and background cleanup.
5. Finish Live reliability: session resumption/reconnect, robust transcript ordering, audio quality on mobile, and per-user usage/rate limits. The Live token is currently single-use and expires after 15 minutes.
6. Keep Health Live voice disabled by default. The Worker requires `GEMINI_LIVE_HEALTH_ENABLED=true` before allowing it. Set that secret only after reviewing the applicable Gemini API data terms, paid-tier privacy protections, healthcare data handling and legal/compliance requirements. The text-based Health module remains available with its existing safeguards.
7. Expand the administrator journal beyond its current 1,000-event fetch cap, add filters and server-side aggregation, and continue keeping conversation contents and health data out of operational logs.
8. Build persistent Studio workflows: episode queue, draft status, approval/rejection, schedule in Europe/London, publication log and retry/error handling.
9. Implement official OAuth connections for TikTok and Meta; store tokens securely server-side and support revocation/refresh.
10. Integrate actual video rendering, voice and subtitles. Current Studio engine produces scripts/prompts, not finished video files.
11. Only enable scheduled public publishing after each platform's app review/permissions and explicit user approval are in place.
## Important guardrails

- Do not expose admin access based only on a client-side flag or a hard-coded password in the page.
- Do not store social access tokens in localStorage or frontend source.
- Do not unlock Premium modules before subscription verification is implemented.
- Do not claim an integration, video render, publication, or deployment succeeded until it has been tested.
- Continue on `drvas-integrated-platform` and inspect the current files before making further edits.


## Voice assistant roadmap — 2026-11-02

Founder requested a Dr.Vas experience that can listen to people and speak back, not only accept typed messages.

Recommended implementation: use the Gemini Live API for real-time bidirectional voice rather than relying only on browser speech recognition plus speech synthesis.

Why:
- Gemini Live supports continuous audio input and native audio output over a stateful WebSocket, with low-latency conversational turn-taking.
- It can detect spoken language and adapt; Dr.Vas must still receive the selected UI language and explicit instructions for the response language.
- The user should be able to interrupt the assistant while it speaks; the client must immediately stop/discard buffered playback when Live reports interruption.
- Browser/mobile client must not receive the long-lived Gemini API key. Authenticate the user through Supabase, then have the Worker mint a short-lived, single-use, constrained Gemini ephemeral token for the Live session.
- Configure the token to constrain the model and response modality; keep the server-side safety/persona instructions and module boundaries protected.
- Native audio sessions are limited in duration and need session-resumption/context management for longer conversations.
- Live API audio usage is token-billed; apply session duration, idle timeout, rate limits, and clear user-visible microphone controls to manage cost and privacy.

Phased build:
1. Add a clear microphone/voice-mode control to the existing chat UI, with permission request, listening/speaking indicators, mute/stop/end controls, and text fallback.
2. Add an authenticated Worker endpoint that validates the Supabase access token and issues a short-lived constrained Live API token. Never expose GEMINI_API_KEY.
3. Connect the browser/mobile client to Gemini Live using the ephemeral token. Send audio in small chunks; play returned audio, render available transcription/text, support interruption and reconnect/resumption.
4. Preserve the selected language, current module, conversation identity and relevant Dr.Vas safety instructions in the Live session. Ensure Health remains educational/supportive and does not replace clinicians.
5. Save conversation text/transcripts to Supabase only with clear notice and user control. Do not retain raw microphone audio by default.
6. Test all eight languages, desktop Chrome, Android/Samsung browser and APK, microphone permissions, headphones/echo, backgrounding, poor networks, interrupted speech, and cost limits.

A basic push-to-talk/transcribe + existing chat + TTS fallback may be used as an early compatibility path, but the intended experience is natural two-way Live voice. The default Dr.Vas voice should be a warm, clear male voice, with a future voice selector; no cloning of a real person's voice without explicit consent.

References:
- Gemini Live API overview: https://ai.google.dev/gemini-api/docs/live-api
- Ephemeral tokens: https://ai.google.dev/gemini-api/docs/live-api/ephemeral-tokens
- Live API best practices: https://ai.google.dev/gemini-api/docs/live-api/best-practices
- Gemini TTS: https://ai.google.dev/gemini-api/docs/speech-generation

Status update — 2026-11-02:
- A first browser-based voice MVP has now been added to `www/index.html`: push-to-talk using the browser SpeechRecognition API, automatic submission of the recognized transcript to the existing Dr.Vas chat, optional spoken replies using SpeechSynthesis, replay and stop controls.
- Voice controls and status messages are localized across all eight supported interface languages.
- The browser voice selector prefers an available male-sounding voice for the selected language, but the actual voice depends on the device/browser and cannot be guaranteed.
- Microphone access is requested only after the user presses the microphone button. The page explains that browser speech recognition may be processed by the browser's speech service; Dr.Vas does not retain raw audio recordings.
- Privacy-safe client activity events are now supported by the Worker for sign-in/out, module selection, conversation create/open and voice input/output actions. Events contain metadata only, never conversation text, transcripts, audio, passwords or tokens.
- The administrator dashboard now displays 24-hour activity counts for each of the six modules and paginates the operational log in 100-row pages (up to the 1,000 most recent events currently fetched). A larger historical archive and server-side aggregation remain future work.
- Android's `AndroidManifest.xml` now declares `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS` for WebView microphone capture.
- The APK GitHub Actions workflow now triggers on pushes to `drvas-integrated-platform` and packages the existing `www/index.html` assets directly, instead of copying a potentially stale root-level `index.html`. A debug APK build succeeded (GitHub Actions run 39; artifact `DrVas-APK`, 6.4 MB). It has not yet been installed or device-tested and is not a Play Store release build.
- A real-time Gemini Live path has now also been added in code: an authenticated Worker endpoint validates the Supabase session and mints a one-use, short-lived Gemini 3.8 Live ephemeral token; the browser opens the constrained Live WebSocket, streams microphone PCM at 16 kHz, plays returned 24 kHz audio, handles model interruption, receives input/output transcripts and saves transcript text to the current Dr.Vas conversation.
- Live voice is configured with Google's prebuilt `Gacrux` voice and a warm, calm, masculine-sounding speaking instruction. The selected language and module are passed to the Worker. Health voice is deliberately blocked unless the Worker secret `GEMINI_LIVE_HEALTH_ENABLED=true` is set after data-protection and healthcare-compliance review; the Health text module remains available.
- Live sessions are limited by a 15-minute token expiry and the current audio-only session duration limit. Session resumption, reconnect logic, playback queue tuning and usage/rate controls still need further work.
- Live mode transmits microphone audio to Gemini for real-time processing. Dr.Vas does not store raw audio; text transcripts are saved to the user's existing chat history. The interface discloses Gemini processing and possible API usage costs.
- No browser or Android device QA has yet been completed for either voice path. The code has passed JavaScript syntax compilation in the GitHub-connected editing session, but production deployment and actual Gemini token/WebSocket operation still need verification.
- Supabase audit-log migration `supabase/migrations/202611020001_admin_audit_logs.sql`: user confirmed on 2026-11-02 that it was executed successfully in the linked Supabase project and that `public.drvas_audit_logs` plus all nine columns are visible in Table Editor. The SQL supplied by the user matches the repository migration exactly. The table is currently empty, which is expected until events are written. Runtime inserts/dashboard retrieval are NOT yet verified. Next checks: confirm Cloudflare Worker secret `SUPABASE_KEY` is the Supabase `service_role` key (never share or expose it), confirm latest Worker deployment, then sign in and generate a harmless test event and verify a row appears.

Official current Gemini Live API documentation:
- https://ai.google.dev/gemini-api/docs/live-api
- https://ai.google.dev/api/live
- https://ai.google.dev/api/generate-content (ephemeral token creation endpoint and schema)
- Current recommended low-latency model: `gemini-3.8-live`; use an ephemeral token for client-to-server browser/mobile connections. Audio-only sessions are currently limited to 15 minutes unless session management/resumption is implemented.


## Voice clarity update — 2026-11-02

- Implemented first-pass voice improvements in `www/index.html` and `worker/index.js`: browser TTS now runs at 0.84x with language-matched voice selection and no English fallback for missing Romanian voices; Gemini Live uses Charon, explicit language codes, clearer pacing/articulation instructions, and 0.92x client playback scheduling.
- Localized warning added when the device has no installed voice for the selected language.
- Changes are committed, but the latest deployment/build and actual browser/Android voice quality are still unverified. User must test Romanian and English Live and non-Live modes.
- Speech recognition remains browser-dependent for non-Live dictation; accuracy must be evaluated separately from TTS output.
- Do not describe voice as medically validated. Dr.Vas Health remains general information only and any future clinical use requires clinician oversight and formal safety/privacy/accessibility validation.


## Translation and voice refinement — 2026-11-02

- Strengthened the main assistant language instructions: translations must preserve meaning, nuance, register, names, numbers, negations and medical details; use idiomatic target-language grammar; avoid literal word-for-word rendering; and flag genuine ambiguity rather than guessing.
- Updated Gemini Live voice from Charon (informative) to Iapetus (clear male voice). The Live persona now requests a mature, calm, reassuring, professional and warm masculine delivery, with natural conversational rhythm and complete-word articulation.
- Improved browser speech synthesis: strips Markdown/code/URLs/list markers before reading, restores natural pauses at paragraph boundaries, uses a moderate 0.91 rate rather than 0.84, and slightly lowers pitch for a steadier delivery. Voice selection prefers installed enhanced/natural voices matching the selected language and never falls back to another language.
- Important limitation: browser speech voices are supplied by the operating system/browser, so the selected installed voice still varies by device. Gemini Live voice quality and translation accuracy require user testing in Romanian and English before considering this refinement accepted. No clinical translation or voice validation is implied.


## Consistent Dr.Vas identity and voice — 2026-11-02

- Founder story wording now identifies the role as personal adviser and personal courier to a deputy in the Romanian Parliament (Romanian: „un deputat din Parlamentul României”); this wording intentionally avoids naming a county or constituency, rather than the less precise „un deputat român”; the equivalent wording is updated in the supported language variants.
- Standard assistant and Live system instructions explicitly preserve the same Dr.Vas identity, personality and conversational style across all supported languages. Language changes must not create a different character.
- Gemini Live uses one configured voice name, Iapetus, for all supported language codes. Browser read-aloud uses operating-system voices selected by language, so the exact same acoustic voice cannot be guaranteed in browser TTS across Romanian and English. For a consistent voice identity, use Live mode; browser TTS remains device-dependent.


### Live voice consistency correction — 2026-11-02
- Server-issued Gemini Live tokens and the browser Live WebSocket setup now both specify `Charon` across all supported languages; removed the previous `Iapetus`/`Charon` mismatch.
- Standard browser read-aloud remains dependent on installed OS voices per language. Live mode is the consistent configured voice path.


### Gemini Live error diagnostics — 2026-11-02
- Live connection errors are now surfaced to the user instead of being replaced by the generic stopped message. Structured server errors and WebSocket close code/reason are displayed for diagnosis.

## Latest engineering update — 2026-11-03

- Worker audit writes for successful and failed AI requests are scheduled in the background through Cloudflare `ctx.waitUntil` where supported. Production deployment and its JavaScript validation + smoke test succeeded on commit `eaff90464255433c23a062b9e062d0f3d8b51e4d`.
- Live voice startup has a 15-second setup timeout, clears its watchdog on close/stop/error, and limits queued playback audio to avoid unbounded lag.
- Browser speech output now has per-language device voice selection and user-adjustable pace (calm/natural/fast/very fast). Preferences are local to the device/browser. The browser does not expose reliable voice-gender metadata; the preferred voice ranking is a best-effort name heuristic, not a guarantee of a masculine voice.
- Safe research and governed self-improvement architecture is documented in `docs/SAFE_RESEARCH_AND_AUTONOMY.md`. No public web search provider or Tor/onion provider is connected; Tor remains disabled.
- Latest APK build for the voice-picker change is still running: workflow run `41615775933`. Do not treat this code as tested on Android until the build succeeds and the APK is installed and tested on a device.
- Founder reports Instagram is currently Personal and is checking whether to switch it to Creator. Do not change the account type or claim Meta OAuth is ready until the founder confirms and supplies the required Meta Developer app credentials.



## Turkish and social account readiness — 2026-11-03

- Turkish (tr) is already supported in language selection, speech recognition (tr-TR), browser voice selection, and Gemini Live language configuration.
- Expanded Turkish translations for the Studio creation flow, Meta/TikTok connection disclosures and voice controls. Translation coverage is improved, not yet fully human-reviewed across every screen.
- Founder confirmed Instagram is now a Creator account. The Meta professional-account prerequisite is met, but the Instagram account must also be linked to a Facebook Page and Dr.Vas still needs Meta developer credentials, OAuth, approved permissions and secure server-side token storage.
- TikTok remains a separate integration requiring its own TikTok Developer app, OAuth and API approvals.
- Latest Android APK workflow 41615804712 succeeded; artifact DrVas-APK id 13220403831 (~6.0 MB). Physical device installation/testing remains outstanding.


## Privacy, premium profiles and payment foundation — 2026-11-03

- Added `supabase/migrations/202611030002_private_profile_and_privacy.sql`: Worker-only encrypted private-profile ciphertext table and minimal versioned privacy-consent evidence table. Direct anon/authenticated access is revoked; service_role only. This migration is committed but has NOT yet been applied in Supabase.
- Added `docs/PRIVACY_SECURITY_PAYMENTS.md` covering data minimisation, staged premium/business profile fields, AES-256-GCM Worker-only encryption, key rotation, MFA/passkeys/recovery codes, OAuth token handling, privacy centre/localization, Stripe subscriptions and Apple Pay/Google Pay versus in-person NFC.
- Existing `profiles` table currently stores display name and country; do not put DOB, phone, addresses or company identifiers there in plaintext.
- No private-profile API, encryption secret, payment processor, subscription webhook, wallet checkout or NFC acceptance is live. Do not collect new sensitive fields until Worker encryption endpoints and secret are implemented and tested.
- Traditional secret questions are explicitly excluded; use MFA, passkeys and one-time recovery codes instead. Never store user/social passwords, card numbers, CVV or PIN.


## Private profile encryption foundation — 2026-11-03

- The founder applied `supabase/migrations/202611030002_private_profile_and_privacy.sql` successfully. Private-profile ciphertext and versioned consent tables now exist in Supabase; client roles have no direct access.
- Worker commits `f2444312e65e88a7d961344d8d4cf454bb7b7336`, `f1caf661ae32d449658f74997bc23017099b7f22` and `84d5048eed796e6fc56938f76b4a9e3d149b9267` add authenticated `private_profile_get` / `private_profile_save` actions. The server validates the Supabase session, derives the user ID itself, validates an allowlisted profile schema and uses AES-256-GCM before writing ciphertext. CI JavaScript validation and production Worker smoke test passed on run `41619091780`.
- The encryption secret is not configured yet. Until `DRVAS_PROFILE_ENCRYPTION_KEY` is added in Cloudflare, the endpoints intentionally return 503. No private profile form or payment integration is live. Verify the latest deploy/CI run and perform an authenticated encryption round-trip before enabling collection.
- Data fields planned for Premium/Business include legal name, date of birth where justified, phone, billing/service addresses, company/trading name, business type, registration/tax identifiers where required, invoice preferences, locale and time zone. Do not add these to the plaintext public profile table.
- IP/security-event retention requires a documented purpose, role-limited access and retention schedule. Do not collect IMEI. Do not collect precise location unless a specific feature requires it and the user is informed.


## Encrypted private profile UI and consent — 2026-11-03

- Added an optional private-profile section to the account profile UI for legal name, phone, company name, business type, company country and invoice preferences. These fields are not written to the plaintext `profiles` table.
- Frontend calls the authenticated Worker actions `private_profile_get` and `private_profile_save`; the Worker verifies the Supabase session and encrypts the payload using the configured AES-256-GCM key before service-role storage.
- Added `privacy_consent_get` and `privacy_consent_save` Worker actions. Consent is recorded in `drvas_privacy_consents` with policy version `v1`; the UI restores the latest consent state on sign-in.
- Added explicit withdrawal: when the user unchecks consent and saves, the Worker records the withdrawal and deletes that user's encrypted private-profile row. The UI clears the fields only after the delete request succeeds.
- Worker deployment and production smoke test succeeded on run `41623518402`, commit `be510465f84faab1cba67d8d0c8e6f834bc599ad`. JavaScript validation and deploy steps passed.
- Android APK build for the same latest commit is still in progress at run `41623518375`; do not claim a new APK artifact until it completes.
- Not yet verified: signed-in end-to-end save/load/withdrawal using a test account, database row/ciphertext verification, cross-user isolation, and real device behaviour. Use synthetic test data only; do not enter health data, passwords, card details or other unnecessary sensitive information.
- Known boundary: consent policy version `v1` is an implementation identifier, not a substitute for a reviewed published privacy notice. Add retention, export, access and deletion controls plus legal/privacy review before public commercial onboarding.


## Studio pilot update — 2026-11-03

- Studio remains an administrator-only pilot while premium billing and subscription entitlement checks are not implemented.
- The Studio workspace now appears only after a verified administrator selects the Studio module. The previous frontend referenced `selectModule` from all six module cards without defining it; a handler has now been added to manage module selection, active-module UI, audit event and premium access gate.
- Studio includes workflows for books/e-books, translation/localisation, original music/lyrics, screenwriting, video/social content and editorial/commercial writing.
- Creative briefs now omit video-specific platform, duration and aspect-ratio fields for non-video deliverables and add suitable guidance for translation, books and music.
- The Studio Income tracker and private project manager remain in the admin pilot. Public Premium access must wait for subscription verification and payment integration.
- APK installation/testing is deferred by founder request. Keep Android builds as workflow artifacts; do not automatically publish a public Release.
- Outstanding: run CI/deploy checks, verify signed-in administrator can select Studio and load projects/income records, verify a non-admin cannot access Studio, and test the composer on the live page.
