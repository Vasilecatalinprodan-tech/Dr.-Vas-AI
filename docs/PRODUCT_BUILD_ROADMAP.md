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
