# Dr.Vas session checkpoint — database isolation regression tests

Date: 2026-11-05
Repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`
Branch: `drvas-integrated-platform`

## Work completed in this session

Added `tests/e2e/data-isolation-migrations.spec.cjs` to guard the source-level database and storage isolation rules used by the platform.

The regression suite checks:

1. Academy, Commerce and Business saved project drafts:
   - Row Level Security is enabled.
   - `public` and `anon` have no table privileges.
   - SELECT, INSERT, UPDATE and DELETE policies bind records to `auth.uid() = user_id`.
   - The module allow-list remains limited to Academy, Commerce and Business.

2. Business cashbook:
   - The same owner-only RLS and privilege boundaries remain present.
   - Amounts must be positive and stored with two decimal places.
   - Currency is restricted to GBP, EUR, RON, CHF and USD.
   - VAT rate remains constrained to 0–100.

3. Studio render jobs and media storage:
   - Render-job rows remain owner-scoped with RLS and no public/anonymous table access.
   - The `drvas-media` bucket remains private.
   - Storage SELECT, INSERT, UPDATE and DELETE policies scope the first storage path folder to the authenticated user's ID.

## Git commits and CI

- Initial test-file commit: `dabd5086b1d8f97d32390dd58b4cdcb79e8993b9`. Its first regex escaping needed correction; a follow-up commit replaced those assertions with properly escaped patterns.
- Corrected test-file commit: `f1a23b81c02c289aeefa13a1d8744e690d51abe4`.
- Corrected commit's GitHub Actions run: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI/actions/runs/42107699723
- At checkpoint time, the corrected workflow was queued/pending. Do not claim these new tests passed until this run completes successfully.
- The previous successful web workflow remains #444 (53 tests passed) for commit `346b3e56c6cb5f01d100235517f2d3a2fd3b44df`.

## Important limitation

These are static regression checks against the migration source files. They help prevent accidental removal or weakening of owner-only policies, but they do not connect to the live Supabase project and do not prove that migrations have been applied or that production RLS is active. Live database verification remains a separate release gate.

## Conversation continuity

This checkpoint preserves technical work and decisions, not a verbatim transcript. The original conversation remains in ChatGPT chat history. Continue from the latest production branch and confirm the pending CI run before recording a passing test count.
