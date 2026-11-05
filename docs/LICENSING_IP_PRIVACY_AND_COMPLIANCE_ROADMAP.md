# Dr.Vas — Licensing, Intellectual Property and Compliance Roadmap

**Status:** planning document, not a legal opinion or evidence of regulatory approval.  
**Product:** one integrated Dr.Vas platform and companion Android app.  
**Owner/founder direction:** the founder intends to protect the Dr.Vas brand and product ownership personally; confirm the exact legal owner, trading entity, contracts and assignment chain with a UK solicitor before launch.

## 1. Protect the product before public release

- Keep the repository private while ownership, dependencies, provider terms and security are being reviewed.
- Do not add an open-source licence to the whole product by default. An absent licence does not grant the public permission to reuse the code; it also does not replace proper contributor and contractor agreements.
- Maintain a component inventory: first-party code, third-party packages, fonts, icons, images, model APIs, voice services, video services and hosted assets.
- Generate and review a Software Bill of Materials (SBOM) for each release. Record package name, exact version, licence, source and whether it is shipped in the web app or Android binary.
- Add third-party notices and preserve required attribution/notice text for permissive and copyleft dependencies. Review GPL/AGPL and other reciprocal licences before distributing or offering hosted modifications.
- Obtain written IP assignment or suitable licences from every human contributor, designer, contractor and agency. Do not assume payment alone transfers copyright.
- Keep dated release tags, source commits, design originals, invoices, contributor agreements and provenance records. A Git commit or hash is supporting evidence, not a substitute for legal ownership or registration.

## 2. Brand and trade marks

- Search for earlier identical and confusingly similar marks in relevant territories and classes before filing.
- Identify the correct applicant (individual or company) and ensure ownership is consistent across the app, website, contracts and store accounts.
- UK protection: assess filing with the UK Intellectual Property Office (UK IPO).
- EU protection: assess a separate EU trade mark filing with EUIPO; a UK filing does not automatically cover the EU.
- Select Nice classes based on actual planned goods/services, likely including downloadable software, SaaS/software services, education, creative/media services and business support. A trade mark professional should confirm the class wording and filing strategy.
- Keep a record of first commercial use and examples of genuine use. Do not use ® before registration.

## 3. Privacy and data protection (UK first)

Before public beta:
- Publish a clear Privacy Notice, Terms of Service, Cookie Notice where applicable, and contact route for privacy requests.
- Map data flows: browser/app → Cloudflare Worker → Supabase → AI/voice/video providers → logs, analytics, support and backups.
- Document lawful bases, purposes, data minimisation, retention periods, deletion, access/correction requests, international transfers and processor/subprocessor roles.
- Execute appropriate data-processing agreements with hosting, database, AI, analytics, voice and video providers; review each provider's retention, training, residency and subprocessors.
- Complete a Data Protection Impact Assessment (DPIA) before high-risk processing, particularly health-related information, voice recordings, profiling or vulnerable users.
- Apply privacy by design: collect no unnecessary sensitive information; never place access tokens, API keys, encryption keys or private user data in client code, source control or routine logs.
- Establish incident response, breach assessment, backup/restore, account deletion and subject-access request procedures.
- Determine whether an ICO data-protection fee is payable and meet applicable UK GDPR / Data Protection Act 2018 obligations. Reassess if the service targets or operates in the EU.

## 4. Dr.Vas Health — strict product boundary

- Keep general health education and navigation clearly distinguished from diagnosis, triage, treatment recommendations and clinical decision-making.
- Do not claim that Dr.Vas replaces a doctor, nurse, pharmacist or emergency service.
- For urgent symptoms, direct people to appropriate emergency services and local clinical care.
- Before enabling functionality with a medical intended purpose, obtain specialist regulatory advice on UK medical-device rules and MHRA requirements, including whether the software is medical-device software and what conformity/registration route applies.
- If serving EU users, separately assess EU Medical Device Regulation and relevant AI Act obligations and implementation dates.
- Establish clinical safety governance, evidence, risk management, human oversight, change control, monitoring, complaint handling and adverse-event escalation before any regulated clinical use.
- Obtain written agreements and clinical governance arrangements with participating clinicians, clinics and hospitals. Do not imply institutional endorsement without permission.
- Treat health data as special-category personal data under UK GDPR; define an Article 9 condition and additional safeguards before processing it.

## 5. AI, content and voice providers

For every model, image, voice and video provider:
- Record the provider, model/version, account tier, applicable terms, commercial-use rights, attribution duties, prohibited use, output ownership language, retention/training settings and rate/cost limits.
- Confirm that the selected plan permits commercial use, the intended volume, redistribution and the exact feature being offered.
- Disclose meaningful AI generation or synthetic voice where required by law, platform rules or user expectations.
- Obtain explicit permission and rights for voice cloning, likenesses, reference images and any personal data used to create a synthetic identity.
- Do not clone a real person's voice or likeness without documented authorisation and a suitable consent/withdrawal process.
- Keep human review for high-impact, factual, health, legal, financial and public-facing content.
- Avoid promises that AI-generated content is guaranteed copyrightable, exclusive or free of third-party rights. Review similarity, source material, trademarks, music rights and platform-specific rules.

## 6. Commercial modules and consumer obligations

Before paid subscriptions or transactions:
- Publish transparent prices, billing periods, renewal, cancellation, refund, trial and support terms.
- Confirm consumer cancellation and digital-content/service rules applicable to the UK and any other market served.
- Use a compliant payment provider; do not store raw card data in Dr.Vas.
- Separate free features from paid entitlements on the server. Never rely only on hiding buttons in the browser.
- Keep auditable subscription state, invoices/receipts, tax records and a clear route to cancel.
- For Academy, define course access, instructor/partner rights, certificates and refund terms.
- For Commerce, clearly distinguish educational support from acting as seller, marketplace, payment intermediary or fulfilment provider. Define product safety, consumer returns, VAT, import and seller responsibilities before enabling transactions.
- For Business, state the limits of general information and require qualified professionals for regulated legal, tax, accounting or financial advice.

## 7. Accessibility, security and operational readiness

- Target WCAG 2.2 AA for the web experience; test keyboard navigation, screen readers, contrast, zoom, captions and reduced motion.
- Keep voice input/output optional and provide text alternatives.
- Use dependency scanning, secret scanning, static analysis, SBOM generation and repeatable CI builds.
- Apply least privilege, row-level security, server-side authorisation, rate limits, abuse monitoring and tested deletion/backup procedures.
- Maintain a vulnerability disclosure contact and a process for security updates.
- Do not store production secrets in GitHub files, browser bundles, issue comments or screenshots.
- Perform independent penetration testing before handling sensitive health data or launching paid services at scale.

## 8. Android and distribution

- Confirm the Android package ID, app signing key custody, privacy declarations, data-safety disclosures, permission justifications and store listing accuracy.
- Protect the release signing key with controlled backup and restricted access; never commit it.
- Verify that every bundled SDK and library complies with Google Play requirements and the provider's licence.
- Test on supported Android versions and devices, including accessibility, permissions, offline/network failures, account deletion and subscription cancellation.
- Treat a successful APK build as a build milestone only. Release readiness requires signed release build, device testing, security/privacy review and store policy review.

## 9. Release gates

A public launch must not be declared complete until the relevant gates are evidenced:

1. **Ownership:** applicant/entity, contributor assignments, trade mark search and third-party IP review.
2. **Software licences:** dependency inventory, SBOM, notices and incompatible licence review.
3. **Privacy:** data map, notices, processor agreements, DPIA where needed, retention/deletion and incident plan.
4. **Security:** secrets, access controls, RLS, rate limiting, audit trail, vulnerability review and recovery test.
5. **AI provider rights:** commercial terms, voice/image consent, output review and disclosure.
6. **Health boundary:** intended-purpose assessment, clinical governance and any required MHRA/EU regulatory pathway.
7. **Commercial readiness:** pricing, terms, cancellation/refunds, tax and payment handling.
8. **Accessibility:** WCAG testing and assistive-technology review.
9. **Android release:** signing, device testing, data-safety declarations and Play policy review.
10. **Operations:** monitoring, support, incident response, rollback, cost controls and documented ownership.

## 10. Immediate next steps for Dr.Vas

1. Keep the product private and avoid adding a blanket open-source licence.
2. Inventory `package.json`, `package-lock.json`, Android dependencies, fonts, icons and externally loaded assets; generate an SBOM in CI.
3. Confirm whether the intended legal owner will be the founder personally or a company, and align contributor/IP agreements accordingly.
4. Obtain UK trade mark advice and search the proposed name before filing.
5. Complete a data-flow map and privacy/DPIA assessment before real health data is accepted.
6. Get a specialist intended-purpose opinion for Dr.Vas Health before adding diagnosis, triage or clinical decision support.
7. Review each AI, voice and video provider's current commercial plan and terms before selling those capabilities.

**No licence, registration, certification or regulatory approval is claimed by this document.**