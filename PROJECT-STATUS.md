# Dr.Vas AI — Project Status

Last updated: 2026-11-02
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
- Cloudflare Worker service: `drvas-ai`
- Production Worker: `https://drvas-ai.vasilecatalinprodan.workers.dev`
- Health endpoint: `https://drvas-ai.vasilecatalinprodan.workers.dev/health`
- Frontend: `www/index.html`
- Worker source: `worker/index.js`
- Supabase project URL is configured in Worker settings and frontend; never place service-role keys or provider secrets in frontend code.
- GitHub Actions deployment workflow: `.github/workflows/deploy-worker.yml` (manual workflow dispatch).

## Existing capabilities and decisions

- Supabase authentication and user profile flow.
- Conversation history and memory support in the Worker.
- Gemini-backed assistant with model fallback and timeout handling.
- Health module safety instructions and UK emergency guidance.
- Premium module server-side gate remains enabled.
- Studio has a dedicated creative-director/screenwriter/social-media-planner instruction set. It can create concepts, series bibles, episode outlines and scripts, character arcs, dialogue, production notes, captions, hooks, hashtags, schedules and prompts for separate video/image tools. It does not yet render finished videos.
- Founder story is factual: Vasile-Cătălin Prodan (Cătălin/Vas), approximately 25 years in Romanian public/political life, including adviser and personal courier work for a Botoșani MP; more than 8 years as a Senior Healthcare Assistant in the UK NHS (not a doctor). “Dr.” is a nickname from colleagues. Jan is a virtual AI collaborator, not a human co-founder. Do not disclose private health/family details in public founder copy.

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

1. Apply the SQL migration `supabase/migrations/202611020001_admin_audit_logs.sql` in the linked Supabase project's SQL Editor. Until this is done, persistent audit logging and the dashboard journal will report that setup is required.
2. Test administrator access in the browser:
   - Sign in with the authorized founder account and confirm the panel appears.
   - Sign in with a normal account and confirm the panel stays hidden and premium modules remain gated.
   - Refresh the dashboard and confirm metadata events appear after the SQL migration.
3. Verify that the Cloudflare Worker secret `SUPABASE_KEY` is the service-role key required for server-only audit inserts/reads. Do not reveal or paste the key into chat or Git. The frontend must continue to use only its public anon/publishable key.
4. Test the browser voice MVP in desktop Chrome and Android Chrome: microphone permission, Romanian/English/other selected languages, transcript submission, auto-read, replay, stop and sign-out cleanup. Confirm fallback typing remains available.
5. Implement the full Gemini Live API experience with authenticated ephemeral tokens, streaming microphone PCM, native audio output, interruption/barge-in, transcripts, session resumption and usage limits. Do not expose `GEMINI_API_KEY` to the browser.
6. Expand the administrator journal with pagination, filters and further operational events while keeping conversation contents and health data out of operational logs.
7. Build persistent Studio workflows: episode queue, draft status, approval/rejection, schedule in Europe/London, publication log and retry/error handling.
8. Implement official OAuth connections for TikTok and Meta; store tokens securely server-side and support revocation/refresh.
9. Integrate actual video rendering, voice and subtitles. Current Studio engine produces scripts/prompts, not finished video files.
10. Only enable scheduled public publishing after each platform's app review/permissions and explicit user approval are in place.

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
- The administrator dashboard now displays 24-hour activity counts for each of the six modules.
- A real-time Gemini Live path has now also been added in code: an authenticated Worker endpoint validates the Supabase session and mints a one-use, short-lived Gemini 3.8 Live ephemeral token; the browser opens the constrained Live WebSocket, streams microphone PCM at 16 kHz, plays returned 24 kHz audio, handles model interruption, receives input/output transcripts and saves transcript text to the current Dr.Vas conversation.
- Live voice is configured with Google's prebuilt `Gacrux` voice and a warm, calm, masculine-sounding speaking instruction. The selected language and module are passed to the Worker; Health mode includes emergency and non-diagnosis guardrails.
- Live sessions are limited by a 15-minute token expiry and the current audio-only session duration limit. Session resumption, reconnect logic, playback queue tuning and usage/rate controls still need further work.
- Live mode transmits microphone audio to Gemini for real-time processing. Dr.Vas does not store raw audio; text transcripts are saved to the user's existing chat history. The interface discloses Gemini processing and possible API usage costs.
- No browser or Android device QA has yet been completed for either voice path. The code has passed JavaScript syntax compilation in the GitHub-connected editing session, but production deployment and actual Gemini token/WebSocket operation still need verification.
- The Supabase audit-log SQL migration still must be run manually before the administrator journal can persist and display these new events.

Official current Gemini Live API documentation:
- https://ai.google.dev/gemini-api/docs/live-api
- https://ai.google.dev/api/live
- https://ai.google.dev/api/generate-content (ephemeral token creation endpoint and schema)
- Current recommended low-latency model: `gemini-3.8-live`; use an ephemeral token for client-to-server browser/mobile connections. Audio-only sessions are currently limited to 15 minutes unless session management/resumption is implemented.
