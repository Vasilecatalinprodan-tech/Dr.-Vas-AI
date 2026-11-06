# Dr.Vas AI — presenter faces and portrait update
Date: 2026-11-06
Branch: `feature/presenter-faces-2026-11-06`
Base: `main` at `cc632432942088758f0933914c67f227dc204278`

## User request
> ok acum vreau sa modifici fetele la dr.vas si dr.jan si sarah asa cum am vorbit....salveaza tot inclusiv chat si dupa continuam

## Agreed visual identities recovered from the previous avatar/voice archive
- **Dr.Vas:** use the founder's own supplied portrait and the founder's voice. The existing repository already contains `www/drvas.jpeg` (72,340 bytes), matching the recovered Library source `Drvas.jpeg`.
- **Dr.Jan:** use a distinct, photorealistic, fictional male AI-collaborator portrait. Jan is a virtual AI collaborator, not a human doctor.
- **Sarah:** use the founder-supplied Sarah reference photo, age-progressed to a professional adult appearance of approximately 23–24 while preserving recognisable facial identity. Do not use the original child portrait as the production adult presenter image.
- All three should be visually distinct and appear as presenters in the introduction and assistant selector. Existing CSS motion is only a visual speaking indicator; do not describe it as true phoneme-synchronised lip-sync.

## Recovered source assets
- Founder portrait: Library file `Drvas.jpeg`, path `/Drvas.jpeg`, file id `file_00000000acf88246942a2364d3bd65a6`; it is already present in the repository at `www/drvas.jpeg`.
- Sarah reference: Library file `sarah(1).jpeg`, path `/sarah(1).jpeg`, file id `file_00000000c3c481f4bae7f675a7daa636`. It depicts Sarah as a child and must only be used as an age-progression reference for the requested adult presenter portrait.
- Original founder voice sample remains `/DrVas/Private/Voice/drvasvoice.ogg` (4.57 seconds); no cloning or third-party voice transfer was performed here.

## Work started in this session
- Retrieved and visually inspected both original source photos from the Library.
- Confirmed `www/drvas.jpeg` already exists in the public web asset directory; no duplicate founder photo upload is needed.
- Inspected `www/index.html`: the chat selector has a real Dr.Vas image but illustrated SVG portraits for Dr.Jan and Sarah; the presentation scene still uses an SVG illustration for all three. The Live Voice stage clones the selected assistant avatar from the selector.
- Created branch `feature/presenter-faces-2026-11-06` from the exact current `main` commit above. No source code has been changed on this branch yet.
- Checked connected Runway workspace: Free plan, 500 included credits, 0 purchased credits, no video or speech models. No purchase or top-up was made.
- Started two separate image tasks using the included free-plan allowance only:
  - Dr.Jan fictional male presenter portrait: task `d3842309-f86b-4f5e-991f-0698b3573c08`.
  - Sarah age-progressed adult presenter portrait using the recovered reference photo: task `122ba613-ef40-4b59-99e7-7903cca5b905`.
  - Total included credits used: 8; balance returned by Runway after the second task: 492; purchased credits remain 0.
  - Both tasks returned `task_pending` and their inline viewers were shown. Their final image outputs have not yet been retrieved or reviewed in this checkpoint.
- The Sarah Library file itself could not be passed directly to the image connector. A temporary materialized image reference from the conversation was accepted by the image task, so the age-progression task was successfully submitted without publishing the source photo to GitHub.
- Two exploratory ChatGPT image-generation outputs produced team promotional scenes rather than the required separate portraits. They are not approved assets and must not be integrated into the app.

## Implementation status and safeguards
- No frontend code, APK, production Worker, secrets, database schema, RLS or production settings were changed in this session.
- No deployment or merge was attempted.
- Do not commit placeholders that point to nonexistent images. First retrieve and visually review the two finished Runway portraits; if either task fails or loses Sarah's recognisable identity, stop and document the blocker.
- Keep the founder portrait as `www/drvas.jpeg`; do not republish it elsewhere or create duplicate public copies.
- Intended next implementation: replace the presentation SVG face with a presenter-photo element that switches between Dr.Vas, Dr.Jan and Sarah; replace Jan/Sarah SVG selector art with their approved portraits; let the Live Voice stage continue cloning the matching selected image; add safe photo framing and reduced-motion-aware speaking indicators. Do not claim true lip-sync unless implemented and measured.
- Route narration to each presenter's matching voice only after confirming secure Worker TTS configuration. Never expose provider secrets or claim the founder voice is cloned. The short voice sample may be insufficient.
- Test image loading, fallback behaviour, selector changes, presentation sequence, Live Voice stage, accessibility and reduced-motion behaviour before merge/deploy.

## Next actions
1. Let the two pending image tasks finish; inspect both outputs before accepting them.
2. Retrieve the resulting image assets and add optimised, version-controlled portrait files under `www/assets/presenters/`.
3. Implement the photo-based presentation, assistant selector and Live Voice stage in `www/index.html`.
4. Add/adjust Playwright tests for all three portraits, switching, presentation and fallback handling.
5. Run the complete CI/security/browser pipeline on this feature branch. Merge and deploy only after successful checks and verified asset loading.
6. Update `PROJECT-STATUS.md`, `PROJECT-HANDOFF.md`, `docs/DEVELOPMENT_LOG.md`, and this archive with exact asset names, commits, test runs, merge SHA and deployed Worker version.

This is a structured continuation archive, not a verbatim export of the ChatGPT interface.


## Update — frontend portrait wiring checkpoint
- Frontend commit `90547de6969a63d35d41588ec9747bc834991628`: replaced the Dr.Jan and Sarah assistant-selector SVGs with image elements targeting `www/assets/presenters/jan.webp` and `www/assets/presenters/sarah.webp`; replaced the intro presenter SVG with an image element that switches between `drvas.jpeg`, `assets/presenters/jan.webp` and `assets/presenters/sarah.webp`.
- Follow-up commit `2b12af13cedee58fa54e99a757340e338b230523`: added load/error handling, initials fallbacks, and reduced-motion-aware photo speaking animation for the presentation and assistant selector.
- These commits are on `feature/presenter-faces-2026-11-06` only. The two new portrait files do not yet exist in the repository, so this is intentionally an unmerged work-in-progress branch. Do not merge, deploy or publish the branch until the generated portraits are retrieved, reviewed and added to the referenced paths, and tests pass.
- The photo speaking animation is a subtle visual pulse plus the existing audio/speaking indicators; it is not genuine mouth/phoneme lip-sync.
- No tests, APK build, merge or deployment have been run for these WIP changes.


## Resume checkpoint — generated portraits completed, integration blocked on durable asset retrieval
Date: 2026-11-06
- Resumed both previously submitted Runway tasks and confirmed they completed successfully:
  - Dr.Jan image task `d3842309-f86b-4f5e-991f-0698b3573c08`, asset `2579d925-d043-44e7-bfe4-5b1f167316c4`.
  - Sarah age-progressed image task `122ba613-ef40-4b59-99e7-7903cca5b905`, asset `2c0667f8-7cc5-44b4-93b6-521d7899e3f5`.
- Runway returns signed CloudFront preview URLs for both outputs. They are temporary bearer URLs with expiry on 2026-11-08 (Jan 05:40 UTC; Sarah 09:58 UTC). The URLs/tokens are deliberately NOT copied into the repository or this archive.
- The current connector exposes the asset URL and metadata but not binary download/export. The GitHub connector explicitly rejects binary downloads, and the web/container fetch paths cannot retrieve the signed image bytes. Therefore the actual image files could not be reviewed, downloaded, optimised or committed to `www/assets/presenters/` in this session.
- The two generated images must be treated as pending review, not approved production assets. Do not embed the expiring signed URLs in the app.
- Frontend work remains isolated on `feature/presenter-faces-2026-11-06`; latest branch HEAD observed: `ce58642e65ff806dba6825f537804b62880b94f7`. `main` remained at `cc632432942088758f0933914c67f227dc204278` at the time of verification.
- Existing WIP frontend references `assets/presenters/jan.webp` and `assets/presenters/sarah.webp`, which are not yet present. Thus browser tests, APK build, merge and production deploy were NOT run. No broken build was merged or deployed.
- Dr.Vas continues to use existing `www/drvas.jpeg`; no duplicate copy was created.
- To complete safely, retrieve/export the two generated image binaries through an available Runway asset download/export route (or upload the two outputs as files), visually review them, convert/optimise to WebP, add them at the referenced paths, then run full CI, PR checks, merge and post-merge production smoke test. Do not request payment or top-up.
- This checkpoint and the user's instruction to resume, merge/deploy and archive the chat are recorded here. This is a structured continuity archive, not a verbatim export of the entire ChatGPT UI.
