# Dr.Vas Business Desk — product specification and staged build

**Date:** 4 November 2026  
**Status:** MVP interface and first bookkeeping/assessment workflows implemented; production verification pending.

## Product direction

Dr.Vas Business is one integrated workspace for small businesses, students and operators. The initial toolset is:

1. Business Plan Builder — structured business plans, budgets, cash flow, break-even and implementation plans.
2. Dr.Vas Books — private income/expense cashbook, categories, multi-currency separation, VAT estimate and CSV export.
3. Student Desk — formative assessment support, rubric-based feedback, structure, argumentation, referencing checks and revision plans.
4. Next stages — double-entry accounting, invoices, recurring transactions, bank import/reconciliation, financial reports and professional review workflows.

## Implemented in the repository

- Added a Dr.Vas Books UI to the Business workspace.
- Added user-owned transaction storage migration: `supabase/migrations/202611040003_business_cashbook.sql`.
- Cashbook fields: date, income/expense, description, category, amount, currency, VAT rate and whether VAT is included in the entered amount.
- Cashbook totals: receipts, expenses, net cash position and estimated net VAT for the selected currency.
- Added CSV export and per-entry delete.
- Currency totals are separated; GBP, EUR, RON, CHF and USD are not mixed into one total.
- RLS policies bind every transaction to `auth.uid() = user_id`; public and anonymous access is revoked.
- Added Dr.Vas Student Desk with assignment brief, rubric and student draft inputs.
- Student Desk generates a structured formative-feedback prompt, not a fabricated final submission. It asks for evidence-based feedback, citation checks without invented sources, revision questions and a prioritised improvement plan.
- Added private project save/open/delete using the existing `drvas_module_projects` table and the `business` module.
- Clears Student Desk private draft fields and local cashbook rows on logout/account switch.
- Added E2E coverage for Business workspace visibility, VAT calculations and Student Desk prompt generation.
- Added CI checks for cashbook RLS and required frontend functions.

## Database action required before cashbook persistence works

Apply this migration once in the Supabase SQL Editor:

`supabase/migrations/202611040003_business_cashbook.sql`

The migration is safe to re-run. Do not disable RLS or grant public/anonymous access. Until applied, the UI should report that the cashbook table is not active; the Business Plan Builder and Student Desk project storage continue to use the existing module-project table.

## Important accounting scope

This first version is a cashbook and management aid, not a statutory double-entry accounting package, tax return, VAT return, payroll system or audit product. VAT figures are estimates based on the rate and input convention entered by the user. They do not decide whether a transaction is taxable, recoverable or subject to a special scheme.

Before selling accounting functionality, add:
- Double-entry ledger with immutable journal entries, balanced debits/credits and controlled corrections.
- Chart of accounts by country and accounting framework.
- Invoices/credit notes with legally required fields and numbering controls.
- Bank import with consent, reconciliation and duplicate detection.
- VAT/tax rules versioned by jurisdiction and effective date; no silent hard-coded assumptions.
- Period close, audit trail, permissions, exports and accountant review.
- Formal security, data protection, backup/restore and independent accounting-domain review.

For UK statutory accounts, tax returns, payroll or Making Tax Digital integrations, verify current HMRC requirements and approved-provider rules with a qualified accountant or specialist before release. Other countries require separate localisation and professional review.

## Student Desk integrity and safeguarding

- The product is a learning, assessment and feedback aid.
- It can explain criteria, identify gaps, review student-authored drafts, teach citation methods and provide revision exercises.
- It must not claim official grades or invent references, research findings, fieldwork or personal experience.
- It must not promise to evade AI detectors, disguise AI authorship or generate a deceptive submission.
- Institutional policies on AI assistance, disclosure, academic integrity, privacy and student data must be configurable and visible.
- For minors, minimise data, avoid collecting personal identifiers and include appropriate safeguarding and consent controls.

## Studio target for the next 1–2 days

The Studio should first deliver a complete, reviewable production package:
- Original concept, script and scene continuity sheet.
- Shot-by-shot storyboard with camera, duration, lighting, sound and dialogue.
- Generated still/character/location assets where available and permitted.
- Narration text, subtitle file, caption, title, description and hashtags.
- Export-ready vertical 9:16 scene plan with safe areas.
- Visible `MADE BY VPC` brand mark in the actual rendered output, not only in a prompt.
- Final media saved to Dr.Vas-controlled storage, with status and failure handling.

### Current provider constraint

The currently connected Runway workspace reports 500 plan credits, 0 purchased credits, available image models, but **no available video, speech, music or sound-effect models**. Video generation and editing are therefore gated in this workspace at this time. Do not claim a Runway video renderer is active. Before enabling a paid provider, compare commercial rights, credit costs, retention, output quality, API support and whether completed media can be copied to Dr.Vas-owned storage.

A real MP4 renderer requires a configured provider or a tested in-browser/server-side rendering pipeline. Until then, the Studio may create scripts, storyboards and production assets, but must not label those as an exported video.

## Release gates

1. Supabase migration applied successfully.
2. Authenticated save/load/delete tested against the real database with two separate accounts to verify isolation.
3. Cashbook totals independently checked with known examples, including VAT-inclusive and VAT-exclusive values.
4. CSV export verified with commas, quotes, Unicode and spreadsheet compatibility.
5. Student Desk tested with varied rubrics and no invented citations.
6. Desktop/mobile accessibility and keyboard tests passed.
7. Accounting domain expert reviews terminology, calculations and product boundaries.
8. Studio provider and media storage configured and tested before claiming MP4 generation.


## Phase 2 — real double-entry accounting architecture

The cashbook is only the first usable layer. The next accounting release must be built as a proper journal system rather than extending the cashbook with more columns.

### Core entities
- Organisations and memberships: one user may work for multiple businesses; every record belongs to an organisation, not just an individual login.
- Chart of accounts: country- and framework-specific account codes, account type, normal balance, tax mapping and effective dates.
- Accounting periods: open, closing, closed and locked states; period boundaries and timezone/currency settings.
- Journal entries: draft, posted and reversed states, source document, reference, posting date, created-by and approved-by.
- Journal lines: account, debit, credit, currency, tax code, contact and optional cost centre/project.
- Invoices and credit notes: sequential numbering, issue/due dates, supplier/customer details, line items, tax treatment, payment status and PDF output.
- Bank accounts and statement lines: consent-based import, matching, duplicate detection and reconciliation.
- Audit events: immutable record of create, update, approval, posting, reversal, export and period close.

### Accounting invariants
- A posted journal must balance: total debits equal total credits in the ledger currency.
- Posted entries are immutable. Corrections use a linked reversal and replacement journal; never silently rewrite posted financial history.
- Use decimal/fixed-precision arithmetic, not binary floating-point, for monetary posting.
- Never aggregate currencies without an explicit exchange rate, source, date and conversion policy.
- Tax codes and rates must be versioned by jurisdiction and effective date; never hard-code a single VAT assumption as universal.
- Enforce organisation membership and role permissions in the database, not only in frontend controls.
- Every export must preserve a traceable source and the accounting period it represents.

### Posting workflow
1. Create a draft journal or derive one from an invoice/expense.
2. Validate accounts, period, tax code, currency and required source documents.
3. Calculate totals with fixed precision and reject an unbalanced journal.
4. Apply approval rules where configured.
5. Post atomically through a database function/transaction; record audit event.
6. Reconcile bank/payment evidence and attach source records.
7. Close a period only after validation; reopen only with explicit privileged approval and audit event.

### Country launch order
Start with one country and one clearly scoped accounting framework (UK first if the product's initial market is UK). Have a qualified accountant review the chart of accounts, VAT logic, invoice requirements, year-end reports and HMRC integration before enabling statutory filing. Add EU/Romanian/Swiss localisations as separate reviewed packages rather than one generic global tax engine.

### Student Desk next phase
- Rubric builder with criterion weights and achievement descriptors.
- Feedback matrix linking each criterion to exact evidence in the student's draft.
- Draft version history and change comparison.
- Referencing helper that checks format and flags missing source details without inventing sources.
- Teacher mode for assignment creation, class-level progress and anonymised feedback; do not store identifiable student data without a lawful basis and appropriate institutional safeguards.
- Clear AI-assistance disclosure and configurable institution policy; no detector evasion or deceptive authorship claims.


## Business Planner calculator — 4 November 2026
- Added a live break-even calculator to the Business workspace.
- Inputs: fixed monthly costs, selling price per unit, variable cost per unit and expected monthly unit sales.
- Outputs: break-even units, break-even revenue, contribution-margin percentage and estimated monthly operating result.
- The assumptions are included in saved Business Plan project briefs. Currency follows the cashbook currency selector and is clearly labelled.
- The calculator rejects zero/negative prices and variable costs at or above selling price. It excludes tax, interest and any costs the user has not entered; it is an indicative planning tool, not a guaranteed forecast.
- E2E tests cover a known example: fixed costs 1,000; unit price 50; variable cost 25; expected units 50; break-even 40 units; break-even revenue 2,000; contribution margin 50%; estimated monthly result 250 (in the selected currency).
