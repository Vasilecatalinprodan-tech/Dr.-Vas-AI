# Dr.Vas AI — Parallel development roadmap

Updated: 2026-11-05  
Repository: `Vasilecatalinprodan-tech/Dr.-Vas-AI`  
Continuation branch: `universal-chat-attachments`

## Operating model

Build one integrated Dr.Vas platform with a shared account, authentication, profile, language, conversation history, project storage, permissions and design system. The six established core modules remain the main navigation:

- Dr.Vas Free — free general assistant.
- Dr.Vas Health — free general health education; not a clinician or diagnostic service.
- Dr.Vas Studio — paid creative production.
- Dr.Vas Academy — paid entrepreneurship education.
- Dr.Vas Commerce — paid e-commerce and dropshipping learning/tools.
- Dr.Vas Business — paid business planning and operations support.

Specialist destinations are workspaces under these modules, not automatically separate top-level modules.

## Workstreams and deliverables

| Workstream | Initial deliverable | Later stages | Guardrails |
|---|---|---|---|
| Platform foundation | Reliable auth, profile, history, session restore, language, permissions and responsive UI | Audit dashboard, usage, account controls, deletion/export | Server-side authorization; protect personal data |
| Voice & accessibility | Verified TTS, replay/stop, Android audio and accessible controls | Gemini Live, interruption, transcripts, reconnect, voice settings | Mic/audio opt-in; no silent recording |
| Studio: video & serials | Series bible, characters, episode drafts, scripts, storyboards, subtitles and production prompts | Render pipeline, media library, approvals, publishing integrations | Founder approves releases; official platform permissions |
| Studio: translation | Translation editor, glossary, revision history and export | Batch projects, subtitle/document localisation | Qualified review for medical/legal/high-stakes text |
| Studio: books | Book project, outline, chapter drafts, editing and export checklist | Layout, metadata, cover brief, publishing preparation | Rights, citations and publisher rules |
| Studio: music | Original lyric/song project, production brief and release checklist | Arrangement, multilingual adaptation, stems/assets workflow | Copyright and voice/likeness consent |
| Crypto & Mining | Research workspace and scenario calculators | Mining hardware/power/fee/difficulty sensitivity analysis; market education | Simulation only; no wallets, custody, trading or automatic investing |
| Online Income & Digital Products | Idea validation, customer profile, offer and unit-economics worksheet | Product creation, checkout/delivery plan, support and marketing | Show costs/risks; no guaranteed income |
| Academy | Course catalogue, lesson, exercise and progress model | Quizzes, certificates, instructor tools | Clear learning outcomes and source quality |
| Commerce | Product/supplier research and landed-cost/margin calculator | Order, returns, fulfilment and customer support workflows | Consumer law, truthful claims and supplier verification |
| Business | Business plan, cash-flow assumptions, operations checklist | CRM, workflow automation, customer journey/retention | No pretending to provide regulated legal/accounting advice |
| Health | Safe general education, escalation guidance and source transparency | Clinician-led workflows only after compliance review | No diagnosis; clinical workflows need qualified oversight |
| Commercial/release | Pricing/plan design and server-side entitlement model | Billing, receipts, support, store listing and release checks | Do not unlock paid modules before billing/security/legal checks |

## Shared workspace requirements

Every substantial workspace should eventually support:
1. Create project and name it.
2. Save draft automatically or on explicit save, with clear status.
3. Reopen and continue later.
4. Version history and restore/compare.
5. Attach source files and generated assets safely.
6. Export in appropriate formats.
7. Review checklist and founder approval before external publication or irreversible actions.
8. Usage/cost visibility where external APIs or paid services are involved.

## Implementation sequence

### Track A — Stabilise the product shell
- Confirm current source branch and compare other branches before any merge.
- Verify current Android Actions run and APK artifact.
- Install on Android and test login, chat, TTS, replay, stop, sign-out and resume.
- Establish repeatable JS/unit/E2E checks and CI commands.
- Audit auth, session restoration, history, profile, language, permissions, rate limits, audit logging and account deletion.
- Fix high-severity security and reliability findings before adding broad features.

### Track B — Build shared project storage
- Define project/workspace data model, ownership, access rules, status, versioning and file metadata.
- Design Supabase migrations and row-level security before UI writes.
- Add server validation, size/type limits and deletion/export controls.
- Keep private content out of operational logs.

### Track C — Studio creative workbenches
- Deliver translation, book and music project foundations.
- Extend the existing video/social Studio with series bible, episodes, review/approval and publishing log.
- Add render/asset integrations only after provider pricing, licensing, privacy and security are reviewed.
- Never publish without founder approval.

### Track D — Research and business workbenches
- Crypto/Mining: transparent assumptions, historical/current source timestamps, electricity tariffs, hardware depreciation, network difficulty, pool fees and scenario sensitivity. No investment recommendations framed as certainty.
- Online Income: test demand, pricing, fees, taxes, returns, fulfilment and downside assumptions.
- Academy/Commerce/Business: structured curriculum, supplier/margin research, operational templates and dashboards.

### Track E — Health and launch readiness
- Keep Health educational until qualified clinicians, data protection, medical-device classification and applicable regulatory obligations are assessed.
- Implement subscription entitlements server-side before charging or unlocking paid modules.
- Prepare privacy policy, terms, data retention/deletion, support, accessibility and store compliance.
- Google Play publication follows successful device testing and release signing.

## Branch and release discipline

Known branches at the latest repository search:
- `drvas-account-deletion-hardening`
- `drvas-integrated-platform`
- `drvas-modules-long-input`
- `fix/session-restore-preserves-homepage`
- `founder-workbenches-development`
- `hotfix/ui-startup-failsafe`
- `main`
- `universal-chat-attachments`

Do not assume these are merged. Current continuation work is on `universal-chat-attachments`; inspect branch heads and diffs before integration. Never force-push or reset without explicit approval. Deploy production only after tests and explicit approval.

## Verification labels

Use these labels consistently in project notes:
- **Planned** — scope decided, not built.
- **Implemented** — code exists, not yet fully tested.
- **Tested** — a named test ran and passed.
- **Deployed** — deployed to a named environment.
- **Verified on device** — user-visible behaviour confirmed on a real device.

Do not claim that a planned workspace is implemented or that a successful APK compilation proves audio works.

## Current known blockers (2026-11-05)

- Latest Android workflow run/artifact on the continuation branch has not yet been confirmed.
- Audible server TTS on Android has not been confirmed.
- `package.json` has no npm scripts or test-runner dependencies, despite Playwright E2E specs existing; establish the intended runner/configuration.
- Current source branch and older branch histories need a deliberate integration review before merging any other feature branches.
- No verified billing/subscription implementation.
- No verified public TikTok/Meta publishing integration.
- Video rendering is not yet confirmed as implemented; Studio currently has script/planning capability.
- Crypto/Mining, Books, Music, Translation and Digital Product workspaces are roadmap scope, not completed product features.

## Session recordkeeping

After each meaningful change, append a dated session log with:
- files/paths changed and commit SHA;
- exact implementation and why;
- commands/tests run and their actual results;
- deployment/device verification, if any;
- remaining blockers and next concrete step.

Never include passwords, API keys, access tokens, private administrator email or sensitive user content. The ChatGPT conversation remains in ChatGPT history; repository logs are continuity summaries, not a verbatim export.
