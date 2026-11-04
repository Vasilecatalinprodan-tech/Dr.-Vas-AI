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