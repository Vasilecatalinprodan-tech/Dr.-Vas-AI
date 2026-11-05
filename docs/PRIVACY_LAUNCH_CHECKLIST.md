> Carried forward from the historical PR #3 design branch on 5 November 2026. This is a product/engineering specification, not proof that the described feature is live. Any dated 'verified current state' section is a snapshot from the original audit and must be reconciled against the current main branch and live provider configuration before operational use.

# Dr.Vas privacy and legal launch checklist

Updated: 3 November 2026
Status: pre-launch register. The public-facing privacy page is a working draft, not a final approved policy.

## What the current draft says

The current `www/privacy-policy.html` identifies Supabase, Cloudflare and Google Gemini as service providers; describes account, profile, chat, memory, technical and voice data; says private chats are not used to train a Dr.Vas model; and describes Health as general information rather than a substitute for clinicians.

The draft itself correctly warns that operator contact details, retention periods, legal bases and health-data safeguards remain to be confirmed. Do not remove this warning until the facts have been verified.

## Information required from the operator before publication

- Full legal name of the data controller (individual or legal entity).
- Country of establishment and appropriate postal contact address.
- Dedicated privacy contact email.
- Whether a Data Protection Officer is legally required; do not invent a DPO.
- Countries in which the service is offered and intended user age policy.
- Accurate list of live features and whether voice/audio is enabled in production.
- Accurate list of data fields actually collected by the production build.

## Processing register to complete

For each data category, record purpose, lawful basis, retention, recipients, access controls and deletion route.

- Account identifiers and authentication data.
- Profile and optional professional profile data.
- Chat messages, conversation metadata and user memories.
- Health-related information that users may choose to enter.
- Voice input, transcripts and any audio retained by the client or provider.
- Security, diagnostic and audit logs.
- Payment, subscription and billing data once introduced.
- Studio project files and generated outputs once file storage/export is introduced.

## UK GDPR / EU GDPR decisions requiring qualified review

- Identify and document an Article 6 lawful basis for each processing purpose.
- Health information may be special-category data. Identify the applicable Article 9 condition and any required Data Protection Act 2018 condition/safeguards before enabling public Health processing. Do not assume that a generic consent checkbox solves every issue.
- Assess whether a Data Protection Impact Assessment is required, particularly for health data, profiling, children or any high-risk processing.
- Determine controller/processor roles and put appropriate data processing agreements in place.
- Confirm international transfer mechanisms for UK and EEA data, including adequacy decisions, UK IDTA/Addendum or EU SCCs as applicable.
- Confirm provider retention, model-training settings, abuse monitoring and data location against current contractual terms.
- Set retention periods by category, including audit records, backups, failed deletion jobs and billing records.
- Define rights request handling, identity verification, response deadlines and escalation.
- Define breach detection, assessment, notification and incident response.
- Confirm cookie/local-storage use and whether consent is required for any non-essential technologies.
- If subscriptions are added, document payment provider, billing data, cancellation, refunds and tax records.
- If the service is offered to children or used in schools, perform a separate child-safety/privacy review before enabling access.

## Security and product checks

- Complete the account deletion flow described in `ACCOUNT_DELETION_AND_SECURITY_HARDENING.md`.
- Recheck RLS policies, grants, foreign keys and Storage inventory after schema changes.
- Replace wildcard CORS with an explicit allowlist after recording real production and development origins.
- Confirm API keys and service-role secrets exist only in server-side secret storage.
- Verify that application logs do not contain message content, health data, credentials or tokens.
- Ensure user-facing privacy text matches the actual deployed product and each provider's current settings.
- Publish a public privacy policy URL and an account/data deletion request URL before app-store submission.
- Keep version history and record when users accepted material policy changes.

## Items that cannot be completed by repository edits alone

The founder/operator must supply or confirm the controller identity, contact details, business establishment, actual retention choices and operational practices. A qualified UK/EU privacy professional should review the completed policy and Health data processing before public launch.

## Release status

- [ ] Controller identity and contact details confirmed.
- [ ] Processing purposes and Article 6 bases documented.
- [ ] Health Article 9 condition and safeguards reviewed.
- [ ] DPIA screening completed; DPIA completed if required.
- [ ] Provider DPAs and international transfers checked.
- [ ] Retention schedule approved and implemented.
- [ ] Account deletion implemented and tested.
- [ ] CORS allowlist configured and tested.
- [ ] Privacy policy reconciled with production behaviour.
- [ ] Public privacy and deletion URLs tested.
- [ ] App-store privacy declarations reconciled with actual SDKs and data flows.

This checklist is operational guidance, not legal advice or a declaration of compliance.
