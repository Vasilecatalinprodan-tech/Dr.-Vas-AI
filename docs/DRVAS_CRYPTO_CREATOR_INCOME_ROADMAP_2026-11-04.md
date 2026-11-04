# Dr.Vas — Crypto, Creator and Independent Income Roadmap
Date: 2026-11-04
Branch: drvas-integrated-platform

This roadmap restores and consolidates founder requirements discussed on 2026-11-03. It is part of the single integrated Dr.Vas platform, not a separate product.

## 1. Dr.Vas Crypto — founder-only, disabled by default
Crypto belongs in a private founder/admin area, not in the six public-facing module cards. It must remain hidden from ordinary users and inaccessible unless the authenticated founder account and an explicitly authorised device are verified.

Planned capabilities:
- Bitcoin mining feasibility and profitability calculator using current network difficulty/hashrate, pool fees, electricity price, device hashrate, power draw and hardware cost.
- Device registration/authorisation and a clear per-device status.
- Hard consumption limits (power, temperature/runtime where measurable), spending/energy budget, visible stop control and emergency shutdown.
- Mining execution remains OFF until the founder explicitly enables an authorised device after reviewing the estimate and limits. No covert/background mining and no mining on visitors' devices.
- Connected exchange/account monitoring only after the user explicitly connects an account; read-only by default.
- Market analysis, portfolio tracking and investment simulations; no live trading or automatic transfers in the initial release.
- Any later trading must require a separately authorised fixed budget, strict loss cap and emergency stop. No guaranteed-profit claims.
- Revenue tracking may later feed the Independent Income Tracker. Any stock-investment allocation remains a later, separately approved workflow.

Safety and legal gates:
- First build a non-executing calculator and monitoring/simulation interface.
- Show estimated electricity cost and net outcome transparently; never present mining as guaranteed income.
- Check local law, tax treatment, provider terms, device ownership/permission and electricity contract before enabling execution.
- No mining or trading is active merely because the feature exists in the interface.

## 2. Dr.Vas Studio — books and creator production
Studio must support the full original-content workflow:
- Book/novel/e-book concept, outline, chapter plan, manuscript drafting, editing, proofreading, synopsis, blurb and publishing package.
- Persistent book projects with title, genre, audience, language, style guide, character/setting bible, chapter status, revision history and export.
- Continue a manuscript across sessions using saved project context; do not rely on the transient chat alone.
- Translation/localisation, original lyrics/poetry/music briefs, scripts, articles, marketing copy and social-media calendars.
- Keep user-provided ideas and scripts faithful; clearly distinguish original material from sources requiring rights checks.
- No publishing, paid distribution, contracts or spending without founder approval.

The existing Studio deliverable selector already includes Book / novel / e-book, and the capabilities section already describes book/e-book support. This roadmap defines the deeper persistent manuscript workflow still to build and test.

## 3. Independent Income Tracker
One private founder workspace to track opportunities from books, translation, music, video, digital products and other lawful online work:
- source/link, requirements, deadlines, platform fees/commission, estimated and received amount, currency, status, rights/AI-use rules, next action and notes;
- aggregate expected versus received income;
- no applications, submissions, contracts, publishing or payments without explicit user approval.

## 4. AI Evaluator & Training
A separate capability inside the private Studio/Business toolset:
- evaluation workbench, benchmark runs, labelled examples, annotation/review queue, red-team scenarios and quality reports;
- human review and audit trail; no deceptive claims that AI-generated academic work is human-authored;
- potential future business service for organisations, subject to data permissions and contracts.

## 5. Platform architecture and access
- Keep the six integrated modules: Free, Health, Studio, Academy, Commerce and Business.
- Crypto remains a founder-only control area, not a seventh public module.
- Keep the existing Worker-side administrator authorisation. Never expose service-role keys, exchange secrets or provider credentials to the browser.
- Every new capability needs server-side authorisation, input validation, rate limits, audit events, per-user data isolation and automated tests.
- The six modules and new founder tools remain private during the pilot until licensing, privacy, security and compliance reviews are complete.

## 6. Implementation order
1. Stabilise login/session and navigation; pass all browser regression tests.
2. Verify production Worker health and a real Studio render, not only mocked E2E behaviour.
3. Build Book Projects persistence and export in Studio.
4. Build Crypto read-only dashboard and profitability calculator; keep execution disabled.
5. Build device authorisation, limits and emergency stop design; do not activate mining until independently reviewed and explicitly approved.
6. Expand the Independent Income Tracker and AI Evaluator & Training with persistence and audit trails.
7. Only then consider connected-account integrations, trading, publication or paid public access.


## Existing implementation verified on 2026-11-04
- The founder-only admin UI already contains a read-only Crypto device registry, and Worker action `crypto_devices_list` performs server-side Supabase user and administrator allowlist checks.
- Migration `202611030003_crypto_device_registry.sql` exists. It stores device public keys/fingerprints and approval state only; it does not execute mining.
- `docs/CRYPTO_ADMIN_CONTROL_MODEL.md` is the security design baseline. It explicitly keeps mining, custody and live trading disabled.
- Added an admin-only Bitcoin economics calculator to the Crypto panel: user-entered BTC/day estimate, GBP/BTC price, watts, electricity tariff, pool fee and hardware cost. It computes gross, electricity cost, pool fee, net/day, net/30 days and simple equipment payback. It is not live market data and cannot start mining.
- Automated browser coverage was added for the calculator arithmetic; wait for the latest combined E2E run before calling it verified.
- The existing Independent Income Tracker and its per-user table are already in the project. Book/e-book appears as a Studio deliverable, but a dedicated persistent manuscript structure (chapters, character/style bible, revision history and export workflow) remains future work.
