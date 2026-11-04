# Dr.Vas AI — checkpoint: login-first entry and module navigation

Date: 2026-11-04
Repository: Vasilecatalinprodan-tech/Dr.-Vas-AI
Branch: drvas-integrated-platform
Production URL: https://dr--vas-ai.vasilecatalinprodan.workers.dev

## Corrected user report
The user clarified that pressing “Vorbește cu Dr.Vas” went straight to the module chooser instead of first showing login, and clicking a module appeared to do nothing. The primary CTA should be placed near the top of the hero, above its descriptive paragraph.

## Confirmed code causes
- Both the header CTA and landing CTA directly called showModuleSelection(), bypassing the authentication gate.
- selectModule() intentionally refuses to open private workspaces unless the Worker confirms the signed-in user through the server-side admin allowlist.
- When that check had not completed yet, or the account was not authorized, the old message was written into the chat workspace, which was hidden. The user therefore received no visible explanation and the module appeared unresponsive.
- The Cloudflare Worker serves ./www as its static assets directory. The legacy root index.html was a separate outdated prototype, creating two competing entry points. The root index.html now redirects to ./www/ so Codespaces/root previews and production use the same integrated app.

## Changes committed to www/index.html
- Added startDrVas() as the single entry point for the header and hero CTAs.
- Visitors without a Supabase session are sent to login first. A sessionStorage intent flag returns them to the module chooser after successful authentication.
- Existing signed-in users wait for the server-side administrator check before seeing the chooser.
- Moved a prominent “Vorbește cu Dr.Vas” CTA into the hero above the description.
- Replaced the obsolete root index.html prototype with a redirect to the canonical ./www/ application.
- Removed the duplicate lower-page CTA.
- Added a visible module-selection status message when server-side admin authorization is missing or denied. No client-side bypass was introduced; private module access still depends on Worker admin_status.

## Regression tests
Updated tests/e2e/homepage.spec.cjs (24 tests total) to cover:
- Hero CTA position and login-first behavior for visitors.
- Returning to the module chooser after successful authentication.
- Existing module workspace tests remain in the suite.

The source and test files were committed on drvas-integrated-platform. Static repository checks confirmed the entry function, pending-entry restoration, hero CTA order, visible authorization feedback, and removal of direct showModuleSelection() CTA handlers.

## Deployment / verification status
The deploy-worker workflow is configured to run on pushes to drvas-integrated-platform when www/** or tests/** changes. The first full workflow on the initial login-first revision exposed 4 stale browser-test expectations (25 passed, 4 failed): one test still assumed the header CTA opened the module chooser before login, and three tests expected the old “pilot privat” wording. These were test expectations inconsistent with the new intended login-first flow and clearer admin-denial message; application code did not fail those assertions. Updated the visitor module test to open the chooser as an authenticated-flow state, updated the landing CTA test to assert login first, and updated the three admin-denial text assertions.
The corrected browser regression run and deployment workflow were started for commit 4219409a9e4edc2f4e75f2360aa43a3450ba096f. At checkpoint update time, both were still in progress. Do not claim production deployment or a passing test suite until the workflow results are checked.

## Next verification
1. Check GitHub Actions run 41852818965 (browser regression) and 41852818983 (deployment). Confirm both are green; deployment must include Playwright and production smoke test.
2. On the production URL, perform Ctrl+F5.
3. Test while signed out: CTA -> login -> successful login -> module chooser.
4. Test the founder/admin account: click all six module cards and verify each opens its workspace.
5. If a module remains blocked, read the visible administrator message and verify the exact founder email in Cloudflare ADMIN_EMAILS. Do not weaken the server-side gate.
