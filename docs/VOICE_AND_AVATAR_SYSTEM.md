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
