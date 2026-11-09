# Dr.Vas — continuation archive: mining priority and parallel module work
Date: 2026-11-09
Repository: Vasilecatalinprodan-tech/Dr.-Vas-AI
Branch: feat/mining-hashrate-profitability-core-2026-11-09

## Founder instruction (verbatim)
> fii atent nu pot downloada apk de pe nici unul din lincuri nici arhiva nici direct....vezi care este problema si daca nu reusesti laso pe mai tarziu bine ca e actualizat si sa continuam....lucreaza la toate modulele simultan dar ce ma intereseaza cel mai tare este minatul...trebuie sa faci asta si dupa vb si altceva....salveaza tot inclusiv chatul

## Session decisions
- APK download is deferred after the founder reported that neither the ZIP nor direct APK sandbox link downloads. The files exist in the working session and the APK is a valid Android package, so this is not an APK compilation failure. The failure is likely in the sandbox-link delivery/client path; do not keep sending the same links or claim the founder received the APK.
- Keep the web platform as the active development target; Android/APK work remains later.
- Highest priority is Crypto & Mining, while the six core workspaces (Free, Health, Studio, Academy, Commerce, Business) continue as parallel workstreams.
- Crypto remains a founder/admin-only capability. Do not expose it as a public seventh module.
- No covert browser mining, no mining on visitors' devices, no hidden background CPU/GPU work, no wallet custody, no seed phrases/private keys, no trading or transfers.
- A genuine miner requires an explicitly authorised device, a signed native agent, authenticated pool/device adapters, secure device challenge, telemetry, power/thermal/runtime/energy limits, audit trail and a verified emergency stop. Do not represent the simulator as actual coin extraction.
- No paid service, API credits, account connection, or hardware purchase without the founder's explicit approval.

## APK investigation
- Recovered GitHub Actions Android build #325 artifact ID 13449567968 (build from 2026-11-05).
- Artifact ZIP downloaded and inspected; it contains app-debug.apk.
- APK path was verified in the model working session and identified as an Android package; ZIP and APK both exist, but the founder cannot download the sandbox links.
- This does not prove delivery to the user's device. Retry only at the final APK stage using a different supported delivery route; do not send the same failed sandbox links again.

## Existing Crypto foundation before this session
- Founder-only Crypto admin workspace with device registry, Bitcoin calculator, emergency-stop latch and PoW discovery list.
- Supported catalog currently includes BTC, BCH, LTC, DOGE, ETC, XMR, ZEC, DASH, KAS, RVN, DGB and XEC with declared algorithm/hardware compatibility.
- CoinGecko public market endpoint provides price discovery; filter is strictly price > USD 1. The catalog is intentionally bounded and does not claim to include every PoW asset.
- The original Bitcoin calculator uses manually entered BTC/day, GBP price, power/cooling, electricity, pool fee, downtime, maintenance, tax reserve and hardware cost.
- Real mining is not enabled.

## Work started in this session
- Created branch `feat/mining-hashrate-profitability-core-2026-11-09` from main.
- Added `calculateHashrateScenario()` to `www/crypto-engine.js`.
  - Computes miner/network hashrate share.
  - Estimates daily coin yield from block reward and blocks/day.
  - Deducts pool fee, energy cost, maintenance and uptime.
  - Validates non-finite/negative inputs, zero network rate, invalid block cadence, fee/uptime >100%, and miner hashrate greater than network hashrate.
- Added a visible hashrate scenario simulator to the founder-only Crypto panel in `www/index.html`.
  - All network/reward/price assumptions are explicitly user-entered.
  - Initial values are illustrative only, not live network facts.
  - Outputs estimated coin/day, network share, gross/day, electricity/day, net/day and net/30 days.
  - The simulator does not execute mining or access device resources.
- Added Playwright regression coverage for the expected coin yield, energy-adjusted net result and invalid hashrate input.
- Current branch commits at archive creation:
  - `06fcbb6a3d9ef43a6ec8fa5dea7fd8933f26e73e` — mining economics engine.
  - `396b464f2474441a6d01b2645b4c881a8207fcf8` — simulator UI.
  - `c161ab531651b486b9e38d33e2b5adc261b84778` — E2E regression test.

## Other open workstreams at this checkpoint
- PR #82 (Studio Book/Translation localization) remains open. Latest browser run 42644670118 failed: the seven-language Book/Translation E2E test exceeded 60 seconds. It is not ready to merge. Earlier assumptions that the timeout was in private module selection were incorrect; the log pinpoints test line 2866, the seven-language Book/Translation test.
- PR #83 (vertical WebGL DNA orientation) remains open. Latest browser run 42644738518 passed. The code rotates the existing Z-axis helix to a vertical on-screen axis while preserving the visual geometry and animation. Founder visual acceptance on desktop/mobile is still pending.
- Do not merge either PR until all required checks and review conditions pass.

## Parallel module roadmap
1. Free — stabilise per-conversation history, attachment upload/download/export, voice replay and sidebar workflows.
2. Health — maintain Free's chat shell; finish consent-scoped document handling, private attachment isolation, appointment preparation and clinical safety copy.
3. Studio — complete Book Studio manuscript structure, chapter persistence, revision history, translation glossary/format preservation and export; finish voice/presenter and rendering truthfulness.
4. Academy — persistent course/lesson/assessment projects, learner progress, feedback and clear academic-integrity controls.
5. Commerce — product research, supplier comparison, catalogue/project persistence, pricing/margins, fulfilment and tax/returns boundaries.
6. Business — plan, cashbook, multi-currency ledger, cashflow, break-even, VAT estimates and export with clear accounting limitations.
7. Crypto & Mining — prioritise network/hashrate profitability modelling, reliable live network adapters, authorised device enrolment, signed local agent architecture, telemetry, hard safety limits and verified stop.
8. Creator & Online Income — persistent opportunities, rights/AI-use checks, fees, deadlines and expected-vs-received income.
9. Security/infrastructure — auth/session isolation, RLS, rate limits, consent, audit, backups, migrations and production smoke tests.
10. Release — web production verification first; APK only after web work is ready; Play Store only after signed release and policy review.

## Continuity note
This archive records the founder's instruction and the engineering decisions/work completed in this session. It is not a literal export of the ChatGPT interface or every message. The original conversation remains in ChatGPT chat history; the repository archive is the durable project handoff.


## 2026-11-09 — continuation instruction and delivery timeout

Founder reiterated the working priorities:
- Keep all modules moving in parallel, but Crypto & Mining is the highest priority and should be advanced before moving to unrelated discussion.
- Preserve all progress and the conversation context.
- Do not keep spending time on APK link delivery now; previous APK and ZIP links both failed for the user, so defer delivery troubleshooting.

Work completed in this continuation:
- PR #84 mining simulator and live BTC data support merged.
- PR #87 improved expected BTC yield by deriving equivalent network hashrate from current difficulty; 3-day observed average remains visible as cross-check.
- PR #85 Studio localization merged; PR #86 vertical WebGL DNA orientation merged.
- Final main commit after mining correction: `2ef7d333cdca7afeb48cf014142554fe7a8399e8`.
- Browser regression #726 passed.
- Cloudflare Worker deployment #541 passed, including Supabase migration gates and production smoke test.
- Android APK build #369 passed, including checksum verification.
- Artifact `DrVas-APK` ID `13690709810`; SHA-256 `4bb6bbd90377a47ef49cb9f3676c6d9034e78cfde15cd68dc1939e83dcfe58b8`; expires 2026-12-09. Delivery/install remains unconfirmed and is deferred.

The founder reported a ChatGPT "Message delivery timed out" notice. This was a response-delivery timeout, not a project build/deploy failure. The completed work and this checkpoint are saved in the repository. The original ChatGPT conversation remains in history; this file is a structured summary, not a full UI transcript.

Next mining milestone: improve the profitability calculator to include electricity tariff, miner efficiency, pool fee, uptime, cooling/overhead, hardware cost, net daily/monthly profit, break-even BTC price and payback period. Show source/timestamp and stale-data states. Then proceed to safe native-agent support for explicitly selected user-owned hardware and OS. Never run mining in a browser or on visitors' devices, and never connect a wallet/pool or launch mining without explicit approval.

Parallel workstreams remain Free/auth/history/attachments, Health, Studio/voice/presenter, Academy, Commerce, Business, Crypto & Mining, Online Income/Digital Products, and subscriptions/Google Play. Preserve separate module projects/conversations and consistent localization.
