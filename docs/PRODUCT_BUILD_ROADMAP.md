> Carried forward from the historical PR #3 design branch on 5 November 2026. This is a product/engineering specification, not proof that the described feature is live. Any dated 'verified current state' section is a snapshot from the original audit and must be reconciled against the current main branch and live provider configuration before operational use.

# Dr.Vas AI — Product build plan and configuration baseline

Updated: 3 November 2026
Working branch: `drvas-modules-long-input`
Base branch: `drvas-integrated-platform`

## Product decision

Dr.Vas is one integrated platform, not six separate applications. The six workspaces share one account, identity, conversation history, language settings, assistant selection and privacy controls. Each module has its own system instructions, workspace tools, access policy and future billing configuration.

The founder wants a professional product with no arbitrary 1,000-word/message restriction in the user experience. Technical provider, context-window, abuse-prevention and cost limits still exist and must be handled transparently. Do not market AI use as literally infinite or cost-free.

## Current modules and intended configuration

1. **Dr.Vas Free** — general-purpose assistant for everyday questions, learning, explanations, writing support and problem-solving. Intended to remain free. Conversation history and long-form input supported.
2. **Dr.Vas Health** — general health education, explaining terminology and tests, helping prepare appointments and navigate care. Not a doctor, does not diagnose or prescribe, and must escalate emergencies. Keep separate from professional clinical decision support; any clinician/hospital integration requires legal, clinical, privacy and regulatory review.
3. **Dr.Vas Studio** — creative production for books/e-books, translation/localisation, original music and lyrics, screenplays/series, video/social content, articles and digital products. Long projects need saved project files, continuity notes, glossary/style sheets, versioning and export. Never claim media has been rendered unless a media tool actually did it.
4. **Dr.Vas Academy** — structured practical learning, courses, lessons, exercises, quizzes and progress. No false claims of accreditation or guaranteed earnings.
5. **Dr.Vas Commerce** — ethical e-commerce and dropshipping, product/niche research, supplier due diligence, store content, unit economics, fulfilment, customer support and compliance by jurisdiction. No fake reviews or misleading sales practices.
6. **Dr.Vas Business** — business plans, operations, management, budgets, cash flow, break-even, KPI and bookkeeping organisation. Clearly distinguish estimates from verified figures and regulated professional advice.

## AI Evaluation & Training Workbench — revenue capability

Add this as a capability inside **Dr.Vas Studio** and **Dr.Vas Business**, not as a seventh public workspace. It should help customers evaluate AI systems and prepare quality-controlled feedback/training assets.

Planned capabilities:
- Rubric-based evaluation of AI answers: factual correctness, relevance, completeness, clarity, instruction adherence and evidence quality.
- Human-in-the-loop review, reviewer calibration, double-review sampling, disagreement resolution and quality audits.
- Versioned prompt/model test sets, repeatable benchmark runs and regression comparisons.
- Dataset annotation and preparation (classification, ranking, tagging and structured feedback) with provenance and licence tracking.
- Training-data preparation only where customer permissions, provider terms and applicable law allow it; evaluation submissions are not automatically training permissions.
- Exportable scorecards, audit trails and business reports.

Potential monetisation to validate through pilots: per-task/per-item review, paid evaluation projects, monthly business plans, custom benchmark packages and managed QA contracts. Do not publish prices or promise earnings until real operating costs, reviewer rates, provider costs and customer demand are measured.

Quality and privacy requirements: synthetic or public-domain/licensed test data for the first prototype; minimise/redact personal data; document provenance and permissions; role-based access; retention/deletion controls; versioned rubrics; bias checks; appeals/corrections; qualified human review for high-impact domains. No claim of certification or guaranteed model improvement without independent evidence.

Current status: product direction only; no service, dataset pipeline, billing or public offer has been launched.

## Dr.Vas Crypto — private administrator subsystem

Crypto is a separate, hidden administrator-only subsystem, not a public seventh workspace. Ordinary users must not see its navigation, status, controls or API capabilities. The Worker must re-check administrator identity for every Crypto action.

The founder's intended direction is controlled mining on explicitly approved administrator-owned/authorized devices, monitoring crypto accounts, and a possible later allocation of a defined portion of realised Crypto proceeds to stock-market investing after analysis. This is not yet enabled.

Current implementation:
- A server-only device registry migration exists: `supabase/migrations/202611030003_crypto_device_registry.sql`.
- The registry stores device identity metadata and public verification keys only; client-role access is revoked.
- The administrator panel lists registered devices.
- The Worker now supports administrator-only approval and revocation actions; the panel exposes explicit controls.
- Approval/revocation is an access-control record only. It does not install software, start mining, access a wallet, transfer funds or place trades.
- Every approval/revocation attempt is written to the operational audit log.

Security and release gates:
- Do not collect private keys, seed phrases, exchange passwords or wallet recovery phrases in Dr.Vas.
- Device registration must use a cryptographic challenge and proof of possession; a public-key fingerprint alone is not proof that a device is safe.
- Before any mining agent exists: explicit device-owner consent, resource/power/temperature limits, transparent electricity-cost estimates, stop/revoke controls, signed updates, malware review and independent security testing.
- Before exchange/account integration: begin read-only; use scoped API keys without withdrawal permissions; never custody user funds.
- Before any stock-market activity: start with historical analysis and paper trading. Any later live trading needs explicit administrator approval, a segregated fixed budget, position/risk limits, daily loss cap, audit trail and a global emergency stop. No autonomous transfer of funds or withdrawals.
- Assess UK and relevant jurisdiction rules, tax treatment, financial-services permissions, exchange terms, data protection and app-store policies before enabling mining, account integration or trading.
- Mining and trading remain disabled until these gates are completed and separately approved.

## Crypto development sequence

1. Device approval/revocation controls (implemented on this branch; pending tests).
2. Secure device enrolment with signed challenge and proof of possession.
3. Admin-only inventory and health/telemetry with opt-in and strict resource limits.
4. Mining profitability calculator using user-supplied or verified electricity tariffs, hardware performance and current network data; no mining execution yet.
5. Read-only crypto account/exchange connections with least-privilege credentials and no withdrawal scopes.
6. Market analysis and paper-trading simulator, with no live orders.
7. Risk-controlled, explicitly approved live operations only after legal, security and financial review.

## Existing implementation found in the repository

- Frontend: `www/index.html`; backend: `worker/index.js`.
- All six module IDs are accepted by the Worker.
- Worker already contains dedicated detailed instructions for Health, Studio, Academy, Commerce and Business; Free uses the general assistant instructions.
- The frontend displays all six modules and has a Studio project workspace and income-opportunity tracker.
- Studio project and income tracker use Supabase tables already inventoried in the security work.
- Premium modules (Studio, Academy, Commerce, Business) are currently gated to administrator accounts. This is a temporary test gate, not a production subscription system.
- No production payment/subscription entitlement system has been verified. Do not unlock public paid access until entitlements are implemented and tested server-side.
- Conversation history is saved in Supabase. The Worker now fetches up to the newest 100 messages and applies a 48,000-character context budget, retaining the newest context while keeping the full record in Supabase. This is an incremental improvement, not yet a true rolling summary: very old messages beyond the bounded window are not included in model context. Next: add persisted rolling summaries with a reviewed schema migration, token-aware budgeting and tests.
- The Worker currently uses Gemini Interactions API with a fallback model list. Model availability, account quotas, token pricing and rate limits must be checked before choosing production tiers.
- Current product architecture does not yet prove unlimited use. Avoid promises of infinite usage.

## Changes made on this branch

- Frontend chat textarea maximum increased from 12,000 to 100,000 characters.
- Worker message validation maximum increased from 12,000 to 100,000 characters.
- Gemini request timeout increased from 20 seconds to 60 seconds.
- These changes are committed on `drvas-modules-long-input`, not deployed to production.

## Product configuration principles

- One account and one conversation system across modules.
- Persist selected language, assistant, module and conversation per account/device where appropriate.
- Each module must have: purpose, visible feature list, dedicated instructions, access tier, usage policy, privacy/safety rules, saved-work support, and clear availability status.
- Free must not be artificially crippled by a short word cap. Protect service quality with transparent fair-use/rate controls and capacity-aware model routing, not arbitrary message truncation.
- Long conversations should use a rolling context window plus compact conversation summaries saved per conversation. Keep original messages in history; summaries are derived context, not a replacement for the record.
- User must be able to continue, rename, archive, export and delete conversations and module projects.
- Admin configuration should control model routing, module availability, feature flags, usage limits, pricing/plan entitlements and maintenance mode without exposing secrets to the browser.
- Secrets, provider API keys and subscription entitlement checks stay server-side.

## Next implementation sequence

1. Complete module dashboard: replace vague “in preparation” states with truthful status labels and clear feature previews; retain the unified visual identity.
2. Build a server-side module configuration registry (module ID, model policy, instructions, access tier, enabled features and safety policy) so frontend and Worker do not drift.
3. Implement robust long-context handling: recent-turn window, rolling summary, token-budget estimation, retry for transient provider failures, and graceful handling of oversized inputs.
4. Replace administrator-only premium gate with verified server-side subscription entitlements after a billing provider and plans are selected.
5. Finish Studio workflows: save/load/version/export long manuscripts and other creative projects; add structured outputs and production hand-off.
6. Build Academy course/progress tools, Commerce product research/store workflow and Business planning/financial templates as separate workspaces.
7. Add automated tests for every module, access-control tests, long-message tests, conversation-resume tests and provider failure/rate-limit handling.
8. Validate Android, then package iOS on macOS/Xcode; complete privacy, account deletion and app-store compliance before submission.

## Release discipline

- Do not deploy untested code directly to production.
- Keep feature branches and pull requests; merge only after review and tests.
- Do not claim a feature is live until the production deployment and a real end-to-end test succeed.
- Never promise infinite AI usage. A future plan can offer generous usage, transparent fair-use rules and capacity-based availability, subject to provider costs and limits.


## Advertising and sponsorships (design approved; disabled by default)

See `docs/ADVERTISING_SPEC.md`. Prepare privacy-first direct sponsorship placements and contextual workspace placements, visibly labelled and kept separate from assistant answers. Require global and per-workspace admin switches, creative review, frequency caps, immediate suspension and aggregate-only measurement. Never sell or disclose chats, Health data, uploads or private profiles; do not use sensitive data for targeting. Tracking remains off until valid PECR/UK GDPR consent. No provider or SDK is selected, and no advertising is live.


## 2026-11-06 — integrated module development continuation: public/private boundary regression

### User instruction (verbatim)
> Continuăm de la ultimul commit confirmat. si continuam cu dezvoltarea la toate modulele inclusiv cele ascunse si salvam tot

### Confirmed product structure from the current source and roadmap
- The public customer dashboard currently exposes exactly six customer-facing workspaces: Dr.Vas Free, Health, Studio, Academy, Commerce and Business.
- Studio, Academy, Commerce and Business remain server-gated to the authorized founder during the pilot. Do not unlock them for public customers until verified subscription entitlements and payment-webhook controls exist.
- The hidden administrator centre contains Crypto device registry/calculator, Founder Provenance controls, Creator & Online Income Lab, Book Workshop, Music Lab, Online Income planner, AI Evaluation & Training Lab, Digital Product Studio, Publishing Lab, Music Release Lab, Commerce Profit Lab, Mining Sensitivity Lab, Business Operations Planner, Customer Journey & Retention Planner, Content & Campaign Planner, operational audit and saved-conversation administration.
- AI Evaluation & Training is a capability inside Studio/Business, not a seventh public workspace.
- Psychology/wellbeing referral and child-safeguarding/reporting are roadmap specifications only in the current source; they are not implemented live modules and must not be represented as available clinical or safeguarding services.
- Crypto remains hidden and administrator-only. Current registry and calculator are non-executing; no mining, wallet custody, transfers, exchange withdrawals or trading are enabled.
- Do not infer that all hidden workbenches have independent persistence, entitlement or production integrations merely because their UI controls exist. Verify each workflow and its storage/provider dependencies separately.

### Source change in this continuation
- Added a Playwright regression test to `tests/e2e/homepage.spec.cjs`:
  - Public dashboard exposes exactly the six approved module IDs: `free`, `health`, `studio`, `academy`, `commerce`, `business`.
  - Crypto is not a public module card.
  - The administrator panel is hidden on the ordinary unauthenticated/public first view.
  - Crypto, Creator & Online Income, AI Evaluation & Training, Digital Product Studio and Founder Provenance remain nested inside the administrator panel.
  - At least ten internal founder workbenches must remain present inside that panel.
- Test commit: `156dcc711a3691873bb72b7c5abf12e43cf84bc1`.
- The test is committed but has not yet been observed passing in CI. The commit workflow/status endpoints returned no run/status records at the time of this checkpoint; do not claim the test passes until a completed run is visible.
- PR #9 remains open and GitHub reports `mergeable=false`. The integration branch is divergent from `main` (latest compare at this checkpoint: 63 commits ahead, 1 behind; merge base `69c57c5eb1c8a3b1d4612ec572831a3ec072ee67`). Do not merge or rewrite history based on these counts.
- No runtime application behaviour, production secrets, live database, APK or Cloudflare deployment was changed in this step. No paid service or provider usage was initiated.

### Development sequence for the full product
1. Preserve the six public module workspaces and harden their owner-scoped persistence and server-side access checks.
2. Complete Studio's project lifecycle and test script/storyboard/media/render status/export; never start a billable render without explicit budget approval.
3. Complete Academy course, lesson, quiz, progress and Student Desk flows without fabricated accreditation or assessment claims.
4. Complete Commerce research, supplier due diligence, unit economics and store-planning flows without fake reviews or unverified supplier/order integrations.
5. Complete Business planning, cashbook, break-even and Student Desk flows; statutory accounting, VAT/tax filing and professional advice require jurisdiction-specific review.
6. Expand hidden Creator/Online Income, Book, Music, Digital Product, Publishing and campaign workbenches with private project persistence, versioning and export; do not promise earnings or claim publication/distribution integrations that are not connected.
7. Expand AI Evaluation & Training with synthetic/licensed data, rubric versioning, reviewer audit and explicit separation between evaluation consent and training-data permission.
8. Keep Crypto read-only/non-executing until device proof-of-possession, owner consent, legal/security/energy review and explicit separate approval.
9. Do not launch Psychology or child-safeguarding workflows until clinical/safeguarding professionals, crisis protocols, DPIA, legal review, human escalation ownership and access/retention controls are in place.
10. Maintain Dr.Vas/Dr.Jan/Aurora voice identity boundaries, voice race protections and Android playback validation; do not activate paid voice credits or clone providers without approval.
11. Verify all Supabase migrations, RLS/storage policies, cross-user isolation and account deletion with authorized test accounts; source-level tests do not prove live database state.
12. Maintain zero-unapproved-cost policy and archive all material user instructions, decisions, code commits, test outcomes and unresolved items in the handoff/status/chat archive/development log.

### Next technical checkpoint
- Wait for or obtain a verifiable CI result for commit `156dcc711a3691873bb72b7c5abf12e43cf84bc1`.
- If the Playwright test fails, correct only the test assumptions or genuine source defect and rerun.
- Continue a source-to-Worker access audit for all hidden/admin actions and the six module prompts.
- Retrieve the exact npm audit report before any dependency update.
- Resolve PR #9 in a safe candidate integration without dropping main's deployment checks or the current TTS `forcePlayback`/stale-audio guards.
- Do not deploy or run billable provider operations until all relevant gates and approvals are met.
