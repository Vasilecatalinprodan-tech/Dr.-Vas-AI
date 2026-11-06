# Dr.Vas — conversation and build archive
Date: 2026-11-06
Repository: Vasilecatalinprodan-tech/Dr.-Vas-AI
Branch: feature/crypto-engine-dna-interface-2026-11-06

## Latest founder instructions
The founder set the current stage priorities:
1. Develop a high-performance mining engine for Bitcoin and other mineable coins whose market price is above USD 1.
2. Finish all six integrated modules: Free, Health, Studio, Academy, Commerce and Business & Management.
3. Add a moving double DNA helix to the interface.
4. Add the red button with black borders previously requested.
5. Defer Android APK work until a later stage.
6. Preserve project progress and the conversation so no work is lost.

The founder's standing authorization from the prior conversation remains in effect: continue development, merge appropriate changes and deploy without routine confirmation. Do not start APK work during this stage. Pause only for real safety/legal risk, payments, personal credentials or actions requiring the founder's direct account access.

## Recovered prior Crypto requirements
- Dr.Vas Crypto is a hidden founder/admin-only workspace, not a seventh public module.
- Existing implementation includes server-side admin checks, a device registry and Bitcoin profitability calculator.
- The calculator already covers BTC/day, GBP price, miner/cooling watts, electricity tariff, pool fee, downtime, maintenance, tax reserve, daily/monthly/annual results, break-even BTC price, maximum electricity tariff, monthly kWh, annual energy cost, heat load and JSON report export.
- Existing device registry is administrative approval only; it does not prove secure device possession or execute mining.
- No mining, wallet custody, exchange execution or live trading was enabled.
- The prior safety design requires explicit owner permission, signed device challenge, OS secure storage, per-device power/thermal/runtime caps, energy budget, audit logging and emergency stop. Never collect seed phrases or private keys.
- No guaranteed income claims.

## Current branch work
- Added `www/crypto-engine.js`: supported PoW coin catalogue, live spot-price lookup via CoinGecko public market endpoint, strict > USD 1 filter, hardware/algorithm compatibility and net daily estimate function.
- Added the mining discovery and profitability UI to the founder-only Crypto panel.
- Added a red emergency control with a black border. At this stage it arms a local stop latch and disables new discovery actions; it cannot stop a separate miner until a native agent and authenticated stop endpoint exist.
- Added an animated double DNA helix in the landing hero with two distinct strands and reduced-motion handling.
- Added browser regression tests for coin filtering, hardware compatibility, profitability arithmetic, helix rendering and emergency latch.
- Android APK work is explicitly deferred for this stage.

## Honest implementation boundary
The current branch is a discovery/profitability core, not a live mining engine. Coin price > USD 1 is not sufficient to establish mineability or profit. Real Bitcoin mining requires SHA-256 ASIC hardware; other coins require compatible proof-of-work algorithms and device types. Actual mining requires a separate signed native agent, authorized hardware, pool configuration, network difficulty/reward data, safety limits, secure device challenge and a verified global stop. No hidden browser mining is allowed.

## Full platform completion checklist
- [ ] Free: chat quality, conversation persistence, voice playback/recording, file upload/download and export.
- [ ] Health: medical information safety, consent, attachment isolation, professional/clinic workflow and clear no-diagnosis/no-replacement boundaries.
- [ ] Studio: presenters, animation, video render pipeline, saved book/manuscript projects, exports and rights checks.
- [ ] Academy: courses, lessons, learner progress, projects and private persistence.
- [ ] Commerce: catalogue, product/project lifecycle, order/fulfilment boundaries, payments and refund/tax requirements.
- [ ] Business: plans, cashbook, multi-currency, VAT estimates, project storage, reports and professional accounting boundaries.
- [ ] Crypto: native mining agent, secure device enrolment, compatible coin/pool adapters, telemetry, safety limits and emergency stop.
- [ ] Security/infrastructure: Supabase RLS, migrations, Cloudflare Worker routes, auth, rate limits, storage, audit and backups.
- [ ] Publishing: web production deploy and smoke tests first; Android/APK intentionally later; Google Play release only after signed build and policy checks.

## Checkpoint links
- Main base commit at branch creation: db811d21ea67ec0ef0ed56404eccd013a3cc2017
- PR #25 presenter race fix remains a separate open workstream and must be rechecked before integration.
- This archive is a project checkpoint, not a verbatim export of the full ChatGPT conversation. The original conversation remains in ChatGPT chat history.
