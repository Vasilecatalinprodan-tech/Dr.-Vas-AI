> Carried forward from the historical PR #3 design branch on 5 November 2026. This is a product/engineering specification, not proof that the described feature is live. Any dated 'verified current state' section is a snapshot from the original audit and must be reconciled against the current main branch and live provider configuration before operational use.

# Dr.Vas Crypto — technical and safety specification

Updated: 3 November 2026
Status: early development; no mining, wallet custody, exchange execution or stock trading is enabled.

## Product intent

Dr.Vas Crypto is a hidden, administrator-only subsystem. It is not a public module and must not be discoverable by ordinary accounts. The intended business direction is:
- register and explicitly authorize administrator-owned or expressly authorized devices;
- later evaluate controlled cryptocurrency mining as a possible income source;
- monitor connected crypto accounts without taking custody of funds;
- research the possibility of allocating a defined portion of realised Crypto proceeds to stock-market investing, only after analysis and risk controls.

## Current code

- Supabase migration: `supabase/migrations/202611030003_crypto_device_registry.sql`.
- Table: `public.drvas_crypto_devices`.
- The table is protected by RLS and has no anon/authenticated grants; server-side service access is required.
- Stored data includes device name, platform, public-key fingerprint, public JWK, status and approval/revocation timestamps.
- Private keys, seed phrases, passwords and recovery phrases must never be stored.
- Worker actions: `crypto_devices_list` and `crypto_device_update`.
- Both actions verify the Supabase session and check the administrator email allowlist on the server.
- Admin UI permits authorizing pending/revoked devices and revoking authorized devices.
- State changes are sent to the audit log.
- Device approval is administrative authorization only. It is not proof of secure hardware and does not execute mining or transactions.

## Security requirements

1. Keep all Crypto endpoints inaccessible to ordinary users, even if a user manually crafts a request.
2. Verify administrator identity server-side on every request; never trust a frontend flag.
3. Enrol devices using a fresh server challenge signed by the device private key; verify the signature against its registered public key. A fingerprint alone is insufficient.
4. Store private keys on the device in the platform secure keystore where available. Never upload private key material.
5. Bind authorization to a specific device key and provide immediate revocation.
6. Add rate limits, replay protection, audit events and alerts for repeated failed challenges.
7. Require explicit owner consent before using CPU/GPU, electricity, network or storage.
8. Mining agent updates must be signed, versioned, auditable and independently reviewed. Include CPU/GPU caps, thermal limits, power schedules and emergency stop.
9. Display estimated electricity cost and net profitability; never describe gross mining rewards as profit.
10. For exchange connections, use read-only scopes first. If execution is ever approved, use isolated keys with withdrawals disabled and strict limits.
11. Never request or store seed phrases or withdrawal-enabled API credentials.
12. Keep trading disabled until paper-trading results, risk policy, legal review and explicit founder approval are complete.

## Financial-operation stages

- Stage A: inventory, authorization, audit and security testing.
- Stage B: mining profitability estimator only; no remote execution.
- Stage C: optional mining agent after device-owner consent, security review and electricity-cost controls.
- Stage D: read-only exchange/account connections.
- Stage E: market research and paper trading only.
- Stage F: any live orders require separate explicit approval, a fixed segregated budget, maximum position sizing, daily loss cap, withdrawal prohibition, monitoring and a global kill switch.

## Compliance questions before launch

Obtain specialist advice on applicable UK and other relevant rules for crypto mining, tax/accounting treatment, financial promotions, investment activity, exchange terms, data protection, consumer protection and app-store distribution. Do not represent the system as a regulated financial adviser or guarantee returns.

## Acceptance tests required

- Non-admin cannot list, authorize, revoke, enrol or query device records.
- Admin can list devices, authorize a pending device and revoke an authorized device.
- Invalid UUID, invalid status, missing token and expired token are rejected.
- Revocation prevents any future device authentication once device challenge verification is implemented.
- Every state change creates an audit event.
- No endpoint can initiate mining, wallet transfer, exchange withdrawal or live trade in the current phase.
- Crypto UI is absent from all ordinary-user views and only rendered inside the administrator panel.
