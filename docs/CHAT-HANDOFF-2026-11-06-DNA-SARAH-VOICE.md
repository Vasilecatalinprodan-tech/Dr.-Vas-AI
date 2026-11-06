# Dr.Vas AI — landing DNA and Sarah voice handoff
**Date:** 6 November 2026  
**Repository:** `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
**Feature branch:** `feature/landing-dna-sarah-voice-main-2026-11-06`  
**Base checkpoint:** main after global logout PR #30 merge, commit `e9930242e1a89de4b0e7ce01dfc078370999a70b`
**Latest implementation commits:** `074fe46e18eee6e0f35ef10c0b37012f68629ab4` (full-height rail placement and Romanian female voice recognition), `9a4f2611490ca41c68587a49c962382abd6b018d` (presentation test confirms Sarah uses Microsoft Alina).

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


## CI findings and corrections
- Draft PR #31: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/31
- First full E2E run #42249285356: 73 passed, 2 failed. The failures exposed:
  1. Sarah's presentation test fixture offered a female Romanian voice named "Microsoft Alina", but the first female-name heuristic did not recognize that name. The heuristic now recognizes Alina and several common Romanian female voice names; the test now expects Sarah to use Microsoft Alina.
  2. The DNA rails had initially been nested inside the hero text container, so their absolute height matched the text block instead of the whole hero. They have been moved to direct children of the hero section so top/bottom positioning spans the complete landing hero.
- Rerun the full browser workflow on the latest PR #31 head. Do not merge until green.


## Verified source branch and clean main-based continuation
- PR #30 global logout controls was merged successfully to main as `e9930242e1a89de4b0e7ce01dfc078370999a70b`.
- The full browser suite passed on the combined source branch at commit `caaed2a5636d838c2ed63c68f1531fa784813873`: **75 passed** (workflow #42249729655, success).
- A clean feature branch `feature/landing-dna-sarah-voice-main-2026-11-06` was created from the merged main commit and the final `www/index.html` and `tests/e2e/homepage.spec.cjs` changes were copied forward, so the new PR contains only DNA/Sarah improvements on top of main.
- Run the browser suite again on the clean branch PR before merge. Then verify the production Worker deployment and real device voice behaviour. The full-height DNA change is in the landing hero; the Sarah browser fallback now selects only female voices and explicitly skips narration if no female voice is available.
