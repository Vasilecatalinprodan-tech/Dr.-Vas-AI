> Carried forward from the historical PR #3 design branch on 5 November 2026. This is a product/engineering specification, not proof that the described feature is live. Any dated 'verified current state' section is a snapshot from the original audit and must be reconciled against the current main branch and live provider configuration before operational use.

# Account deletion and security hardening

Updated: 3 November 2026
Status: engineering specification; implementation and end-to-end tests remain outstanding.

## Verified current state

- The Worker verifies the supplied Supabase access token by calling Supabase Auth `/auth/v1/user` and derives the user ID from that verified response.
- The Worker uses the server-side Supabase key for privileged server operations. It must never be exposed in browser code.
- The reviewed Worker and frontend did not contain a complete account deletion endpoint or user-facing account deletion flow.
- A conversation-history deletion action exists. It deletes chat-message rows and is not account deletion.
- Eleven public tables were inventoried and RLS was enabled on all eleven at the time of the audit. `force_rls` was false.
- A privilege audit found excess `TRUNCATE`, `REFERENCES`, and `TRIGGER` grants to `anon` and `authenticated`. The user applied a revoke statement and verified that the follow-up query returned no rows.
- The Supabase Storage bucket query returned no rows at the time checked.
- The reviewed Worker CORS response used wildcard origin. A production allowlist is still required; exact production, preview and local origins must be identified before changing it.
- No foreign-key relationships were returned for the inventoried tables. Deletion therefore cannot assume cascading foreign keys.

## Inventoried user-associated data

| Table | User association / deletion consideration |
|---|---|
| `chat_messages` | `user_id`; delete user-owned conversation messages |
| `drvas_conversation_metadata` | `user_id`; delete conversation metadata |
| `drvas_income_opportunities` | `user_id`; delete user-owned records |
| `drvas_studio_projects` | `user_id`; delete user-owned projects |
| `user_memories` | `user_id`; delete personal memory records |
| `profiles` | `id`; delete profile row |
| `drvas_private_profiles` | `user_id`; delete encrypted private profile |
| `drvas_crypto_devices` | handle both `requested_by` and `approved_by`; revoke/delete associations according to device-security policy |
| `drvas_privacy_consents` | retention/de-identification decision required; do not blindly erase legally required evidence |
| `drvas_audit_logs` | retention/minimisation decision required; remove or de-identify personal linkage when lawful and appropriate |
| `drvas_founder_provenance` | project-origin evidence, not ordinary user content; preserve only if it contains no unnecessary personal user data |

No Storage buckets were returned during the audit. Re-inventory Storage before launch and whenever uploads are introduced.

## Required account deletion flow

1. Frontend clearly distinguishes **delete conversation/history** from **delete account**.
2. Require a valid Supabase session and recent reauthentication. For sensitive or high-impact accounts, require a fresh password/OTP confirmation.
3. Require a clear, explicit confirmation that explains which content will be deleted and any narrow legal retention exceptions.
4. Worker verifies the access token through Supabase Auth and derives the target ID exclusively from the verified user response. Never accept a client-supplied target user ID.
5. Perform deletion using server-side credentials only. Keep credentials in Cloudflare secrets.
6. Delete user-owned rows from all inventoried tables using the verified ID. Handle both crypto-device user columns.
7. Apply documented retention/minimisation treatment to consent and audit records. Retained records must have a defined lawful purpose, restricted access and a retention period; pseudonymisation is not the same as anonymisation.
8. Delete any user-owned Storage objects if buckets exist at implementation time.
9. Delete the Supabase Auth user last, using the Auth Admin API.
10. Make the operation idempotent. A retry after partial failure must safely continue; do not return success if any required deletion step failed.
11. Return a minimal status without personal data; set `Cache-Control: no-store`.
12. Clear client-side session and cached personal state only after the server confirms completion. Provide a support/request route for cases that cannot be completed automatically.

## Implementation safeguards

- Do not trust user IDs, email addresses, role names or ownership identifiers supplied in the request body.
- Do not log message content, access tokens, passwords or private profile values.
- Use explicit table allowlists and fixed filters; never accept a table name or arbitrary SQL from the client.
- Consider a deletion job/state record that contains the minimum necessary data and expires after completion.
- Ensure partial failure is visible to support/admin and can be safely retried.
- Review backups and provider retention separately; do not promise instant removal from immutable backups.
- Keep founder provenance records separate from user-generated content.
- Recheck RLS, grants, Storage and foreign keys after schema changes.

## Test plan before release

- Missing token, invalid token and expired token.
- User A cannot delete user B by altering request fields.
- A normal user cannot invoke admin-only routes.
- All user-owned rows are removed, including private profile, memory, metadata, projects and income opportunities.
- Crypto-device associations are handled for both requester and approver.
- Retained consent/audit records follow the approved retention policy.
- Storage objects are deleted when applicable.
- Simulated failure at every deletion stage; response must not falsely claim success.
- Retry after partial completion succeeds safely.
- Auth account is removed only after data deletion steps complete.
- Disposable test account end-to-end test, including sign-out and inability to sign back in.

## Release gate

Do not advertise account deletion as implemented until the endpoint, UI, reauthentication, public request route, retention decisions and all tests above have been completed. This document is an engineering specification, not evidence that deletion currently works.
