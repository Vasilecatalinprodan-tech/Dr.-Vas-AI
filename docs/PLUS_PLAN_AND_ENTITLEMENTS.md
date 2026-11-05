> Carried forward from the historical PR #3 design branch on 5 November 2026. This is a product/engineering specification, not proof that the described feature is live. Any dated 'verified current state' section is a snapshot from the original audit and must be reconciled against the current main branch and live provider configuration before operational use.

# Dr.Vas Free and Plus — plan and entitlement design

Updated: 3 November 2026
Status: product specification; no public billing or subscription entitlement system is implemented yet.

## Product principle

Dr.Vas should remain useful on the free tier. Plus should sell meaningful additional capability, convenience and capacity—not artificially cripple basic chat. Never advertise literally infinite AI usage: model providers impose context, throughput, availability and cost constraints.

## Proposed plans

### Dr.Vas Free

- General assistant and normal conversation.
- Core conversation history and resume.
- Basic voice features where technically available.
- Health general-information workspace with safety boundaries.
- Basic access to learning and business education content.
- Transparent fair-use protection and service availability messaging.
- No arbitrary 1,000-word limit; long inputs supported within published technical limits.

### Dr.Vas Plus

- Higher fair-use request and token allowance, with clear monthly/rolling limits.
- Priority routing to stronger/faster models when available.
- Longer context window and improved continuity for ongoing projects.
- Larger file/document handling when upload and extraction features are implemented.
- Expanded Studio tools for long manuscripts, translation batches, scripts and production planning.
- Saved project workspaces, versions, export formats and reusable templates.
- Advanced Academy learning paths and progress tracking.
- More capable Commerce research and Business planning tools.
- Faster queue/priority availability where provider capacity supports it.
- Clear usage dashboard showing allowance, reset date and current plan.

### Future specialist/business tiers (not part of initial Plus launch)

- **Studio Pro:** team projects, larger creative workflows, production hand-off and commercial asset management.
- **Business:** multi-user workspace, roles, shared templates, organisation billing and audit controls.
- **Health Professional / Clinic:** only after clinical, regulatory, privacy, security and contractual review. Not simply an upgraded consumer medical chatbot.

## Entitlement model

Every user has one server-verified entitlement record, independent of frontend visibility.

Suggested entitlement fields:
- `user_id`
- `plan_code` (free, plus, studio_pro, business)
- `status` (trialing, active, past_due, canceled, expired)
- `billing_provider`
- `provider_customer_id`
- `provider_subscription_id`
- `current_period_start`
- `current_period_end`
- `cancel_at_period_end`
- `created_at`, `updated_at`

Never trust a plan code or `isPremium` boolean sent by the browser. Worker must look up entitlements server-side and fail closed for paid features if the entitlement service is unavailable. Webhook signatures must be verified and webhook handling must be idempotent.

## Usage metering

Track usage by user, module, model, request and billing period. Store only what is necessary:
- request count;
- input/output token counts when provider supplies them;
- model identifier;
- module;
- timestamp and status;
- estimated cost in internal billing telemetry.

Do not log full prompts or private answers in billing telemetry. Define separate fair-use thresholds for Free and Plus after measuring actual provider cost and latency. Warn users before a limit is reached, explain reset timing, and offer upgrade or retry options without silently discarding content.

## Model routing

- Free: cost-efficient model with graceful fallback.
- Plus: stronger model routing and larger context where available.
- Health: safety instructions apply regardless of plan; Plus must never weaken medical safeguards.
- Studio: select model by task type and length; keep creative continuity and output-quality settings.
- Provider model names, quotas and prices must be verified against current provider documentation before configuration.
- Model failure or rate limiting should return a clear retry/queue message; do not silently claim a premium model was used if fallback occurred.

## Billing decisions still required

Before implementation, select payment provider(s), supported countries/currencies, monthly/annual price points, tax/VAT handling, free trial policy, cancellation/refund rules and consumer disclosures. Do not hardcode speculative prices into the UI.

## Launch sequence

1. Decide plan names and included features.
2. Measure provider costs and define sustainable allowance limits.
3. Select billing provider and complete merchant/compliance setup.
4. Implement subscription webhook receiver and server-side entitlement storage.
5. Add Worker entitlement checks and usage metering.
6. Add user billing/usage page, upgrade, cancellation and support routes.
7. Test purchase, renewal, failed payment, cancellation, refund, webhook replay and access expiry.
8. Publish accurate pricing and terms; only then unlock paid access for customers.

## Current code reality

The Worker currently permits Studio, Academy, Commerce and Business only for configured administrator email addresses. This is a temporary development gate. It is not a subscription system and must not be presented as one. Free and Health have separate module instructions. No production checkout or verified paid entitlement flow has been confirmed.
