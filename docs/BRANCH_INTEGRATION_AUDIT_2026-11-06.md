# Dr.Vas AI — Repository-wide branch integration audit
Date: 2026-11-06 (UTC)
Repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`
Active integration branch: `drvas-integrated-platform`
Production branch: `main`

## Purpose and safety

The founder requested continued development across all branches, with all work and the conversation preserved, and with no new costs. This audit records all eight repository branches visible on 2026-11-06 and distinguishes features already present in the active integrated code from branch-only material that still needs deliberate review.

No branch was deleted, force-pushed, rebased, or overwritten. No automatic merge was attempted. No paid provider, paid rendering, new subscription, voice-credit purchase, or APK replacement was initiated.

## Branch inventory

| Branch | Snapshot head | Audit finding | Handling |
|---|---|---|---|
| `main` | `69c57c5eb1c8a3b1d4612ec572831a3ec072ee67` at inventory | Production branch aligned with integrated platform at audit start | Keep synchronized with tested integration |
| `drvas-integrated-platform` | `69c57c5eb1c8a3b1d4612ec572831a3ec072ee67` at inventory | Current working branch; includes the active six-module platform and current tests | Primary development line |
| `drvas-account-deletion-hardening` | `10860fb769760103a481d2a6eec7f4e455efc7c5` | Security/privacy specification branch; account-deletion work is documented, not implemented | Preserve specification; do not enable destructive deletion until retention, re-authentication, partial-failure and disposable-account tests are approved |
| `drvas-modules-long-input` | `fde2f15c7f103e336bce8898a31aace092a59ece` | Contains long-request, bounded-context, Crypto admin, advertising, entitlement and roadmap work | Long input and relevant Crypto/roadmap specifications are already present in active code/docs; inspect future branch-only changes selectively |
| `fix/session-restore-preserves-homepage` | `f30525bce92abea69a62650ca97955dce9bf61d8` | Session-restore homepage fix and CI browser-gate improvements | Current integrated HTML and workflow include the homepage/session behaviour and browser test gate; retain old branch as historical reference |
| `founder-workbenches-development` | `7fd8467da50a3555bb1b3e13443ee20dd9d5aa0c` | Founder workbenches, presentation, campaign planner, cashbook/cashflow, mining and customer-journey work | Current integrated platform already contains cashbook/cashflow and founder workbench UI; current E2E suite covers cashbook/cashflow and presentation flows |
| `hotfix/ui-startup-failsafe` | `770b9cf9835dc4c5021859408eeeefa1a4ebf906` | Startup fail-open correction | The current integrated HTML contains the runtime error fallback and public interface reveal behaviour; keep historical hotfix branch |
| `universal-chat-attachments` | `046e41feeca01414af2a348d154be57812be6913` | Universal private attachments, Studio scene timeline, voice/Android fixes and parallel-work audit | Current integrated branch contains the attachment migration, Worker attachment processing, uploader and browser tests; current Android voice changes remain subject to real-device testing |

## Divergence snapshot

At the time of comparison, using the integrated branch as the base, the older feature branches had diverged histories. The comparison counts are historical commit counts, not a claim that every commit is a missing feature:

- `drvas-account-deletion-hardening`: ahead 2 / behind 542
- `drvas-modules-long-input`: ahead 26 / behind 542
- `fix/session-restore-preserves-homepage`: ahead 12 / behind 539
- `founder-workbenches-development`: ahead 58 / behind 181
- `hotfix/ui-startup-failsafe`: ahead 2 / behind 542
- `universal-chat-attachments`: ahead 151 / behind 178

There were no open pull requests for this repository at the time of the audit. A large number of commits behind does not mean a branch is safe to merge wholesale; it means its unique work must be reviewed and selectively ported.

## Verified feature presence in the active integrated line

- Long-form chat input: frontend `#question` and Worker enforce a 100,000-character ceiling; a browser regression test checks the documented limit.
- Account/session continuity: active platform includes per-account remembered module/conversation behaviour and the CI browser suite.
- Founder workbenches: cashbook, monthly cashflow report, campaign planning and other founder tools are present; cashbook/cashflow browser tests are in the active suite.
- Attachments: `supabase/migrations/202611050001_chat_attachments.sql` is present; Worker has attachment handling; browser tests cover private image/document selection and Health-specific consent.
- Startup failsafe: active HTML has a runtime error handler that removes the hidden startup state and displays a limited-functionality status.
- Academy/Commerce/Business project persistence: active tests cover private creation and round-trip reopen, and now also test update/delete/export behaviour.

## Explicitly not considered complete

- Account deletion is not implemented merely because the specification exists. It remains a release-gated feature.
- Supabase live RLS, storage-policy and two-account isolation checks have not been independently verified in this environment.
- Physical Samsung S24 audio playback still requires the user's device test.
- Paid Jan/Sarah voice profiles and paid Studio rendering are excluded from this zero-cost development phase.
- The current chat archive is a structured development checkpoint, not a verbatim export of all ChatGPT history.

## Safe branch policy going forward

1. Develop on `drvas-integrated-platform`.
2. Run the browser/JavaScript/deployment workflow before advancing `main`.
3. Fast-forward `main` only after the relevant workflow passes.
4. Keep legacy feature branches intact as recovery/reference points.
5. Port any newly discovered branch-only code through focused changes and tests; never force-sync a divergent branch to the current head.
6. Update this audit, project status, development log, handoff and dated chat archive after each material integration.
