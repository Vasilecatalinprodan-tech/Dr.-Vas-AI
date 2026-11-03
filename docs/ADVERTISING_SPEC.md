# Dr.Vas Advertising & Sponsorships

Updated: 3 November 2026
Status: approved for product design; no advertising is live and no provider is connected.

## Product objective

Create a sustainable, privacy-preserving revenue stream without degrading the assistant experience. Advertising is supplementary income, not a guaranteed revenue source.

## Initial formats

1. Direct sponsorship placements, visibly labelled "Sponsored" or "Parteneriat plătit".
2. Contextual placements relevant to a public workspace, selected from the workspace category only.
3. Disclosed partner/referral listings, with commercial relationships clearly explained.

Do not insert paid copy into AI answers or allow payment to influence neutral recommendations. Keep placements visually distinct from chat messages, medical information and generated content.

## Privacy and safety rules

- Never sell or disclose chat content, conversation history, uploaded files, private profiles or account identifiers to advertisers.
- Never target, segment or optimise ads using Health data, symptoms, diagnoses, inferred health status or other special-category personal data.
- Do not pass prompts, assistant responses or file contents to an ad network.
- Prefer contextual selection based on the currently open public workspace, without building a behavioural profile.
- Any non-essential cookies, device storage, tracking or profiling must be disabled until valid consent is obtained under applicable PECR/UK GDPR rules.
- Provide a clear way to withdraw consent and honour it across sessions.
- Maintain a vendor register, data-flow map, purpose/retention schedule and processor terms before integrating any provider.
- Provide frequency caps and an ad-free paid plan option if commercially viable.

## Admin controls required before launch

- Global advertising kill switch, default OFF.
- Per-workspace enable/disable controls.
- Approved advertiser and creative review workflow.
- Placement start/end dates, destination URL validation and clear sponsorship labels.
- Frequency caps and basic aggregate reporting.
- No user-level ad profiles or health-based targeting.
- Audit log for campaign creation, edits, activation and suspension.

## Rollout sequence

A. Build static placement components and admin-managed direct sponsorship records; keep all placements disabled by default.
B. Test layout, accessibility, mobile behaviour and separation from assistant output using clearly marked demo creatives.
C. Complete UK privacy/legal review, cookie-consent design, vendor due diligence and advertiser terms.
D. Run a small direct-sponsorship pilot only after explicit founder approval.
E. Consider a contextual ad provider only after reviewing its data flows, contract, consent requirements, content restrictions and app-store impact.

## Measurement

Initially measure only aggregate impressions, clicks, workspace, campaign and date where lawful. Do not log message text, health context, uploaded content or stable advertising identifiers. Assess fill rate, effective revenue per thousand impressions, consent rate, retention and user complaints before expanding.

## Acceptance criteria

- No ad is displayed unless the global and workspace flags are enabled.
- No ad appears inside or impersonates an assistant response.
- Health content and personal data are never passed to advertisers or used for targeting.
- Tracking remains off until valid consent is recorded.
- Admin can suspend all campaigns immediately.
- All paid placements are clearly labelled.
- Ordinary users can distinguish sponsorship from independent recommendations.
- Demo mode is visibly marked and cannot be mistaken for a live advertiser.

## Current decision

Design and preparation are approved. No advertising SDK, network, campaign, cookie tracker or payment integration has been installed or activated.