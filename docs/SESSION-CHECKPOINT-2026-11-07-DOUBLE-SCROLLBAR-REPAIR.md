# Session checkpoint — independent page and transcript scrolling
**Date:** 7 November 2026  
**Repository:** `Vasilecatalinprodan-tech/Dr.-Vas-AI`

## User's exact requirement
Two independent vertical scroll areas must work at the same time:
1. The conversation transcript has its own scrollbar; scrolling messages must not move the page.
2. The entire document/page has its own scrollbar at the far right; scrolling it must reach the bottom controls, attachments and composer without moving the transcript.
Desktop left history/sidebar remains visible. On mobile, history can be an accessible drawer.

## Root cause
Free and Health shared `free-module-mode` / `drvas-free-shell`. Earlier fixed-height and `overflow:hidden` rules on document/body/main/app/chat ancestors conflicted with document scrolling. A legacy `max-height:none!important` selector also overrode the transcript height cap. Older E2E assertions still encoded the previous fixed viewport behaviour.

## Merged implementation — PR #61
- `www/index.html`: natural document flow and vertical scrolling for Free and Health; bounded transcript with independent `overflow-y:auto`; desktop sidebar retained; mobile drawer retained; composer and attachments remain in normal page flow.
- `tests/e2e/homepage.spec.cjs`: desktop and mobile regression tests verify both scroll ranges, independent scroll positions and composer reachability; obsolete fixed-shell assertions corrected.
- Conversation archive: `docs/CHAT-ARCHIVE-2026-11-07-DOUBLE-SCROLLBAR.md`.

## Final verification
- Run #615: 127 passed / 5 failed; discovered legacy assumptions and CSS specificity conflict.
- Run #619: 129 passed / 3 failed; discovered remaining fixed-viewport assumptions and strict body overflow expectation.
- Final run #622 / ID `42373164712`, tested commit `2f5b70371c58966f3e05d6768e3afa42f158e7d7`: **132 passed, 0 failed**.
- PR #61 merged to main. Merge commit: `dbbc241700d5fba413d5d2658f85e638800147e5`.

## Deployment gate
The merge triggers the main deploy workflow. Workflow order: static/browser validation, Supabase migration application and rate-limit diagnostic, Cloudflare Worker deploy, production smoke test and SBOM upload. Current workflow needs GitHub Actions secrets `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_URL`, `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`. A prior deploy run failed at missing Supabase credentials; verify the current run and do not bypass migrations. No production deployment is claimed until the latest run is green end-to-end.

## Acceptance checks after deployment
Founder should test the actual site:
- far-right page scrollbar reaches composer and attachments;
- transcript scrollbar moves messages without moving the page;
- page scrollbar moves the page without moving transcript;
- desktop sidebar visible;
- mobile history drawer opens;
- composer/attachment/Send remain reachable.

## Work sequencing
Do not resume unrelated feature development until the production deployment is verified and the founder confirms the scrolling experience. Then continue the integrated six-module platform and the real 3D DNA/WebGL polish. Preserve all changes and update this checkpoint and the chat archive at each meaningful stage.
