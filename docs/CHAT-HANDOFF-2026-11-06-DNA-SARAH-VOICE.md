# Dr.Vas AI — landing DNA and Sarah voice handoff
**Date:** 6 November 2026  
**Repository:** `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
**Feature branch:** `feature/landing-dna-sarah-voice-2026-11-06`  
**Base checkpoint:** logout branch head `7b3341e8a596dca3ca1e2ee04504863e549c6fa9`
**Latest feature branch implementation commit:** `0f4bfc7f5db386804a2063b7fc7921da79b4494a`

## Founder requirements
- Landing page: make the DNA motif more realistic, with one rotating double helix on the left and one on the right, extending from the top to the bottom of the first/home page. Preserve the existing 13-second rotation and flowing strand/rung animation.
- Sarah must sound feminine in both chat playback and the landing presentation. Do not silently select a masculine/default voice for Sarah.
- All six public/customer modules (Free, Health, Studio, Academy, Commerce and Business) must keep the global logout controls at the top and true bottom. Do not reintroduce a middle-only logout control.

## Changes implemented on this branch
- Replaced the single right-side hero DNA helix with two full-height left/right double-helix visuals. The strands now use gradients and stronger depth/glow while retaining the current spin and flow animation; mobile widths and reduced-motion preferences are respected.
- Added `isFemaleSpeechVoice()` and changed chat voice selection for internal assistant key `aurora` (Sarah) to prefer a female voice from the current language. A manually selected voice is accepted for Sarah only if it is classified as feminine. If no suitable female device voice exists, the browser fallback returns no voice rather than choosing a masculine voice.
- Updated the landing presentation voice profile so Dr.Vas and Dr.Jan may share the best available device voice, but Sarah gets a female voice only. If the device offers no female voice, Sarah's narration is skipped with an explicit on-screen message rather than being played using a masculine default.
- The existing authenticated Worker route still maps `aurora` to server-side secret `ELEVENLABS_SARAH_VOICE_ID`. No secret value was read or added, no provider voice was invented, and no paid service was activated. A configured dedicated voice must still be verified on real devices.
- Added Playwright coverage for Sarah's female voice selection and no-male-fallback behavior, plus the two full-height animated DNA helixes.

## Validation / integration
- Commit containing the implementation: `f0d9e76c85d876896db20f6394ffa9f146ea52d4`.
- Follow-up polish: `0f4bfc7f5db386804a2063b7fc7921da79b4494a` gives each helix unique SVG gradient IDs and keeps the Sarah voice-unavailable notice visible at the end of the presentation.
- E2E test update: `90f1e6cd822beb6692f14d8d618d70f3c847de72`.
- Run browser E2E, inspect the desktop/mobile visual result, and verify the voice profile on a device that exposes a female Romanian voice. Do not claim a dedicated Sarah voice is live until the Worker secret is configured by the owner and real audio is checked.
- This branch is based on the still-open global logout PR #30; merge that PR first after its own green CI, then retarget/rebase this feature branch to main and open a separate PR.

## Conversation preservation
The actual ChatGPT conversation remains in the user's chat history. This file records the technical decisions and continuation state; it is not a verbatim export of private chat history.
