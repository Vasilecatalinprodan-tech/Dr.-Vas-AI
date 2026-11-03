# Dr.Vas Development Log

## 2026-11-03 — Production homepage blank-blue startup incident

- User-visible symptom reported by founder: production site displays only the Dr.Vas wordmark, Romanian flag and language control; the remainder of the page is a plain blue screen and language control does not respond.
- The production Worker deployment at commit `ef43f9ca1a04e01a6937b3dd33e6096ae519bdac` had previously completed successfully, including its Worker health/homepage smoke test. This confirms the Worker response at deployment time, not full browser-side runtime health.
- Source inspection found the frontend initially rendered `#appMain` with `language-pending`, a fail-closed CSS state that hides all main content except the language gate until the bottom-of-page JavaScript calls `initLanguage()`. A runtime failure earlier in the inline script can prevent that call and leave the page hidden. This is a plausible failure mechanism; the precise runtime exception has not yet been observed because the founder cannot provide browser console output or screenshots.
- Hotfix branch: `hotfix/ui-startup-failsafe`.
- Frontend change in `www/index.html`: remove the initial fail-closed class from the HTML shell, and add a global runtime-error fallback that removes `language-pending` and marks the header status as partially available. Normal language initialization still applies its pending state when the language-selection gate is intentionally required.
- Validation performed in the connected development environment: extracted all non-empty inline scripts from the updated HTML and successfully parsed them with the JavaScript engine; verified the initial app shell no longer starts with `language-pending` and the runtime fallback is present.
- Pull request: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/pull/4
- PR #4 was merged into `drvas-integrated-platform` by squash. Production commit: `f6d21a70e3ed4b0bc12a7548e78b5c09bdf83a5f`.
- Deployment workflow run `41690170110` completed with conclusion `success`. All seven operational steps completed, including JavaScript validation, Cloudflare Worker deployment and production Worker smoke test.
- Android build workflow run `41690169974` completed with conclusion `success`. APK artifact `DrVas-APK` was created (6,033,975 bytes; SHA-256 `61ceface6e08a76b133a3d41c21a76459ba3a87fb3b140a4c2600c8d590c2741`) and is available until 2027-02-01.
- These CI results confirm deployment and APK compilation, but do not prove that the founder's browser UI, language selector, or every app feature works correctly. The precise browser-side root cause and successful recovery on the founder's device remain unconfirmed.
- Next: founder should hard-refresh the production page (`Ctrl+Shift+R`) and confirm whether the full interface and language selector now appear. Then test login, chat, and each workspace separately. Do not treat the Worker smoke test as end-to-end UI validation.


## 2026-11-03 — Founder retest: blank/vanishing homepage persists

- After successful deployment of the fail-open hotfix, founder retested with F5 and reports the Dr.Vas image briefly appears during refresh, then disappears; only the header/brand/flag/language control remain. Therefore the user-visible issue is NOT resolved and must not be marked fixed.
- Reviewed deployed www/index.html at production branch. #appMain does not initially carry language-pending; the only remaining code path that adds that class is showLanguageGate(), called by initLanguage() when no supported language is present in localStorage. In that branch, #languageGate should be visible. If a supported language is stored, initLanguage() hides the language gate and leaves the main page visible.
- The current runtime error listener only handles error events with a non-null event.error; it does not handle unhandledrejection. This may miss asynchronous startup failures, but by itself does not explain why the whole page content vanishes.
- Confirmed from deployment logs: Cloudflare uploaded /index.html, Worker deployment succeeded, production homepage HTML contained all six module markers, Worker health returned online, and unauthenticated admin status returned HTTP 401. This is server/static-delivery smoke testing only, not browser execution.
- External browser fetch through available web viewer is unavailable, and founder cannot provide screenshots or console logs. Do not request them again.
- Next diagnostic: inspect all startup-time DOM visibility/class mutations and add a deterministic visible startup diagnostic/failsafe that covers synchronous errors and unhandled promise rejections, while ensuring the language gate itself is always visible when required. Test the actual DOM-state transitions with a browser-capable automated test before another production deployment. Avoid another speculative patch.


## 2026-11-03 — Session restoration must not hide the public dashboard

- Founder confirmed that after refresh only the header remains: Dr.Vas logo, online status and language switch; no language buttons, hero, or module cards are visible.
- Code trace: initLanguage() calls checkSession(); an existing Supabase session leads through showUser() -> loadProfile() -> showChat(). The showChat() function previously called enterChatFocus() automatically. Focus mode applies CSS that hides every direct child of main except #chatSection and hides the header chat CTA. If chat initialization is interrupted or its content fails to render, the public dashboard can appear blank. This is the leading code-path explanation for the reported symptom; it is not yet proven by a browser trace.
- Created branch fix/session-restore-preserves-homepage. Changed showChat() to keep the public dashboard visible on session restoration and not enter focus mode or auto-scroll. Focus mode remains available through the explicit header chat button. This also keeps the six-workspace homepage visible while account/chat data loads.
- Validation: extracted inline browser script parses successfully with JavaScript Function constructor. This is syntax validation only; a real browser end-to-end test remains outstanding.
- Not deployed. Next: review PR, run production validation, deploy only after checks pass, then founder retests without needing to provide screenshots or console output.


## 2026-11-03 — Reliability work: browser regression gate

- Founder directive: preserve the full project/conversation continuity; technical reliability work is to be handled by the development workflow, not delegated to the founder. Priority is to avoid a repeat of a broken homepage when real customers are using Dr.Vas.
- Reviewed the existing production deployment workflow. It checked Worker health, static HTML markers and JavaScript syntax, but did not execute the frontend in a real browser. These checks are not sufficient to prove the homepage renders correctly.
- Added `.github/workflows/browser-e2e.yml`: pull requests targeting `drvas-integrated-platform` and relevant production pushes run Chromium-based browser regression tests. The workflow starts a local copy of `www/`, mocks the Supabase browser SDK boundary, and does not require production credentials or customer data.
- Added `tests/e2e/homepage.spec.cjs` to cover: first-visit language gate, six-module dashboard with a saved language, and the session-restoration path that previously activated chat focus and hid the dashboard.
- The tests are intended to fail if the old automatic focus behavior returns. They are a new safety gate, not yet proof of a successful run. Await the GitHub Actions result before merging or deploying.
- Reliability roadmap: (1) make the homepage/session regression tests pass; (2) add broader browser tests for authentication, chat, module navigation and degraded dependencies; (3) add external uptime/error monitoring and alerting; (4) implement independent database backups and verify restore drills; (5) add deployment health gates and a tested rollback procedure. Do not claim high availability or disaster recovery until the controls are implemented and exercised.
- No production deployment was triggered by these changes.
