# Dr.Vas AI — Project checkpoint
**Date:** 5 November 2026  
**Repository:** `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
**Active branch:** `universal-chat-attachments`

## Current user-confirmed state
- The Android APK installs, opens, and the application is usable.
- The current APK has no audible assistant voice. The voice fix below is committed to this branch, but a newly built APK still needs to be installed and tested.
- Continue work directly in this repository and preserve existing functionality.

## Voice diagnosis and changes
The front end already had a secure server-side `voice_tts` action using ElevenLabs in `worker/index.js`, returning MP3 audio. The front end's `playFounderVoice()` downloads and plays that audio for the signed-in Dr.Vas assistant.

The defect was in `speakDrVas()`: it returned immediately when `window.speechSynthesis` was unavailable, before trying the server-generated Dr.Vas audio. This can prevent playback in Android WebView environments without the browser SpeechSynthesis API.

Committed changes on this branch:
1. `www/index.html` — try server-side founder voice first, even if browser SpeechSynthesis is absent; allow Dr.Vas voice activation and replay without browser SpeechSynthesis; keep browser speech as fallback for other assistants. Commit: `b47d5ec36d985ab3b8ec5730c43666afeba7084d`.
2. `android/app/src/main/java/com/drvas/ai/MainActivity.java` — set Android WebView `mediaPlaybackRequiresUserGesture(false)` to permit assistant audio playback after a response. Commit: `72df319d2c5e697c507dee97a228d2ceb41c0f05`.
3. `.github/workflows/android.yml` — include `universal-chat-attachments` in the push build branches so APK changes on this branch can trigger the Android workflow. Commit: `b480ec3eccfe56253b954900bc6afcd4040b250d`.

## Immediate verification required
- Check GitHub Actions for the `Build DrVas APK` run triggered by the workflow change.
- Confirm the APK build succeeds; if it fails, inspect the failing job logs and fix the build.
- Install the newly built APK on the user's Android phone.
- Test: enable voice, send a message, hear Dr.Vas speak, replay the last answer, stop playback, and verify the written branding remains unchanged.
- If there is still no audio, inspect the Worker `voice_tts` response and the ElevenLabs secrets/rate-limit configuration without exposing credentials. The Worker requires `ELEVENLABS_API_KEY`, `ELEVENLABS_VOICE_ID`, a valid Supabase session, and configured rate limiting.
- Verify voice in the web version as well as Android.

## Pronunciation rule
Only text sent to TTS expands `Dr.Vas` to “Doctor Vas” and `Dr.Jan` to “Doctor Jan”. Do not change visible branding, written responses, logos, or assistant names.

## Product and architecture decisions to preserve
- Dr.Vas is one integrated platform, not separate disconnected projects, with an Android APK and web app.
- The six integrated modules are Dr.Vas Free, Dr.Vas Health, Dr.Vas Studio, Dr.Vas Academy, Dr.Vas Commerce, and Dr.Vas Business.
- Dr.Vas Free is the general AI assistant. Dr.Vas Health is informational/supportive and must not replace licensed clinicians or present itself as a doctor. Business-oriented modules can use paid plans.
- Preserve the existing authentication, Supabase persistence, module access controls, privacy/consent flows, audit logging, and security protections.
- Do not publish or open restricted modules publicly before the required legal/compliance readiness.
- Continue Studio development after the voice issue is verified; preserve the creative engine, project continuity, scene/timeline, social-video and rendering work already present.

## Known Studio state
- Studio has a production workspace for social video, including vertical 9:16 / target 1080x1920 output, subtitles, scenes/timeline, optional audio, and MP4 rendering controls.
- The Worker contains the Studio creative engine and a server-side render workflow. Verify configured render credentials and deployment before claiming export is live.
- The founder's custom voice option is marked as being configured; do not imply it is already available in Studio.

## Working rules
- Make changes on `universal-chat-attachments` unless the user explicitly chooses another branch.
- Inspect current branch files before editing; avoid replacing unrelated work.
- Commit each coherent change and report the exact commit and whether tests/builds actually passed.
- Never paste secrets into source files or commit them.
