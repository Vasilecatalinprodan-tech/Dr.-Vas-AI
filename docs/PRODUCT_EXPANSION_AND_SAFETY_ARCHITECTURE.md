# Dr.Vas — Product expansion and safety architecture

Date: 2026-11-03
Branch: `drvas-integrated-platform`

This document turns the founder's new product ideas into an implementable roadmap. It is a design specification, not a claim that the listed services are already live.

## 1. Dr.Vas Studio — production workflow upgrade

The Studio brief now captures:
- deliverable type (series, short-form, YouTube, advert, storyboard);
- target platform;
- creative tone;
- target audience;
- estimated duration;
- frame format/aspect ratio;
- the founder/client's original idea.

The generated brief requests a structured production pack: creative objective, complete scene-by-scene script, dialogue/voice-over, shot size and camera movement, lighting, sound, transitions, on-screen text, subtitles, editing notes, rights/licensing reminders, title, description, call to action and hashtags. Commercial claims must be verifiable; the assistant must not invent testimonials, certifications or results.

### Studio delivery phases
1. Script and production pack (current pilot; text output).
2. Project workspace: save drafts, versions, reusable characters/brand kits and export.
3. Media generation: connect an approved image/video provider, store generated assets, track usage and cost, and provide user review.
4. Social accounts: Meta/TikTok OAuth, secure token storage, revocation and per-user permissions.
5. Publishing: explicit per-post approval, schedule preview, platform-policy checks, audit trail and rollback/delete where supported.
6. Paid plans: verified server-side subscription entitlements, quotas and usage-based cost controls.

Never advertise rendered video, connected accounts, scheduled publishing or payment entitlements until each is actually implemented and tested.

## 2. Hidden administrator workspace: Dr.Vas Crypto

- Add a non-public navigation entry only after the server has authenticated the user as an administrator. Hiding a button is not security: every API endpoint and operation must independently enforce the server-side admin allowlist/role.
- Initial safe scope: portfolio/watchlist, public market data, mining profitability calculator, electricity/hardware cost modelling, pool/rig health monitoring and alerts.
- Any mining execution must run only on infrastructure owned or explicitly leased/authorised by the company, with documented energy, hardware and hosting costs. No browser/phone visitor mining, hidden scripts, cryptojacking, or use of customer compute.
- Wallet private keys and seed phrases must never be collected by Dr.Vas. Use read-only wallet addresses for monitoring; signing and withdrawals stay in a separately secured wallet controlled by the owner.
- Require explicit admin activation, resource limits, pause/stop controls, immutable audit events, budget caps and a visible operating status for the administrator.
- Profit is not guaranteed. Show network difficulty, hashrate, pool fees, uptime, electricity price, hardware depreciation, tax and coin-price volatility; present estimates as estimates.
- Do not enable actual mining until legal, tax, energy, hosting, cybersecurity and economic review is complete. The first implementation should be a read-only dashboard and calculator, not a miner.

## 3. Dr.Vas Psychology — paid wellbeing and professional referral

Position it as a wellbeing and psychoeducation assistant, not an autonomous licensed psychologist. Paid access must not imply clinical diagnosis, psychotherapy or emergency-service coverage.

### Minimum product safeguards
- Clearly disclose AI identity, scope, limitations, price, data use and that it is not a substitute for a registered professional.
- Provide user-controlled connection to a qualified, appropriately registered psychologist/therapist, with credential checks, consent, appointment booking and clear human responsibility.
- Detect possible crisis language conservatively and respond with empathetic, direct, non-judgmental support; ask whether there is immediate danger, encourage moving away from means of harm and contacting a trusted person.
- In the UK, show 999 for immediate danger and 111 / NHS 111 mental-health option where available; in the EU, show 112. Always localise emergency guidance and tell the user to call directly.
- Offer a prominent tap-to-call action and a user-consented option to contact a trusted person or human crisis team. Do not imply that Dr.Vas has called emergency services.
- Do not automatically call 112/999 or transmit a person's location based solely on an AI-generated risk score or ambiguous text. Such an action requires a formally authorised, clinically governed emergency-response service, verified location handling, human escalation where feasible, strict legal basis, false-positive/false-negative testing and emergency-service agreement.
- Do not store crisis transcripts or precise location in ordinary analytics. Separate sensitive clinical records, restrict access, define retention/deletion, encrypt data, perform a DPIA and obtain clinical/legal review before launch.
- Never make payment a condition for emergency information or basic crisis guidance.

### Crisis workflow (proposed)
1. Identify a possible crisis signal; do not label or diagnose the person.
2. Immediately present local emergency options and ask a short, direct safety question.
3. If immediate danger is reported, urge the user to call emergency services now; offer a tap-to-call action and support contacting a trusted person.
4. With explicit consent, connect to a staffed human escalation pathway. If no staffed pathway exists, state that clearly and do not simulate one.
5. Record only the minimum operational metadata required for safety review, under a separately approved retention and access policy.

## 4. Child safety and lawful reporting

Dr.Vas may provide a safe reporting route for users to submit a concern and find the appropriate safeguarding authority. It must not become a covert surveillance or automated suspect-identification system.

- Do not classify a person as a criminal/pedophile based on AI inference, conversation style, identity traits or unverified allegations.
- No covert monitoring, scraping private accounts, facial recognition, profiling, entrapment, or automated accusation/reporting.
- Provide clear user reporting, evidence-preservation instructions that do not ask users to download, copy, forward or re-upload illegal sexual imagery of minors, and routes to official reporting channels.
- Any report involving a child must be handled by trained safeguarding personnel, with strict access control, audit trails, minimum necessary data and legal review.
- Never expose a reporter or child to an alleged offender; do not promise confidentiality beyond what law and safeguarding duties permit.
- For imminent danger, direct the user to emergency services. Authorities receive information only through a lawful, approved process.

## 5. Academy, Commerce / dropshipping, and Business

### Academy
- Learning paths for beginners through advanced entrepreneurs.
- Short lessons, practical assignments, templates, quizzes, progress tracking and certificates only when a genuine assessment/issuer exists.
- Topics: market research, supplier due diligence, ecommerce basics, pricing, advertising, customer service, bookkeeping basics and UK/EU consumer obligations.

### Commerce / dropshipping
1. Product research from approved suppliers and lawful sources.
2. Supplier due diligence: company identity, shipping times, returns, product safety, IP/trademark checks and sample orders.
3. Landed-cost model: supplier price, shipping, duties/VAT, payment fees, returns, advertising and platform fees.
4. Margin and break-even calculator; never promise a guaranteed profit.
5. Product page copy and compliant images/claims.
6. Order/inventory integration only through authorised APIs; customer support and returns workflow.
7. Human approval before publishing products, changing prices, accepting supplier terms or issuing refunds.
8. Payments and subscriptions via a compliant provider, with verified webhooks and no card data stored by Dr.Vas.

### Business
- Business model canvas, market/customer research, competitor analysis, pricing, cashflow and scenario planning.
- UK/EU company setup and tax content must be jurisdiction-aware and labelled as general information, with referral to qualified accountants/solicitors for decisions.
- Generate editable business plans, operational checklists, marketing calendars and financial projections with explicit assumptions.

## 6. Shared platform foundations and release gates

- One integrated app, one identity system, separate server-enforced entitlements per module.
- Role-based access for administrators and separately verified paid subscriptions for customers.
- Data minimisation, encryption, audit logs without message contents/secrets, export/deletion, retention schedules and incident response.
- No new sensitive clinical or child-safety data collection before DPIA, privacy notice, lawful-basis review, security review and operational ownership.
- Automated tests for access control, cross-user isolation, payment webhook signatures/idempotency, safety scenarios, rate limits and abuse cases.
- Each release must state what is live, in pilot, blocked on provider approval, or only a design.

## 7. Recommended build order

1. Finish Studio's text production workflow and project persistence.
2. Complete Academy / Business / Commerce tools that do not require external write permissions.
3. Build Crypto as an admin-only read-only dashboard and profitability calculator.
4. Establish billing and server-side entitlements before public premium access.
5. Build Psychology only after clinical partner, safeguarding lead, DPIA, crisis protocol and legal review are in place.
6. Build child-safety reporting as a human-governed safeguarding workflow, never an AI criminal detector.
7. Connect external providers and launch only after end-to-end security and operational testing.
