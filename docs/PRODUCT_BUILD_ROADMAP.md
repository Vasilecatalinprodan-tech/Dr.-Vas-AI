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

## Existing implementation found in the repository

- Frontend: `www/index.html`; backend: `worker/index.js`.
- All six module IDs are accepted by the Worker.
- Worker already contains dedicated detailed instructions for Health, Studio, Academy, Commerce and Business; Free uses the general assistant instructions.
- The frontend displays all six modules and has a Studio project workspace and income-opportunity tracker.
- Studio project and income tracker use Supabase tables already inventoried in the security work.
- Premium modules (Studio, Academy, Commerce, Business) are currently gated to administrator accounts. This is a temporary test gate, not a production subscription system.
- No production payment/subscription entitlement system has been verified. Do not unlock public paid access until entitlements are implemented and tested server-side.
- Conversation history is loaded as the newest 30 messages for a normal text request. Long-term conversation continuity therefore still needs a deliberate rolling-context/summarisation design; do not simply send the entire database history on every request.
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
