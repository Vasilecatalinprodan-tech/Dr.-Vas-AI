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


## 3 November 2026 — confidential adult-media business proposal and Dr.Vas advertising

### Founder proposals and assessment
The founder proposed (a) an administrator-only AI-assisted adult film production business, with distribution through specialist adult platforms under commercial agreements, and (b) paid advertising/sponsorships inside Dr.Vas.

### Adult-media concept — research before any implementation
- Treat as a separate confidential administrator-only business experiment, NOT a public Dr.Vas workspace and NOT part of the six public modules.
- No production, publishing, platform onboarding or payment integration is authorised by this discussion. First perform legal, platform-policy, payment-provider, insurance, tax and unit-economics due diligence.
- Any future scope must be limited to lawful adult-only material featuring clearly fictional, synthetic adult characters. Do not use a real person's face, body, voice, likeness or identifiable characteristics without explicit documented rights and consent. Never create or distribute non-consensual intimate imagery, nudification/deepfake content, underage/young-looking characters, or sexual content involving minors.
- No model, dataset, actor, voice, image, music or other third-party asset may be used without appropriate commercial rights/licences. Preserve provenance, consent/rights records, age/identity checks where relevant, release records, AI-generation disclosures, content moderation and takedown process.
- UK regulatory review is mandatory. Ofcom guidance requires highly effective age assurance for services publishing pornography; the 2026 legal changes further strengthen rules around non-consensual intimate imagery and certain AI-generated pornographic depictions. The Crime and Policing Act 2026 also introduced relevant new provisions and a review of age/consent verification for people appearing in pornographic content. Re-check commencement, detailed rules and jurisdictional scope with a UK solicitor before launch.
- Platform and payment-provider acceptance must be obtained in writing before production investment. Do not assume a platform accepts synthetic/AI adult content, or that mainstream payment processors/ad networks will process it.
- Commercial viability is unproven. Validate distribution access, revenue share, minimum payout, chargebacks, content acquisition costs, moderation, legal costs, marketing restrictions and realistic demand with a small non-production feasibility study first.
- Current decision: research only; no implementation until explicit founder approval after legal and commercial review.

### Dr.Vas advertising and sponsorships
- Add a monetisation option to evaluate across public Dr.Vas workspaces, without disrupting assistant conversations or compromising user trust.
- Preferred formats: clearly labelled direct sponsorships, contextual ads relevant to the current workspace, and disclosed partner/referral listings. Keep ads visually separate from assistant answers and never imply that paid placement is an objective recommendation.
- Never sell conversation content or expose private chats, Health information, uploaded files or personal profiles to advertisers. Do not target ads using sensitive health or other special-category data.
- Prefer contextual advertising and direct sponsorships at launch. Any advertising cookies, device storage, tracking or profiling must follow PECR/UK GDPR consent requirements; document vendors, purposes, data flows, withdrawal and measurement controls.
- Consider a paid/ad-free tier and frequency caps. No ad network or ad SDK selected or integrated yet.
- Validate revenue only after user traffic, retention, fill rate, CPM/RPM, consent rate and user experience can be measured. Advertising is supplementary income, not a guaranteed material revenue source.
- Current decision: approved for product research and future design only; no ads are live and no ad provider has been connected.

### Current references checked
- Ofcom online pornography / age assurance guidance: https://www.ofcom.org.uk/online-safety/pornography and https://www.ofcom.org.uk/online-safety/protecting-children/age-assurance
- Crime and Policing Act 2026 factsheets: https://www.gov.uk/government/publications/crime-and-policing-act-2026-factsheets
- ICO online advertising and PECR guidance: https://ico.org.uk/for-organisations/direct-marketing-and-privacy-and-electronic-communications/guidance-on-the-use-of-storage-and-access-technologies/how-do-the-rules-apply-to-online-advertising/


## 3 November 2026 — Crypto transition hardening and advertising specification

- Crypto administrator state changes now use conditional database filters: authorization is accepted only from pending/revoked, and revocation only from authorized. This reduces stale/replayed state overwrites. It does not replace device proof-of-possession, rate limiting or end-to-end tests.
- Added `docs/ADVERTISING_SPEC.md` defining privacy-first direct sponsorships and contextual placements, a global OFF switch, per-workspace controls, explicit labels, consent requirements, aggregate-only measurement and no health/chat/file targeting.
- No advertising SDK, network, campaign or tracking is active. No mining or trading is enabled.
- Validation status: source change committed; runtime, Supabase integration, race-condition and browser tests remain outstanding. Do not deploy until these pass.


## 3 November 2026 — Production availability investigation

- Founder reported that the public Dr.Vas site stopped working.
- Checked GitHub Actions for the production Worker deployment. Latest observed deployment run: `41679408782`, branch `drvas-integrated-platform`, commit `ef43f9ca1a04e01a6937b3dd33e6096ae519bdac`, completed successfully at `2026-11-03T16:57:21Z` (run conclusion success).
- Deployment job steps confirmed successful: dependency installation, Worker/browser JavaScript validation, Cloudflare Worker deployment, and production smoke test. The smoke test checks `/health`, homepage delivery, all six public module markers, and unauthenticated admin rejection.
- The latest successful production change was the privacy notice link in the account profile. The experimental `drvas-modules-long-input` branch and its recent Crypto/advertising documentation changes were not deployed by this run.
- Cloudflare Status history showed an active Workers and Pages build-errors incident on 3 Nov 2026 (investigating/identified, with increased builder queue times) and a separate increased Durable Object errors incident in Dallas. The build incident may delay future deployments; it does not by itself prove the already-deployed Dr.Vas Worker is down. See https://www.cloudflarestatus.com/history?service=API.
- Direct live HTTP probe from the assistant's container could not resolve DNS in that environment, so it did not independently establish the live response. Web page open was also unavailable. Do not claim independent live-site recovery from those failed probes.
- Working conclusion: production deploy and its immediate smoke test were healthy; exact current user-facing failure remains unconfirmed. Need user's exact URL and browser error/screenshot, then check current `/health`, root response, and Cloudflare Worker logs. Do not redeploy or change production blindly.
- Reliability action: add external uptime monitoring and scheduled health checks, plus alerting for Worker 5xx/latency and deployment failures. Keep production deploy gated by the existing syntax and smoke tests.

- Follow-up Cloudflare Status check: the Workers and Pages build-errors incident moved to Monitoring at 17:23 UTC on 3 Nov 2026; Cloudflare said builder queue times were returning to normal. The Dallas Durable Object error incident was marked resolved at 16:42 UTC. These incidents are not evidence that Dr.Vas's already deployed Worker was offline. Incident detail: https://www.cloudflarestatus.com/incidents/nbyxn84kvb6o.
