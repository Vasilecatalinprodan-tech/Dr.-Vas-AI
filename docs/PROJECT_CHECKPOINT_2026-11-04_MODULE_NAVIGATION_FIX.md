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
The first corrective attempt did not pass: run 41852818965 reported 26/29 passing, with three failures. The failing evidence showed:
- Generic CTA opened the authentication panel while leaving the module chooser visible behind it.
- Two remaining assertions still expected the obsolete phrase "pilot privat".
- The deployment workflow correctly skipped publishing because the browser suite failed.

A second correction has now been committed:
- `www/index.html` commit `e7f5b59240c3753b0daa360aef5c2c06cbc5a617`: authentication/profile screens now hide the module chooser completely; chooser is explicitly unhidden only when returning to module selection. This applies to generic CTA and visitor-selected module flows while preserving the pending module intent.
- `tests/e2e/homepage.spec.cjs` commit `6c1e0ff1584357626762df053d9898e14998417c`: assertions now verify that the chooser is hidden during login and use the current Romanian administrator-denial message.
- Server-side Worker administrator authorization has not been changed.

The latest source and test commits should trigger a fresh browser regression and deployment workflow. Check the newest runs before claiming success or asking the user to retest production.

## Next verification
1. Check GitHub Actions run 41852818965 (browser regression) and 41852818983 (deployment). Confirm both are green; deployment must include Playwright and production smoke test.
2. On the production URL, perform Ctrl+F5.
3. Test while signed out: CTA -> login -> successful login -> module chooser.
4. Test the founder/admin account: click all six module cards and verify each opens its workspace.
5. If a module remains blocked, read the visible administrator message and verify the exact founder email in Cloudflare ADMIN_EMAILS. Do not weaken the server-side gate.


## Second structural correction — 2026-11-04 15:27 UTC
The next browser run (41857213735) failed 4/29 tests. Root cause was identified from DOM structure and Playwright logs: `#authSection` and `#profileSection` are siblings of `#moduleSelectionSection`, but both are children of `#moduleSelectionShell`. Hiding the entire shell therefore hid the login/profile forms too.

Corrected:
- Commit `79e3306da4c046406348f8495afc8045d593ddd7`: when entering auth/profile, keep `#moduleSelectionShell` visible but hide only `#moduleSelectionSection`; the login/profile cards can render, without exposing module cards.
- Commit `148b9e6e283a912a1745a26f4f6db1a937f31a59`: updated browser assertions to verify the auth/profile card is visible while the module chooser itself is hidden.
- Existing admin allowlist gate remains unchanged.

Latest runs triggered from the above commits:
- Browser regression on commit 79e3306: 41857687727
- Worker deploy on commit 79e3306: 41857688082
- APK build on commit 79e3306: 41857688289
- The subsequent test-only commit 148b9e6 should trigger a new browser regression and deployment workflow. Check latest branch runs before declaring success.
