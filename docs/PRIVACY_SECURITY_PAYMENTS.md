# Dr.Vas — Privacy, account security and payments blueprint

Last updated: 2026-11-03
Status: database foundation and authenticated Worker encryption endpoints committed; encryption key, UI, tests and production verification still pending.

## 1. Product principles
- Privacy by design and default; collect only data needed for a stated purpose.
- Free accounts collect the minimum profile data needed to operate the service.
- Premium/business profile fields are optional unless required for a clearly disclosed legal, billing, fraud-prevention or feature purpose.
- Separate account identity, optional business profile, billing identity, social OAuth credentials and health information.
- Never sell personal data or use private conversations for model training without a separate, informed opt-in.
- Provide account export, correction, deletion, consent withdrawal and retention controls.
- Publish a clear privacy notice and terms before accepting paying customers. Obtain UK/EU legal review and complete a DPIA where processing is likely high risk, especially health information or large-scale profiling.

## 2. Profile field plan
Basic account: display name, authentication email, preferred language/locale, country and time zone. Phone only when needed for account recovery or a requested service. Date of birth is not mandatory by default; prefer age assurance over retaining full DOB where possible.

Premium/business profile (collect progressively): legal name, business/trading name, business type, country of registration and company registration/tax identifier only when necessary for invoicing, eligibility or regulatory checks; billing address and contact; optional service/contact address; phone verification for a clear purpose; locale, currency, time zone, invoice preferences and notification choices.

Never collect bank passwords, card PINs, CVVs, social passwords or answers to traditional security questions. Do not require DOB, phone or address merely because a user upgrades.

Each field needs a purpose, lawful basis, retention period, access role and deletion rule.

## 3. Private profile encryption foundation
Migration 202611030002_private_profile_and_privacy.sql creates:
- drvas_private_profiles: one encrypted payload per auth user; no direct anon/authenticated table access; service-role only.
- drvas_privacy_consents: minimal versioned consent evidence; service-role only.

Before collecting private fields:
1. Add Cloudflare Worker secret DRVAS_PROFILE_ENCRYPTION_KEY containing a randomly generated 32-byte key (base64); never commit it or send it to the browser.
2. Worker-only AES-256-GCM encryption with a fresh random 96-bit nonce per write, authenticated additional data binding ciphertext to user ID and schema version, and key-version identifier.
3. Worker validates Supabase access token with Supabase Auth before any read/write; derive user ID only from the verified token, never request JSON.
4. Browser sends fields over HTTPS to Worker; Worker validates formats and allowlists, encrypts, then stores ciphertext with service-role access.
5. No plaintext sensitive values in audit logs, analytics, errors, URLs, localStorage, GitHub or model prompts.
6. Key rotation supports current/previous versions; re-encrypt and verify records before retiring old keys. Maintain encrypted backups and test restore.
7. Add rate limits, origin/CSRF controls appropriate to auth model, security tests and deletion cascade handling.
8. Do not build/enable the private profile form until the Worker endpoint and encryption key are deployed and tested.

Supabase encryption at rest is defence-in-depth, not a substitute for application-level encryption.

## 4. Account recovery and authentication
- Use Supabase Auth password reset, verified email, verified phone where justified, MFA (TOTP/passkeys where supported), and single-use recovery codes.
- Password hashes remain with the identity provider; Dr.Vas must never see or store user passwords.
- Do not use secret questions. If an exceptional recovery factor is required, use a high-entropy one-time recovery code stored hashed, rate-limited and invalidated after use.
- Add login alerts, session/device management, sign-out-all-sessions and recovery throttling.
- Social accounts connect only through official Meta and TikTok OAuth. Encrypt access/refresh tokens server-side, scope minimally, rotate/revoke on disconnect, and never request social passwords.

## 5. Privacy and localization UX
- Privacy centre available from account settings, in every supported UI language.
- Distinct optional marketing email/SMS toggles, unchecked by default and never bundled with terms acceptance.
- Versioned terms/privacy notice acceptance with timestamp and locale.
- Privacy notice covers data categories, purposes, lawful bases, recipients/processors, international transfers, retention, rights, complaint route and contact details.
- Language/locale selector is separate from country, time zone and billing currency. Device locale may be a suggested default.
- Localize dates, number/address formats, currency and accessibility labels.
- Turkish is supported in language selection and speech paths; full professional translation review remains required.

## 6. Payments and monetization
Preferred initial online architecture: Stripe-hosted Checkout or Stripe Payment Element, with card entry handled by Stripe-hosted/tokenized components. Enable Apple Pay and Google Pay when domain, device, country and merchant eligibility checks pass. Store only processor customer/payment-method references and safe display metadata; never PAN, CVV, PIN or magnetic-stripe data.

- Subscription lifecycle driven by signed Stripe webhooks, not browser success redirect.
- Verify webhook signatures, make event handling idempotent, map Stripe customer/subscription IDs to auth user IDs server-side, and enforce entitlements in Worker.
- Stripe secret and webhook signing secrets live only in Cloudflare secrets.
- Refunds, cancellations, failed payments, grace periods, tax/VAT invoices, chargebacks and customer support need workflows.
- Use a normal Stripe merchant account for Dr.Vas subscriptions. Stripe Connect is only relevant if Dr.Vas later pays out third-party creators/merchants.
- Online Apple Pay/Google Pay are wallet checkout methods; they are not the same as accepting contactless in-person NFC payments.
- In-person NFC acceptance is a separate Stripe Terminal/Tap to Pay project with compatible devices, supported country, merchant approval and SDK integration.
- Do not activate payments until company/merchant verification, legal terms, pricing, refund policy, tax setup, privacy disclosures and production webhook tests are complete.

## 7. Release gates
- Review RLS and database grants; test cross-user isolation.
- Test ciphertext cannot be decrypted without Worker key and tampering fails authentication.
- Test key rotation, restore, deletion, export and consent withdrawal.
- Complete threat model, dependency audit, penetration test and incident-response plan.
- Complete UK GDPR / Data Protection Act 2018 review and assess EU GDPR obligations. Health data is special-category data and requires both an Article 6 lawful basis and an Article 9 condition, plus safeguards.
- Obtain legal/accounting advice on company structure, tax, consumer rights, subscription cancellation, VAT and payment-provider onboarding.
- Only then onboard paying customers.

## 8. Implementation status
- Existing basic profiles table currently stores display name and country directly. Do not add DOB, phone, address or company identifiers to that plaintext table.
- Encrypted private-profile and consent table migration added, but it must be applied in Supabase before use.
- Authenticated Worker actions `private_profile_get` and `private_profile_save` are implemented in code. They validate the Supabase access token, derive the user ID server-side, validate an allowlisted profile schema, and use AES-256-GCM with a fresh 96-bit nonce and user/schema-bound AAD. They store only ciphertext through service-role access.\n- The Worker secret `DRVAS_PROFILE_ENCRYPTION_KEY` and optional `DRVAS_PROFILE_KEY_VERSION` are not yet configured; until then the endpoints intentionally return HTTP 503. No private-profile form is active.\n- The Worker deployment and CI syntax check for this commit must be verified before treating the code as live. End-to-end encryption/storage round-trip tests are still required.
- No payment processor, card vault, Apple Pay/Google Pay checkout, NFC Terminal, subscriptions or entitlement webhook is active.
- No Meta/TikTok OAuth tokens are stored yet.