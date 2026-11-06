# Dr.Vas AI — saved founder requests and implementation checkpoint
**Date:** 6 November 2026  
**Repository:** `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
**Main commit containing the merged changes:** `01579775fac5a7075f332159cc9c26155dd6b415`

## Founder requests (verbatim)

> fii atent e greu de gasit deconectarea asa ca te rog ca pe fiecare pagina sa fie deconectare si sus si jos de tot nu la mijloc pentru ca este foarte greu de gasit....salveaza tot inclusiv chatul

> adn-ul vreau sa fie unu cat mai realistic si sa fie in stanga si in dreapta sa se invarta exact ca aum dar sa fie de sus pana jos pe prima pagina....salveaza tot inclusiv conversatia si te rog vocea lui sarah sa fie de femeie......si toate modulele trebuie sa aibe butoanele de deconectare....lumea se va incurca deci toate modulele sa aibe deconectare

## Implemented and merged

### 1. Universal logout
- Global **Deconectare** button in the top header and a second button at the true bottom/footer.
- Both appear for authenticated sessions and remain hidden when signed out.
- The controls are global and therefore available across Dr.Vas Free, Health, Studio, Academy, Commerce and Business.
- In full-screen chat mode, the bottom control stays fixed at the bottom edge, with mobile safe-area spacing.
- Removed the redundant logout control buried inside chat navigation.
- Added Playwright checks for desktop, mobile, all modules, signed-in and signed-out states.
- PR #30 merged to main as `e9930242e1a89de4b0e7ce01dfc078370999a70b`.

### 2. Landing-page DNA
- Two double-helix visuals, one on the left and one on the right, extend across the full height of the landing hero.
- The existing rotating animation and flowing strand/rung motion are preserved; gradients and glow improve depth.
- The hero content is centered between the DNA rails. Mobile widths and reduced-motion preferences are respected.
- Playwright checks verify both rails, their height and the rotation animation.
- PR #32 merged to main as `01579775fac5a7075f332159cc9c26155dd6b415`.

### 3. Sarah's feminine voice
- Sarah's internal assistant key remains `aurora`.
- Chat playback prefers a female device voice for Sarah; a manually selected voice is accepted only when classified as feminine.
- The landing presentation uses a female device voice for Sarah. If no female voice is available, it does not silently play Sarah with a masculine/default voice; it displays an explanatory message instead.
- The existing authenticated Worker TTS mapping remains `aurora` → `ELEVENLABS_SARAH_VOICE_ID`. No secret values were read or added to source control, no voice ID was invented and no paid provider was activated.
- A dedicated provider voice still requires owner-side secret configuration and real audio verification on the Samsung device. The Live preset for Sarah remains Aoede.

## Verification
- Clean main-based PR #32 browser workflow #42250136504: **75 passed**, success.
- Main browser workflow #42250522098: **75 passed**, success.
- Main deployment workflow #42250521998: deployment/smoke-test status to be updated after completion.
- Do not claim the new front page or logout controls are live until the main deployment workflow and production smoke test succeed.

## Conversation preservation
The full ChatGPT conversation remains in the user's ChatGPT history. This file saves the two founder requests verbatim and the engineering decisions/progress needed to continue the project; it is not a full verbatim export of every assistant message or all prior chats.
