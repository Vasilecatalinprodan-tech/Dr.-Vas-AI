# Dr.Vas development log

## 3 November 2026 — long context and Crypto administration

### Founder and project ownership
- Vasile-Catalin Prodan is the human founder and intended legal owner/operator, subject to the eventual legal entity/registration details he supplies.
- The AI assistant is a development collaborator, not a legal person, shareholder or legal co-founder.
- Do not invent company identity, address, contact details, retention periods or legal bases. Ask the founder when those details are needed.

### Product architecture
- One integrated Dr.Vas platform with six public workspaces: Free, Health, Studio, Academy, Commerce and Business.
- Dr.Vas Crypto is a separate hidden administrator-only subsystem. It must not appear in ordinary-user navigation or be accessible to non-admin accounts.
- Crypto intent: explicitly authorized administrator devices; evaluate controlled mining for income; later read-only crypto account monitoring; possible analysis-led allocation of a defined portion of realised Crypto proceeds to stock-market investment.
- No mining execution, wallet custody, crypto transfers, exchange execution or live stock trading is enabled.

### Changes committed on drvas-modules-long-input
- Worker conversation context increased to fetch up to 100 recent messages, with a 48,000-character context budget. Full chat records remain in Supabase; this is not yet persisted rolling-summary memory.
- Worker gained admin-only Crypto device approval/re-approval and revocation action. Every action verifies the Supabase session and server-side administrator allowlist.
- Crypto approval/revocation state changes are sent to the audit log.
- Admin UI now shows device control actions and confirmation before authorization/revocation.
- Added visual styling for Crypto controls.
- Added docs/CRYPTO_MODULE_SPEC.md with phased security, operational, financial and compliance gates.
- Updated docs/PRODUCT_BUILD_ROADMAP.md.
- Updated PR #3 description to include Crypto work and outstanding limitations.

### Safety constraints
- Never collect private keys, seed phrases, recovery phrases or exchange passwords.
- Device approval is not device authentication and does not start mining.
- Future device enrolment must use a fresh signed challenge and proof of possession.
- Mining requires explicit device-owner consent, resource/power/thermal limits, cost estimates, signed software and independent security review.
- Exchange connections start read-only and must not have withdrawal permissions.
- Stock trading starts with analysis and paper trading. Any later live orders require separate explicit approval, segregated budget, position limits, daily loss cap, audit and emergency stop.
- Complete legal, tax, privacy, security and app-store reviews before enabling financial operations.

### Status
- Changes are committed to the feature branch and included in draft PR #3.
- PR #3 is open and unmerged. Nothing from this work has been deployed to production.
- Runtime, security and end-to-end tests remain outstanding.
