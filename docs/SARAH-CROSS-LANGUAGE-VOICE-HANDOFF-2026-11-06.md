# Dr.Vas AI — Sarah cross-language feminine voice fallback
**Date:** 6 November 2026  
**Repository:** `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
**Branch:** `fix/sarah-cross-language-female-fallback-2026-11-06`  
**Base:** `main` at `61469f92dd9eb72edb66529620a2775f42a38a65`

## Founder-reported defect
The founder reports that Sarah is silent in the three-presenter landing presentation and does not sound feminine. PR #32 had already added a female-only voice selection policy, but it searched only voices matching the selected language whenever any local-language voice existed. On a Windows device with a Romanian male voice and an English female voice, Sarah was skipped even though a female voice was installed.

## Fix prepared
- In the landing presentation, prefer a feminine voice matching the selected language; if none exists, select an installed feminine voice in another language.
- When this cross-language fallback is used, set the utterance locale to the selected voice's own language.
- Apply the same preference/fallback order to ordinary Sarah chat playback.
- If the device has no voice confidently identified as feminine, continue to refuse masculine fallback and show the existing explicit unavailability message.
- No Worker secret values, provider voice IDs, paid TTS calls, external voice cloning or paid services were used.

## Regression coverage
Expanded the Sarah voice-selection Playwright test to cover:
1. A feminine Romanian voice is preferred over a masculine Romanian voice.
2. If only a masculine Romanian voice and a feminine English voice exist, both chat and presentation select the feminine English voice.
3. If no feminine voice exists at all, Sarah is not assigned a masculine voice.

## Commits
- `ebd6a2989abc3ff56fe8315a6840dec068a82ed4` — cross-language feminine fallback in presentation and chat.
- `cc5b3cd5b17d0e5050205a91d2ddca1b0d05d089` — regression coverage.

## Verification boundary
Source and test files were re-read from the feature branch and both edits are present. GitHub Actions browser regression, production deployment and actual playback on the founder's Windows device remain pending. Browser tests can verify selection and queueing, not the physical speaker output, perceived voice gender, pronunciation or audio device volume. Do not claim the defect is fully resolved until the user confirms real playback. The dedicated authenticated ElevenLabs route remains dependent on owner-managed Worker secrets and is not used by the public landing presentation.
