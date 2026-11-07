# Dr.Vas AI — UX, DNA, voice and presenter motion checkpoint

**Date:** 7 November 2026  
**Branch:** `feat/realistic-dna-module-scroll-sarah-voice-presenter-motion-2026-11-07`  
**Base:** `main` at `b527e8517c8d6c78ba4f2ba2d9cc9c6263f312c4`

## Founder request
The founder asked for the following before continuing broader platform work:
1. Upgrade the DNA double helices on both the left and right of the landing hero. They must feel special, realistic, dimensional and scientific, not cartoon-like.
2. In module pages, show a clear vertical page scrollbar on the right and allow scrolling through the page, not only inside the chat transcript.
3. Sarah must use a feminine voice that pronounces Romanian correctly and remains appropriate in every supported language.
4. When Dr.Vas, Dr.Jan or Sarah speaks, the avatar/presenter must visibly react and move; static portraits alone are not enough.
5. Preserve the work and conversation context. The ChatGPT conversation itself remains in ChatGPT history; this file is a technical checkpoint, not a verbatim chat export.

## Changes made on this branch
- Enhanced both existing full-height DNA helix visuals with stronger 3D perspective, layered shadows, richer gradients, specular highlight strands, more substantial rungs, and a more visible mobile treatment. Existing 13-second helix rotation and reduced-motion support are preserved.
- Added a visible slim scrollbar treatment and explicit right-hand page scrolling for module workspace and Free/Health viewport layouts. The transcript retains its independent scrolling behavior.
- Added a voice preference ranker for local-language feminine voices, including a preference for a Romanian Alina voice when installed.
- Changed Sarah's browser fallback policy: she now uses only a feminine voice whose locale matches the selected language. A foreign-language feminine voice is no longer used to speak Romanian (or another selected language), because that creates poor pronunciation. If no matching feminine voice exists, the app reports the voice as unavailable instead of silently using an unsuitable voice.
- Strengthened presenter portrait movement during speech with more noticeable photo motion and an animated voice halo around the avatar. Existing Dr.Vas/Dr.Jan/Sarah identity-specific presenter selection remains intact.
- Added/updated Playwright assertions for helix highlight strands, Sarah's local-language voice selection, module scrollbars and speaking halo.

## Important verification limits
- Browser/device speech quality depends on voices installed on the user's operating system. A browser-only TTS voice cannot be guaranteed to sound studio-professional. The authenticated Worker route uses ElevenLabs multilingual TTS and server-side secrets, but the dedicated Sarah voice ID and provider configuration must be present and tested; do not invent IDs or secrets, and do not activate paid usage without explicit budget approval.
- The presenter halo and photo motion are visual speaking reactions, not phoneme-accurate facial animation or full 3D lip-sync. A true talking-head animation needs a properly rigged model or a licensed generated-video provider and approved cost.
- The DNA visuals remain inline SVG/CSS scientific-style renders. They have improved depth and specular effects but are not a photorealistic rendered 3D asset. Inspect the actual landing page on desktop and mobile before calling the final visual approved.
- No real-device audio test has been performed in this change. No production deployment has been confirmed by this checkpoint.

## Validation to perform
1. Run full browser E2E workflow and repair any regressions.
2. Inspect the landing hero on desktop/mobile, checking both helix rails extend through the full hero and do not obscure the copy.
3. Open all six modules and verify the page-level right scrollbar works without breaking the independent chat transcript scroll.
4. Test Sarah in Romanian, English, Italian, Turkish, German, French, Spanish and Russian on actual devices with native-language feminine voices installed. Verify the dedicated Worker voice only if the owner's server-side secret is configured.
5. Test speaking animation for all three presenters in the landing presentation and Live voice stage.
6. Merge only after green checks; then verify Worker deploy and production smoke tests. Do not claim completion before those checks pass.
