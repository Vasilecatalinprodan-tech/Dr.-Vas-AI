# Dr.Vas voice and avatar system

## Character identities

- **Dr.Vas** — founder's supplied portrait asset `www/drvas.jpeg`; Live voice preset currently `Charon`.
- **Dr.Jan** — original adult male SVG portrait (dark hair, suit and tie); Live voice preset currently `Fenrir`.
- **Sarah** — original adult brunette SVG portrait; internal assistant key remains `aurora` for compatibility with saved preferences; Live voice preset currently `Aoede`.

The three assistant identities remain separate. The selected assistant controls the displayed avatar, assistant name, and Live voice preset.

## Live voice room — implementation

- The Live button is labelled **Vorbește cu Doctor Vas** in Romanian and **Talk to Doctor Vas** in English.
- Pressing it opens a dedicated visual voice stage and clones the currently selected assistant's existing portrait into the stage.
- The stage exposes a close control, assistant name, status text and animated audio-wave indicator.
- The existing authenticated Live flow still requests microphone permission through the browser's `getUserMedia` permission prompt. The microphone is not opened merely by visiting the page.
- The selected assistant's Live voice remains mapped to Charon / Fenrir / Aoede.
- The avatar stage changes to a listening state after Live setup and a speaking state when audio chunks arrive. It returns to listening when playback finishes.
- Chat speech synthesis also animates the selected assistant. Dr.Jan and Sarah have a small mouth-shape animation; Dr.Vas's portrait uses a subtle speaking pulse because the supplied photo is a flat image.
- Reduced-motion preferences disable the new animation effects.

## Honest limits of the current animation

These are lightweight CSS/SVG animations, not photorealistic face rigging, generated video, or phoneme-accurate lip-sync. The portrait moves and reacts to audio playback, but it does not yet reproduce natural facial expressions or exact mouth shapes for every spoken syllable. For a realistic story/video experience, the next stage needs properly rigged 2D/3D characters or generated character footage with synchronized dialogue.

## Founder voice clone — not yet enabled

The founder's current private sample `drvasvoice(1).ogg` is about 4.55 seconds. It must not be committed to this public repository. Current Gemini Live presets cannot be relabelled as the founder's actual voice.

ElevenLabs' official Instant Voice Cloning guidance recommends 1–2 minutes of clean, consistent audio; each sample must be at least 5 seconds and the combined minimum is 10 seconds. The platform also documents real-time conversational WebSocket agents and secure signed-URL access. This is a technically plausible route for a future custom-voice Live session, but it would require:

1. A clean 1–2 minute Romanian founder recording and the provider's own voice-owner verification/consent steps.
2. Founder approval of the provider, account, plan, data-use settings and expected usage cost.
3. A server-side Cloudflare Worker integration; API credentials must remain Worker secrets and must never be placed in browser code or GitHub.
4. A carefully designed bridge to the existing Dr.Vas model/context, authentication, conversation history, rate limits, retention controls and error handling.
5. Tests for latency, Romanian pronunciation, interruptions, microphone permissions, accessibility and mobile browsers.

Official technical references:
- https://elevenlabs.io/docs/eleven-creative/voices/voice-cloning/instant-voice-cloning
- https://elevenlabs.io/docs/eleven-agents/libraries/web-sockets
- https://elevenlabs.io/docs/eleven-api/guides/cookbooks/speech-engine

No external voice-cloning provider has been connected and no paid service has been enabled.

## 2026-11-05 — founder feedback: distinct voices and photorealistic faces

Founder feedback:
- The three assistants must not all sound like the same voice. Dr.Vas should sound male and distinct; Dr.Jan should have a different male voice; Sarah must have a clearly female voice.
- Current text-to-speech implementation explains the issue: only Dr.Vas calls the authenticated ElevenLabs `voice_tts` endpoint, which uses the single Worker secret `ELEVENLABS_VOICE_ID`. Dr.Jan and Sarah fall back to browser `speechSynthesis`, whose automatic mode picks the first voice matching the language. That can select the same device voice for all three.
- Gemini Live has separate requested presets (Charon for Dr.Vas, Fenrir for Dr.Jan, Aoede for Sarah), but those are separate from the browser TTS path and must be tested on the actual device.
- Planned correction: make the assistant identity explicit in the TTS request and map each identity to its own server-side provider voice ID; never expose provider IDs/API keys in the frontend. Preserve Dr.Vas's existing secret as a compatibility fallback, and add separate Worker secrets for Dr.Jan and Sarah only after the founder chooses/approves voices and provider usage. Until configured, show a clear voice-not-configured state rather than silently pretending the same voice is distinct.
- Browser fallback should remember voice choice per assistant and language, and its automatic selection should prefer an appropriate voice profile (female for Sarah, male for Dr.Vas/Dr.Jan) when the device offers one; if unavailable, tell the user that distinct voice is not available on that device.
- Add automated tests that prove each assistant requests the correct identity/voice mapping, plus physical tests on Samsung S24 and browser/Android APK.
- Avatar feedback: replace the two illustrated SVG assistant portraits (Dr.Jan and Sarah) with photorealistic adult portrait assets. Keep Dr.Vas's existing founder portrait. The current CSS/SVG movement is only a simple visual animation, not realistic facial animation or lip-sync.
- Before generating/replacing portrait assets, confirm whether the founder wants fictional photorealistic AI-generated adult faces or supplied real-person photographs. If using supplied photographs, obtain the image and permission from the person shown. Do not use a minor's photograph to create an adult identity.
- Future talking-head/lip-sync animation is a separate scope from static photorealistic portrait replacement and requires a suitable licensed video/animation provider, source assets and approved usage costs.
- No new voice provider secrets were created, no paid voice provider was activated, and no new portrait assets were generated in this checkpoint.

## Implementation checkpoint — assistant-specific TTS routing

- The Worker now accepts only the assistant IDs `drvas`, `jan` and `aurora` for `voice_tts`, verifies the authenticated Supabase session, applies the existing per-user rate limit, and selects the provider voice ID only from server-side secrets.
- Secret mapping: `ELEVENLABS_VOICE_ID` for Dr.Vas (backward compatible), `ELEVENLABS_JAN_VOICE_ID` for Dr.Jan, and `ELEVENLABS_SARAH_VOICE_ID` for Sarah. No provider IDs or API keys are sent to the browser.
- The frontend now sends the selected assistant identity to the Worker for all three assistants. If a dedicated voice is not configured or the provider is unavailable, it falls back to the device's browser speech engine; therefore genuinely distinct voices are not yet guaranteed until the three voice profiles are configured and tested.
- Do not invent voice IDs or add secrets to source control. The founder must choose the voices and add the three IDs plus the provider API key using Cloudflare Worker secrets. Do not activate paid voice usage without explicit budget approval.
- Added a browser regression test that checks the frontend sends the correct assistant identity for Dr.Vas, Dr.Jan and Sarah, and CI static assertions for the server-side secret mapping.
- Remaining: run the deployment workflow; configure the two new secret IDs after voice selection; verify actual voice gender/identity and Romanian/English pronunciation; test on Samsung S24, desktop browser and a newly built APK. Existing installed APK remains untouched.
- Avatar work remains blocked on the founder's choice between fictional photorealistic adult portraits and real-person photographs with permission. No portraits were generated or replaced in this change.

## Follow-up fix — server-side voice independent of browser speech support

- Corrected the playback gate: `speakDrVas()` now attempts authenticated Worker TTS before checking whether browser `speechSynthesis` exists. This matters on WebViews/browsers that can play an audio element but do not expose the Web Speech synthesis API.
- The voice toggle no longer rejects a signed-in user solely because browser speech synthesis is absent. Browser TTS remains a fallback only after the dedicated server-side voice request fails.
- Added an E2E test for a signed-in assistant using Worker TTS when `speechSynthesis` is unavailable, plus CI source assertions.
- Workflow #470 is pending at the time of this note; do not claim this follow-up has passed or deployed until its run result is checked.
- Dedicated Jan/Sarah provider IDs and real device audio checks remain required for genuinely distinct voices.

## Validation result — workflow #473

The browser-independent server TTS fix and the Academy/Commerce/Business saved-project continuity hook were included in workflow #473 / run `42130733280`, which completed SUCCESS. The Playwright browser suite, JavaScript validation, Worker deploy, production smoke test and SBOM upload passed. Production Worker version: `f88f84eb-45b6-45b8-84f4-0d109c88864f`.

This still does not mean Jan/Sarah voice IDs are configured or the actual sound has been verified on the Samsung device.


## 2026-11-11 — Sarah cross-language fallback restored

- A later change had inadvertently restricted Sarah to feminine voices matching the selected UI language. This caused Sarah to be skipped on devices that had no local-language feminine voice, even when another feminine voice was installed.
- PR #123 restores the earlier agreed fallback in both chat and presentation: prefer a feminine voice in the selected language; otherwise use the best installed feminine voice from another language. The utterance language is set to the chosen voice's language. A masculine voice is never used as Sarah fallback.
- Browser tests pass 177/177 on exact PR head #836 and post-merge main #837. Production deploy #558 succeeded.
- This does not prove actual audio output or pronunciation on Windows/Android. Manual playback is still required. If the device exposes no voice confidently identified as feminine, Sarah remains unavailable instead of being assigned a masculine voice.
- The public landing presentation uses browser speech synthesis. Authenticated chat can separately attempt the Worker TTS endpoint if the Sarah provider secret is configured; the secret configuration has not been inspected or changed, and no paid voice request was made.
