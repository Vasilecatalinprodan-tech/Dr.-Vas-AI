# Dr.Vas AI — Chat and development archive
Date: 9 November 2026 (UTC)
Repository: https://github.com/Vasilecatalinprodan-tech/Dr.-Vas-AI
Base: main after documentation PR #92 merge
Purpose: preserve the founder's instruction and verified work from the 23:47 continuation.

## Founder message in this conversation (verbatim)
> continua dezvoltarea in paralel la toate si salveaza tot inclusiv chatul

## Confirmed project baseline
- Default branch: `main`.
- PR #88 — Bitcoin mining hardware efficiency and payback — merged at `fe948d83daea32b43efe30e53113975c78f62c6e`.
- The BTC calculator includes hashrate, J/TH, cooling overhead, electricity, pool fee, uptime, maintenance, daily and 30-day net, break-even BTC price and payback.
- PR #91 — six-module mobile chat and voice regression — remains open and not merged.
- PR #92 — documentation-only continuity checkpoint — merged successfully at `f0ced00b171c88ece1b0fa7192e6e9f710a95601`.

## CI diagnosis and correction for PR #91
- PR #91 head before correction: `cdec506bacb078022696e1f7befd3e43d1ca2477`.
- Browser regression run `42698249062` completed with 151 tests passed and one failed.
- All preflight checks, Worker syntax checks and migration/deployment-order gates passed.
- The only failure was a Playwright strict-mode selector ambiguity: `.chat-file-button` matched both desktop and mobile labels, while the assertion expected one element.
- Corrected the assertion to use the visible responsive label: `.chat-file-button:visible`.first().
- Also corrected the layout measurement to select the visible attachment label rather than the first DOM match, preventing a hidden desktop label from reporting a false zero width.
- Latest PR #91 branch head after these fixes and documentation updates: `d6472ba7a22649cf594a845cb3e59b47538c3f89`.
- No passing rerun has been observed for that corrected head. Do not merge PR #91 or claim green tests until a new GitHub Actions run completes successfully.
- The latest correction commits were made through repository file updates; the available workflow-run query returned no new run for the corrected head. This remains a CI verification blocker, not evidence that the corrected test passed.

## Parallel development priorities
1. Crypto & Mining — continue the profitability simulator and improve verified network/market source freshness. Real mining remains disabled.
2. Free — preserve chat history, attachment access, conversation isolation and sidebar usability.
3. Health — preserve Free's shared chat shell and strict consent/privacy/safety boundaries.
4. Studio — books, translation, media/voice/presenter and saved project continuity.
5. Academy — course, lesson, assessment persistence and progress.
6. Commerce — product/supplier research, pricing, margins, fulfilment and compliance.
7. Business — business plans, cashbook, cashflow, break-even and export.
8. Creator & Online Income — rights-aware digital products and income tracking.
9. Security/infrastructure — authentication, RLS, rate limits, consent, audit and migration gates.
10. Release — verify web production before returning to APK delivery.

## Safety and release boundaries
- No mining on visitors' devices or in the browser; no covert CPU/GPU use.
- No wallet custody, seed phrases, private keys, withdrawals, transfers or live trading.
- Mining execution remains disabled pending authorised hardware, signed native agent, resource and thermal limits, telemetry, audit, emergency stop, security review and explicit approval.
- No paid service, API credit, hardware purchase, billing change, database/RLS change, or production access-policy change without the required explicit approval.
- APK delivery remains deferred because previous direct APK and ZIP links did not work for the founder. Do not repeat the same failed sandbox links.
- Live production page for visual review: https://dr--vas-ai.vasilecatalinprodan.workers.dev/ . Unmerged PR changes are not live.

## Conversation preservation note
This file preserves the founder's exact instruction above and the verified technical decisions, findings and actions from this continuation. It is a structured project archive, not a literal export of the entire ChatGPT UI transcript. The original conversation remains available in ChatGPT history.
