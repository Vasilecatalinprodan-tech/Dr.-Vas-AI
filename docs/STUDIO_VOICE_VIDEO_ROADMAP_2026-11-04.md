# Dr.Vas Studio production plan — 2026-11-04

## Founder requirements
- Deliver a polished, production-grade Studio that creates publishable vertical videos for TikTok, Instagram Reels and YouTube Shorts.
- Include the exact visible creator mark **MADE BY VPC** on every exported video. It must remain legible, discreet and inside platform-safe areas.
- The founder wants his own voice integrated as Dr.Vas. Sarah's portrait must be an adult-looking (23–24) photorealistic transformation based on the previously supplied Aurora reference photo, used only for Sarah.
- Continue using the existing repository and architecture; no project restart.

## Research and provider findings
- ElevenLabs Instant Voice Cloning supports short samples but recommends 1–2 minutes of clean audio; minimum total input is 10 seconds. Professional Voice Cloning requires at least 30 minutes and recommends around 1–3 hours, with owner verification. Current private sample /DrVas/Private/Voice/drvasvoice.ogg is 10,254 bytes and 4.5665 seconds, so it is below the stated 10-second minimum and not enough for the recommended Instant clone. No clone exists yet. Never claim founder voice cloning is active.
- Creatomate offers template and RenderScript-based REST video rendering, webhooks/status checks and downloadable render URLs. Free trial currently lists 50 credits; paid plans and credit usage must be checked before selecting a production tier. Generated media hosted by Creatomate is temporary (up to 30 days); production integration must copy final MP4 to Dr.Vas-controlled storage.
- TikTok Content Posting API supports direct posting only after app registration, product configuration, video.publish approval and user authorization. Unaudited apps' direct posts are private-only. Upload-to-inbox is a possible interim path and requires creator action in TikTok.
- TikTok creative guidance recommends vertical 9:16, high resolution, UI-safe text/captions and fast opening hooks.

## Runway account status
- Connected personal workspace vasile catalin authenticated.
- Workspace plan is Free, 500 plan credits, 0 purchased credits.
- availableVideoModels is empty; no video generation tool can currently run in this workspace. Do not promise Runway-based video creation until plan/model availability changes.
- Runway Pro plan card was shown for the user's requested video generation.

## Code implemented
- Commit 910570d5661c45206e2b2788ed0eca2aa5e48ba7 updates www/index.html Studio with a production standards panel, fixed MADE BY VPC brand mark, subtitle control, narration selection (founder voice pending / AI narrator / none), and TikTok/Reels/Shorts brief requirements (9:16, 1080x1920 target, 1–2 second hook, safe-zone captions and persistent watermark).
- Studio project save/restore persists narration, subtitles and the VPC branding requirement.
- This update improves the production brief and saved settings; it does NOT yet render a video file or connect TikTok publishing.

## Blockers / next implementation
1. Sarah's source portrait is not currently available in the searchable Library. Ask founder to re-upload the original Aurora photo before editing; do not generate an unrelated replacement and claim it is based on her.
2. For founder voice, obtain a clean 1–2 minute sample for ElevenLabs IVC (or 30+ minutes for PVC), and configure an ElevenLabs account/API key and verified voice ID. API keys must be stored only as Cloudflare Worker secrets, never in frontend or GitHub.
3. Select/connect a rendering provider (Creatomate is a viable template-rendering option) and add its API key as a Cloudflare Worker secret. Build render job/status/webhook flow and persist completed MP4s in Dr.Vas-owned storage.
4. Add TikTok OAuth and Content Posting API only after registering the Dr.Vas developer app and obtaining required scopes/audit. Until then, export MP4 + caption + hashtags for manual posting.
5. Preserve the fixed MADE BY VPC mark in the actual render template, not only the prompt or preview.
6. Complete integrated desktop/mobile, real account, voice and video tests after provider credentials and source assets are connected.

## Additional voice integration code — 2026-11-04
- Worker commit `388b4a23d13ff7daa11e296b8c0728fae0fdeaeb` adds an authenticated, server-side `voice_tts` action. It requires Cloudflare secrets `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID`, validates the Supabase user, enforces a per-user `voice_tts` rate limit (12 requests/minute), calls ElevenLabs Multilingual v2, and returns audio/mpeg. Provider credentials never reach the browser.
- Frontend commit `0897539b6a4dc697a608d7efef17777a2233379d` attempts founder-voice playback for Dr.Vas when the server endpoint is configured; if unavailable, it falls back to existing browser speech synthesis. The clone is NOT active until a verified ElevenLabs voice ID and API key are configured.
- Next founder inputs: clean 1–2 minute spoken recording in the language(s) intended for cloning, plus a verified ElevenLabs voice ID and API key configured as Cloudflare Worker secrets (never pasted into chat or committed). The existing OGG sample is 4.5665 seconds and is below the 10-second minimum stated by ElevenLabs.


## MP4 render integration — 4 November 2026

### Implemented in code
- Added a Studio Render panel for 9:16 MP4 output at 1080×1920.
- Users can upload up to 8 private scene images (JPG/PNG/WebP), add one caption per scene, and optionally upload an audio narration/music track (MP3/WAV/M4A/AAC).
- When no images are selected, Studio can create a short typographic teaser from the project title and idea.
- The Worker accepts only authenticated administrator render requests, enforces per-user render rate limits, validates the RenderScript and permits media sources only from signed URLs in the user's private Supabase bucket.
- The Worker injects the `MADE BY VPC` watermark as a fixed top-layer element for the full render duration; the browser cannot omit it.
- Creatomate API credentials are read only from the Cloudflare Worker secret `CREATOMATE_API_KEY`; the browser never receives the provider key.
- Render status is stored in `drvas_studio_render_jobs` under RLS. Completed MP4 files are copied from the provider to the private `drvas-media` Supabase bucket and exposed to the owner through short-lived signed URLs.
- Studio project metadata stores the render job ID and private storage path; project restore can recreate a signed preview link.
- Logout/account switching clears the preview and selected local media controls.

### Database migration required
Apply `supabase/migrations/202611040004_studio_render_storage.sql` in Supabase. It creates the per-user render-job table, private media bucket and per-user storage-object policies. It is safe to re-run.

### Provider configuration required
- Create a Creatomate account and copy the project API key.
- Add it to the Cloudflare Worker as a secret named `CREATOMATE_API_KEY`; never put the value in GitHub or the frontend.
- The current official Creatomate trial advertises 50 API credits without a credit card. Actual resolution, duration, credit consumption and output availability are subject to the active plan and current provider limits.
- Creatomate's API accepts RenderScript directly at `POST https://api.creatomate.com/v2/renders`, and the status endpoint returns the final MP4 URL when complete.
- Creatomate-hosted output files are temporary (up to 30 days); Dr.Vas therefore copies the completed file into its private Supabase storage instead of relying on the provider URL.

### Important capability boundary
This first renderer assembles uploaded still images, scene captions and an optional supplied audio track into a branded MP4. It is a real render/assembly engine, not a generative motion-video model. The currently connected Runway workspace reports no available video, speech, music or sound-effect models. Cinematic AI-generated moving footage, cloned founder narration and generated music remain separate provider capabilities that require available models, appropriate consent and/or credentials.

### Verification state
- Latest Worker deployment workflow run `41828699601` passed JavaScript/static security validation, **16 browser E2E tests**, Worker deployment, production smoke test and CycloneDX SBOM generation: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/actions/runs/41828699601
- The Studio render request and private-preview browser test passed as part of those 16 tests.
- The Creatomate API key has not yet been configured, and the Supabase migration has not yet been applied in the live project. Therefore no real MP4 has yet been rendered or saved in production.

### Provider references
- Create Render: https://creatomate.com/docs/api/reference/create-a-render
- Render status: https://creatomate.com/docs/api/reference/get-the-status-of-a-render
- Trial, credits and 30-day output retention: https://creatomate.com/pricing
