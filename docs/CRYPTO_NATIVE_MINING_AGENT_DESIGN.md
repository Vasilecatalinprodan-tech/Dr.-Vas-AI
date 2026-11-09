# Dr.Vas Crypto — signed local mining agent architecture
Status: design specification only; no miner execution is implemented or enabled.
Owner area: founder/admin-only Crypto workspace.

## Product boundary
The web application remains a read-only discovery, economics and monitoring console. Actual proof-of-work hashing must run only on a device explicitly owned/authorised by the founder, through a separately installed and visibly running native agent. The website must never mine in a browser tab, Web Worker, service worker, visitor device or Cloudflare Worker.

A calculator estimate is not a mining result. Market price above USD 1 is only a discovery filter; it does not establish Proof-of-Work eligibility, pool support, network reward, or positive net income.

## Proposed components
1. **Web control plane** — founder-only dashboard, coin/algorithm catalogue, scenario calculator, device registry, operator consent and audit history.
2. **Cloudflare Worker API** — server-side administrator authorisation, device challenge issuance, signed telemetry ingestion, command validation, rate limits and audit records. Never returns pool credentials or device private keys.
3. **Native local agent** — initially Windows and Linux desktop/server, implemented as a small Rust service/CLI with a visible tray/console status. Android is not the first mining host.
4. **Miner backend adapters** — launch only pinned, independently verified, compatible upstream miner binaries with documented licences and checksums. The agent supervises processes; it does not download arbitrary executables at runtime.
5. **Pool adapters** — explicitly configured Stratum endpoints, coin/algorithm compatibility checks, share accounting and fail-closed connection handling.

## Device enrolment and identity
- Generate an Ed25519 device key pair locally; private key never leaves the device.
- Store private key in OS-protected storage (Windows DPAPI/TPM-backed key storage where available; Linux kernel keyring/TPM or protected service account storage).
- Enrolment begins with a short-lived server challenge bound to the authenticated founder, device ID, requested capabilities and nonce.
- Agent signs the challenge locally. Worker verifies signature and administrator allowlist before marking the device eligible for separate approval.
- Revoke a device immediately on owner request, signature failure, key rotation or suspicious replay.
- Never request seed phrases, private wallet keys, exchange passwords or broad remote desktop access.

## Mining authorisation
Mining starts OFF. Before every first start and every material configuration change, require explicit owner confirmation of:
- coin and algorithm;
- exact device and miner backend/version/checksum;
- pool hostname/port/TLS mode and pool account identifier;
- payout address (public receiving address only; no private key);
- miner hashrate estimate and network data timestamp;
- power limit, thermal limit, runtime schedule and maximum energy budget;
- electricity tariff, pool fee, maintenance reserve and worst-case daily cost.

The owner must see a final cost/risk summary and affirmatively press Start. No automatic start after reboot, browser refresh, deployment, reconnection or software update.

## Telemetry and safety watchdog
Collect only what is needed for mining safety and accounting:
- accepted/rejected/stale shares, reported hashrate, pool connection state and last share;
- device temperature, fan status, power draw and uptime where the hardware exposes trustworthy telemetry;
- process health, agent heartbeat, software version and active policy limits.

Hard-stop conditions:
- thermal or power limit reached;
- energy budget exhausted;
- owner schedule ended;
- device authorisation revoked;
- pool endpoint or algorithm mismatch;
- telemetry becomes unavailable beyond the configured grace period;
- agent signature, command signature, policy integrity or watchdog fails;
- emergency stop received locally or remotely.

Local emergency stop must terminate the supervised miner process even when internet connectivity is unavailable. Remote stop is not considered complete until the agent acknowledges termination; the dashboard must show “pending/unreachable” rather than falsely claiming it stopped. The red STOP control must always be visible while mining is authorised.

## Command protocol
- Sign every control command; bind it to device ID, command ID, nonce, issued-at time, expiry and monotonic sequence.
- Reject expired, replayed, out-of-order, wrong-device or unauthorised commands.
- Keep the command allowlist small: status, configure (owner-approved), start (owner-approved), stop, revoke and update.
- Default-deny all unknown commands. No arbitrary shell execution or generic remote command channel.
- Record actor, device, policy version, command result, timestamps and stop acknowledgement in an append-only audit trail.

## Miner supply chain and updates
- Pin exact upstream releases and SHA-256 checksums; verify publisher signatures when available.
- Review licences and notices before redistribution; do not bundle closed-source binaries without permission.
- Publish signed agent manifests, SBOM, supported hardware/algorithm matrix and rollback instructions.
- Never auto-update miner binaries while a session is active. Stop first, verify the new signed package, then require owner approval before restarting.

## Economics and network-data quality
- Keep miner hashrate and network hashrate in the same explicitly selected unit.
- Use network share × blocks/day × block reward × uptime for expected coin/day.
- Apply pool fee, electricity (watts × 24 ÷ 1000 × tariff), maintenance and any owner-entered reserve separately.
- Each live network adapter must expose source, retrieval time, units, freshness and error state. Stale or unavailable data must be visibly marked and must not silently fall back to invented defaults.
- Coin price, block reward, network difficulty/hashrate and pool payout rules are independent inputs; do not infer profit from coin price alone.
- Report estimates and observed pool shares separately. Never guarantee returns.

## Implementation gates
- [ ] Threat model and security review.
- [ ] Confirm target operating system and actual hardware models with the founder.
- [ ] Select and audit miner backends and licences.
- [ ] Implement signed challenge enrolment and revocation.
- [ ] Implement signed command protocol and replay protection.
- [ ] Implement local watchdog, thermal/power limits and fail-safe stop.
- [ ] Implement one testnet/dev pool adapter before mainnet.
- [ ] Verify telemetry and accounting against pool-side accepted shares.
- [ ] Independent security review and founder approval of the exact device/pool/coin.
- [ ] Only then consider a controlled, visible real-mining pilot.

Until every gate passes, the Dr.Vas Crypto workspace remains a simulator/monitoring console and execution stays disabled.
