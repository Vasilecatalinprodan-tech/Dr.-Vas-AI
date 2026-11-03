# Dr.Vas Revenue Engine Roadmap

Last updated: 2026-11-03

## Product principle

Dr.Vas should earn revenue by delivering measurable value through its own platform. External marketplaces may be useful acquisition/distribution channels, but the core business must not depend on them. No income, acceptance, royalty or sales outcome is guaranteed.

## Revenue streams

### 1. Dr.Vas Studio — paid digital production
- Books and e-books: outline, drafting, editing, formatting and publishing-preparation packages.
- Translation/localisation: price by word-count bands, language pair and complexity; certified/legal translations must be referred to authorised human translators.
- Music: original lyrics, composition briefs, chord/arrangement packages; rendered audio is a separate paid deliverable only after a real audio-generation workflow is integrated.
- Scripts/video/social: packages by deliverable count, length and revision allowance.
- Editorial/commercial content: articles, product copy, marketing material and proposals.
- Revenue model: one-off project orders, monthly credits/subscriptions, premium revisions and human-expert add-ons.

### 2. Dr.Vas Business
- Business plans, market research, pricing, operations templates and management support.
- Revenue model: paid reports, consultation bookings and recurring business-support subscriptions.
- Human professional review required for regulated legal, accounting, tax and financial advice.

### 3. Dr.Vas Academy
- Structured courses, guided learning paths, templates and workshops.
- Revenue model: course purchases, memberships and team licences.
- Clearly label AI-generated learning content and verify factual/regulated material.

### 4. Dr.Vas Commerce
- E-commerce learning, store planning, product research workflows and seller tools.
- Revenue model: subscriptions, premium tools and optional partner referrals with transparent disclosure.
- Do not promise sales or profit.

### 5. Dr.Vas Health
- General health information, appointment preparation and care navigation remain distinct from diagnosis or treatment.
- Potential revenue only through lawful clinic/provider partnerships, transparent referral arrangements where permitted, and paid administrative tools.
- No sale of sensitive health data; no replacement of clinicians.

### 6. Marketplace and creator partnerships
- Help customers prepare works for eligible publishing, freelance, translation and creator marketplaces.
- Review each marketplace's current AI disclosure, exclusivity, copyright, licensing, tax and payment terms before submitting work.
- Never fabricate human authorship or credentials.

## Required payment and order architecture

1. Customer account and verified email.
2. Server-side product catalogue and price IDs; never trust client-submitted prices.
3. Payment provider checkout (Stripe or another approved provider) created server-side.
4. Signed webhook verification before marking an order paid.
5. Entitlement/credit ledger stored server-side; atomic deduction to prevent double spending.
6. Usage quotas, cost ceilings, idempotency keys and abuse controls.
7. Order lifecycle: draft, awaiting payment, paid, in progress, review, delivered, refunded/cancelled.
8. Project ownership, file storage, export history and revision tracking.
9. Refund/dispute handling, receipts, tax/VAT review and clear terms.
10. Admin audit logs and reporting for revenue, refunds, provider costs and gross margin.

## Build order

- Phase A: finish Studio project save/reopen/export and verify Supabase RLS.
- Phase B: define service catalogue, packages, deliverable specifications and human-review options.
- Phase C: integrate server-side checkout, webhooks, order ledger and entitlements in test mode.
- Phase D: test refunds, failed payments, duplicate webhooks, account switching, quota exhaustion and cost controls.
- Phase E: limited launch with a small set of Studio services; measure conversion, fulfilment time, provider cost and refund rate.
- Phase F: extend Business and Academy paid products; then Commerce tools.
- Phase G: lawful partner programme for Health only after specialist regulatory/privacy review.

## Intellectual property and AI transparency

- Keep a register of source code, third-party libraries, model/API terms, media assets, trademarks, domains and contributor assignments.
- Use original briefs and generated material; do not reproduce protected books, lyrics, music, scripts or distinctive living-creator styles.
- Review commercial-use rights and marketplace AI policies for each deliverable and provider.
- Explain what Dr.Vas actually produced (text, source file, rendered media, publication) and never claim a file was generated or published unless it was.
- Obtain written agreements from contractors assigning or licensing the necessary rights to the operating company.

## Dr.Vas cryptocurrency — future gate

Do not issue, sell or promote a Dr.Vas coin/token until the operating company, brand/IP ownership, token utility, technical architecture, security audit, consumer disclosures, AML/sanctions implications and jurisdiction-specific legal classification have been reviewed by qualified professionals. A proprietary blockchain and a token on an existing network are materially different projects. No customer funds or project operating cash should be mixed with founder crypto trading/mining accounts.

## Success metrics

Track real figures only:
- paid conversion rate and repeat purchase rate;
- revenue per active customer;
- fulfilment time and revision rate;
- AI/provider cost per order and gross margin;
- refunds, chargebacks and support tickets;
- course completion and subscription retention;
- safety, privacy and policy incidents.

Do not forecast revenue as fact before actual customer and cost data exists.
