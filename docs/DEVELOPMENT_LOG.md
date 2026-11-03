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


## 3 November 2026 — AI Evaluation and AI Training business line

### Founder direction
- The founder wants Dr.Vas to compete at a higher quality level than existing AI evaluation and AI training services, and to create a real revenue stream from this work.
- This conversation and the product decision are recorded here for continuity across devices and future development sessions.

### Product decision
- Add an **AI Evaluation & Training Workbench** as a capability inside the existing Dr.Vas Studio and Dr.Vas Business workspaces, not as a seventh public workspace.
- Intended service areas:
  1. AI response evaluation: correctness, relevance, completeness, clarity, instruction-following and citation/source quality.
  2. Human review and quality assurance: expert or trained reviewers, double review for high-impact tasks, adjudication and measurable inter-rater agreement.
  3. Prompt and workflow evaluation: compare prompts/models against versioned test sets and regression benchmarks.
  4. Dataset preparation and annotation: classification, tagging, ranking, transcription review and structured feedback, only where the source data is lawfully usable.
  5. AI training support: create licensed, documented examples and feedback datasets; improve task instructions and rubrics; support supervised fine-tuning or preference-data preparation only where the chosen provider and contract permit it.
  6. Business services: evaluation reports, quality dashboards, audit trails and managed evaluation projects for companies.
- Potential revenue models to validate: paid evaluation projects, per-task/per-item review, monthly business subscriptions, custom benchmark packages and managed quality-assurance contracts. Prices and margins must be tested with real pilot customers and actual reviewer/provider costs before publication.
- Differentiation target: transparent scoring rubrics, traceable evidence, calibrated human reviewers, repeatable benchmarks, privacy-by-design, domain-specific quality controls and clear confidence/limitations—not unsupported claims that Dr.Vas can certify or guarantee an AI system.

### Safety, rights and quality gates
- Never use private customer data, personal data, copyrighted material or confidential business data for model training without a documented lawful basis, appropriate permissions/licences, contractual authority and retention/deletion controls.
- Separate evaluation from training: evaluating a model must not automatically grant permission to use submitted content for training.
- Minimise and redact personal/sensitive data; restrict access by role; record dataset provenance, licence/consent, reviewer actions and deletion status.
- Health, legal, finance and other high-impact evaluations require domain-qualified reviewers and appropriate professional/regulatory review; general-purpose automated scoring alone is insufficient.
- Build human-in-the-loop review, reviewer calibration, disagreement handling, sampling audits, bias checks, appeal/correction paths and versioned rubrics.
- Do not promise jobs, guaranteed income, certification, model improvement or customer outcomes until supported by actual contracts and measured results.

### Status and next build
- This is a recorded product decision and roadmap addition only. No evaluator/training service, customer data pipeline, marketplace, billing or public offer has been implemented or launched.
- Next: define the evaluation schema and workflow; build a private prototype with synthetic/publicly licensed sample data; add repeatable rubric scoring, human review, benchmark runs, version history and exportable reports; then pilot with a small number of real customers under written terms.


### Market scan — 3 November 2026
- Current market examples include expert networks and contributor platforms such as Alignerr, Mercor, micro1, Prolific, Outlier, Welo Data, TELUS Digital, Appen/CrowdGen and RWS TrainAI. Their work spans response rating, domain-expert evaluation, RLHF/preference feedback, data annotation, language/voice collection and quality review.
- Enterprise providers such as Scale AI, Surge AI, Labelbox, Appen, Toloka and Prolific offer combinations of model evaluation, expert review, benchmark/red-team work and data services; client pricing is often quote-based rather than publicly listed.
- Strategic conclusion: Dr.Vas should not begin by trying to build a giant open gig marketplace. Start with a focused managed evaluation service and a software workbench: benchmark design, repeatable scoring, human QA, evidence-backed reports and carefully permissioned data preparation. Add a vetted reviewer network only after workflows and customer demand are proven.
- Market research references reviewed: https://aitrainers.jobs/platforms ; https://www.aitrainer.work/platforms/database ; https://services.deepen.ai/guides/llm-evaluation-companies ; https://www.aitrainingjobsuk.co.uk/platforms
- These are third-party directories/guides, not guarantees of a provider's current openings, pay or contractual terms. Re-verify against each provider's own site before making claims or recommending applications.
