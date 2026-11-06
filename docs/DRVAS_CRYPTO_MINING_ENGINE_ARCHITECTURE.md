# Dr.Vas Crypto Mining Engine — architecture and implementation plan

Updated: 2026-11-06
Branch: `feature/crypto-engine-dna-interface-2026-11-06`
Status: discovery/profitability core implemented; native mining execution is NOT implemented or enabled.

## Founder requirement
Build a high-performance Dr.Vas mining engine that discovers Bitcoin and other mineable coins whose live market price is strictly greater than USD 1. The same work session also calls for completion of all six public modules, a moving double-DNA-helix visual identity, a red emergency button with a black border, and deferring Android APK work until the later stage.

## Important technical distinction
A market price above USD 1 does not make a coin mineable or profitable. Only proof-of-work networks can be mined. Profitability depends on algorithm/hardware compatibility, device hashrate, current network difficulty or network hashrate, block reward and fees, pool fee, uptime, electricity, cooling, maintenance, hardware cost and market liquidity. A universal browser miner cannot efficiently mine every algorithm. Bitcoin SHA-256 requires purpose-built ASIC hardware for realistic competitive mining; CPU/GPU browser hashing is not a viable Bitcoin mining product.

## Implemented in this branch
- `www/crypto-engine.js`: isolated Proof-of-Work catalog, hardware/algorithm compatibility filter, strict price threshold (> USD 1), market data fetch, and a net-daily economics function which subtracts pool fee, electricity and maintenance.
- Initial supported catalog includes Bitcoin (SHA-256), Bitcoin Cash (SHA-256), Litecoin (Scrypt), Dogecoin (Scrypt merged mining), Ethereum Classic (Etchash), Monero (RandomX), Zcash (Equihash), Dash (X11), Kaspa (kHeavyHash), Ravencoin (KawPoW), DigiByte (multi-algorithm) and eCash (SHA-256). The catalogue is an explicit supported set, not a claim to list every crypto asset.
- CoinGecko public markets endpoint is used for spot prices; if it is rate-limited or unavailable, the UI must show that failure instead of inventing prices.
- The landing hero includes a responsive animated double helix made from two visible DNA strands, with reduced-motion support.
- The founder-only Crypto admin panel includes a high-visibility red emergency button with a thick black border. At this phase it arms a local stop latch and blocks new scanner actions. It does not falsely claim to stop an external miner; there is no native miner agent connected yet.
- Mining remains disabled: no CPU/GPU/ASIC workload is started, no wallet is connected, no credentials or seed phrases are collected, and no transaction is made.
- Browser E2E tests cover strict >$1 filtering, hardware compatibility, net daily arithmetic, two-strand helix visibility and emergency-latch UI behavior.

## Native execution architecture — next implementation stages
1. Hardware discovery and cryptographic device enrolment: a fresh server challenge signed by a device-held private key; server verifies the signature against a registered public key. Keep private keys in OS secure storage; never upload them.
2. Native agent: separate signed and versioned Rust/C++ service for explicitly owned/authorised mining hardware. Do not run a miner in the public web page, visitor browser, or Cloudflare Worker. Agent must expose authenticated local control and a narrow, audited Worker control channel.
3. Algorithm adapters: integrate maintained, audited miners or vendor APIs per hardware/algorithm family. Do not invent a universal SHA-256/Scrypt/RandomX/Etchash/KawPoW implementation. Verify software signatures and pin versions.
4. Pool adapter: support pool endpoint/stratum configuration with no withdrawal capability. Store only encrypted pool worker configuration; never store wallet seed phrases. Start with payout address entered locally by the device owner and display it back for confirmation.
5. Profitability data: retrieve network difficulty/hashrate, block reward, expected pool payout, fee, and reliable spot price. Calculate net return per device and reject candidates with missing/stale data. Price >$1 is a discovery filter only, not a start condition.
6. Safety controls: per-device power cap, thermal cutoff, runtime schedule, maximum energy budget, pool fee cap, signed updates, watchdog, revocation, tamper logging and server-side global kill switch. Fail closed on loss of authorisation or telemetry.
7. Controlled pilot: test on one founder-owned device, measure wall power and pool-reported hashrate/payout, compare forecast vs realised net results, and only then widen the device/coin allowlist.

## Release gates
- Device ownership/permission and electricity contract confirmed.
- UK tax/accounting and relevant legal review completed before commercial service or third-party device use.
- Threat model, independent code review, signed builds, vulnerability scanning and incident/rollback plan completed.
- No guaranteed profit claims.
- No mining on customer devices, visitor browsers, shared devices or any device without explicit owner permission.
- No live wallet custody, exchange withdrawals or automated trading in this release.

## Acceptance tests still required for actual mining
- Non-admin requests to all mining/device endpoints are rejected server-side.
- Challenge expiry, replay, signature mismatch and revoked-device tests pass.
- Emergency stop halts the native agent, closes pool sessions and prevents restart until an administrator re-arms the device.
- Thermal/power/runtime limits and watchdog are tested under load.
- Pool-side hashrate and payout reconcile against measured energy costs.
- Signed agent update and rollback are verified.
- Device logs contain no private key, wallet seed or secret.

## UI behavior
- Double DNA helix: decorative hero identity, two moving strands, responsive, no motion when reduced-motion is requested.
- Red/black emergency button: visible in founder-only Crypto controls. In the current discovery-only phase it arms the local scanner stop latch. Once the native agent exists, it must become a server-authenticated global stop command and only show "miner stopped" after the agent acknowledges it.
