# Dr.Vas account deletion and security hardening

Status: engineering specification; no destructive account-deletion code is enabled by this document.

## Verified repository state

Reviewed on 2026-11-03 from branch `drvas-integrated-platform`.

- Frontend: `www/index.html`.
- Backend: `worker/index.js`.
- Privacy document: `www/privacy-policy.html`.
- Supabase authentication is used by the frontend.
- The Worker validates user access tokens against Supabase Auth `/auth/v1/user` and uses the server-side `SUPABASE_KEY` for privileged REST operations.
- No account-deletion action/route was found in the reviewed Worker or frontend.
- A conversation-history deletion action exists, but it is not equivalent to deleting the account.
- Supabase Storage bucket query returned no rows at the time of inspection.
- All 11 inventoried public tables have RLS enabled; `force_rls` is false.
- The owner applied a Supabase SQL permission hardening change revoking `TRUNCATE`, `REFERENCES`, and `TRIGGER` from `anon` and `authenticated`. A follow-up query returned no matching grants.
- Worker CORS currently returns `Access-Control-Allow-Origin: *`; this needs a separate, deployment-aware allowlist change. Do not guess production/dev origins or silently break Codespaces.

## Data inventory relevant to account deletion

| Table | User association | Deletion treatment |
|---|---|---|
| `chat_messages` | `user_id` | Delete rows for the verified user |
| `drvas_conversation_metadata` | `user_id` | Delete rows for the verified user |
| `drvas_income_opportunities` | `user_id` | Delete rows for the verified user |
| `drvas_studio_projects` | `user_id` | Delete rows for the verified user |
| `drvas_private_profiles` | `user_id` | Delete encrypted profile row(s) |
| `user_memories` | `user_id` | Delete rows for the verified user |
| `profiles` | `id` | Delete profile row for the verified user |
| `drvas_crypto_devices` | `requested_by`, `approved_by` | Revoke/delete device rows associated with the user; handle both columns |
| `drvas_privacy_consents` | `user_id` | Apply an approved retention rule; do not blindly erase evidence needed to demonstrate lawful consent |
| `drvas_audit_logs` | `user_id` nullable | Apply an approved retention/anonymisation rule; avoid retaining a direct identifier without a documented need |
| `drvas_founder_provenance` | `created_by` nullable | Preserve project-origin evidence; assess whether a founder user identifier can be nulled/pseudonymised without invalidating the record |

There are no declared foreign keys in the inspected public schema. Cleanup must therefore explicitly address every table and be maintained when new user-linked tables are added.

## Required deletion endpoint design

Implement as a dedicated Worker action, for example `account_delete`.

1. Require a valid Supabase access token and verify it server-side with `/auth/v1/user`.
2. Derive the target user ID exclusively from the verified Auth response. Never accept a client-supplied user ID as the deletion target.
3. Require an explicit confirmation flag and a fresh-authentication/recent-login check before irreversible deletion. Do not rely on a checkbox alone for a high-impact action.
4. Use the server-only Supabase service key; never send it to the browser or include it in responses/logs.
5. Delete user-owned records using the verified ID and explicit per-table filters. Include both `requested_by` and `approved_by` associations for crypto devices.
6. Apply the separately approved retention treatment for consent records, operational audit logs, and founder provenance. Do not silently erase legally required evidence or retain identifiable data without a documented purpose.
7. Delete any user-owned Storage objects if buckets are introduced in the future. The current bucket inventory was empty, but this must be rechecked at runtime or maintained as part of the schema review.
8. Delete the Supabase Auth user last through the Auth Admin API.
9. Handle partial failure safely. Return a clear incomplete status; never report success if any required deletion or Auth deletion failed. Make retries idempotent and record only the minimum non-identifying operational state needed to recover.
10. Return `Cache-Control: no-store`; do not include personal data in the response.

## Frontend requirements

- Add a clearly labelled “Delete account” action in authenticated account/settings UI.
- Explain what is deleted, any narrow legal-retention exceptions, and that the action is irreversible.
- Require explicit confirmation and recent re-authentication.
- On confirmed success, clear local app state and sign out; do not leave cached conversations visible.
- Provide a public account-deletion request page/URL suitable for app-store listing requirements when account creation is supported.
- Keep “delete conversation history” separate from “delete account”.

## Security follow-up

- Replace wildcard CORS with a configurable allowlist after verifying all real production and development origins. Ensure preflight and normal responses use the same origin decision and add `Vary: Origin`.
- Review grants and RLS policies whenever a new table is introduced. RLS does not protect against table-level `TRUNCATE` privileges; keep those revoked from client roles.
- Keep service-role credentials only in Cloudflare secrets.
- Review Storage policies as soon as a bucket is created.
- Add tests for unauthenticated requests, invalid/expired tokens, user A attempting to delete user B, partial REST failures, retry behaviour, and a successful deletion using a dedicated test account.

## Release gate

Do not deploy or merge an account-deletion implementation until:
- retention decisions for consent, audit, and founder-provenance records are approved;
- all table and Storage associations are inventoried;
- Worker tests pass;
- frontend confirmation and re-authentication flow is tested;
- deletion is validated using a disposable test account;
- the public deletion URL and privacy notice are ready.

This document is an engineering plan, not legal advice and not proof that deletion is already implemented.


## Additional release-readiness findings

### Privacy notice review

The current `www/privacy-policy.html` is explicitly labelled a working draft and correctly warns that it is not yet legally approved. Before public release it still needs:
- the controller's full legal identity and a working privacy contact address;
- a documented purpose, lawful basis, and retention period for each category of processing;
- a clear account-deletion process and the specific narrow exceptions/retention periods;
- confirmed processor/subprocessor details and UK/EEA international-transfer safeguards;
- a documented Article 9 condition and appropriate safeguards before processing identifiable health data at scale;
- confirmation that the described voice, memory, encryption, analytics, and AI-provider behaviour exactly matches production.

Do not replace these gaps with invented company details or generic promises. The privacy notice must describe the deployed product, not planned features.

### iOS build readiness

The inspected `package.json` contains `@capacitor/core`, `@capacitor/android`, and `@capacitor/cli`, but does not currently list `@capacitor/ios`. The inspected `capacitor.config.json` defines app ID `com.drvas.ai`, app name `Dr.Vas AI`, and web directory `www`. iOS packaging therefore remains a separate engineering task: add and sync the iOS platform in a controlled change, then build/sign/test with Xcode on macOS. Do not claim iPhone readiness from the Android APK or the web build.

### Current scope of this pull request

This pull request intentionally changes documentation only. It does not modify the live Worker, frontend, Supabase schema, permissions, Cloudflare deployment, Android package, or iOS package.
