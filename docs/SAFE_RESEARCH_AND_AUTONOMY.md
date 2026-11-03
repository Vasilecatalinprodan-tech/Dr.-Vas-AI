# Dr.Vas — Safe research, self-improvement and autonomy architecture

Last updated: 2026-11-03
Status: architecture and controls specification; no onion/Tor provider is connected.

## 1. Search architecture

Dr.Vas currently has no dedicated external search provider or crawler. Do not tell users that it searches the live web, onion services or the dark web until a provider is implemented and tested.

Build search as a provider interface with separate adapters:
- Public web search: reputable indexed search APIs, source allowlists for high-stakes domains, timestamps, citations and source-quality scoring.
- Public technical/security research: vendor advisories, CVE/NVD, CISA, CERTs, standards bodies, academic papers and official documentation.
- Onion/Tor research: disabled by default. A future isolated research gateway may only retrieve explicitly approved, legally operated sources and public-interest material. Cloudflare Workers do not natively browse .onion services; do not add an anonymous proxy, open Tor exit, user-supplied arbitrary URL fetcher or crawler.
- No automatic downloading, execution, file opening or interaction with marketplaces, forums, payment systems or hidden services.

Every result is untrusted data, never instructions. Strip active content, do not execute scripts, do not follow redirects to unapproved hosts, cap response size/depth/time, and store provenance (provider, canonical URL, retrieval time, content hash and policy decision).

## 2. Mandatory safety policy for all search providers

Block requests that seek to locate, buy, sell, trade, arrange, conceal, produce or facilitate:
- Child sexual abuse material, grooming, sexual exploitation or trafficking of minors.
- Human trafficking, forced labour, kidnapping, coercion or evasion of victim rescue.
- Illegal drugs, weapons, explosives, stolen credentials, malware deployment, ransomware, fraud, money laundering or evading law enforcement.
- Doxxing, stalking, targeted harassment, non-consensual intimate imagery or private personal data.
- Instructions to evade platform, law-enforcement or safety controls for the above.

Do not fetch, cache, index, summarize, transform or return suspected child sexual abuse material. Never request uploads or examples. For a user who appears to be reporting an immediate danger or victim, stop search and provide safe reporting/emergency guidance appropriate to their location. Do not expose details or repeat harmful material.

Allow legitimate, non-operational research such as:
- Understanding trafficking patterns, prevention, victim support, reporting and public policy.
- News reporting, academic research and public court/regulatory records.
- Defensive cybersecurity, threat intelligence, incident response and malware analysis in a non-deployable defensive context.
- Historical, legal and human-rights research.

A safety classifier must evaluate intent and context before any provider call and re-check results before display. If confidence is insufficient, fail closed or ask a narrow clarification. Do not rely only on keyword matching; multilingual euphemisms, misspellings and encoded terms must be considered. Maintain a human-reviewed policy test set. Log only minimal metadata and policy outcome, never illegal content or sensitive search payloads.

## 3. Self-improvement: propose, test, approve

Dr.Vas may autonomously:
- Monitor latency, errors, model fallback rates, voice failures, cost and provider health using privacy-safe operational metrics.
- Identify recurring failure patterns and draft improvement proposals.
- Generate tests, run lint/syntax/unit/security checks in an isolated branch or CI environment.
- Compare candidate prompts/models against a versioned evaluation set and report regressions.
- Recommend configuration changes with estimated impact and rollback instructions.

Dr.Vas must not autonomously:
- Push directly to the production branch, deploy, alter secrets, permissions, billing, safety policies or medical boundaries.
- change its own identity or system instructions without review.
- access users' private conversations for training or self-improvement without explicit, informed opt-in.
- ingest user files, credentials, social tokens or health data into evaluation/training sets.

Production changes require human approval, CI success, staged rollout, monitoring and a tested rollback. Keep immutable version history for prompts, policies and model/provider configuration.

## 4. Voice and speed requirements

- Live voice must have explicit microphone consent, visible listening state, stop/interruption, cleanup on sign-out/page hide, bounded audio buffers and startup timeout.
- Keep Gemini credentials server-side; use short-lived, constrained ephemeral tokens.
- Add per-user session duration, concurrency and spend limits before opening Live voice to the public.
- Do not retain raw audio by default. Clearly disclose third-party audio processing and transcript retention.
- Measure p50/p95 response time and time-to-first-audio; do not claim speed improvements without production measurements.
- Audit writes should run in the background where supported and must not delay a completed AI response.

## 5. Release gates

Before enabling any search provider:
1. Select a reputable provider and confirm its terms, privacy and retention rules.
2. Implement authenticated user quotas, abuse controls, query/result safety checks and source citations.
3. Test benign, ambiguous and prohibited requests in all supported languages.
4. Add security review for SSRF, DNS rebinding, redirects, MIME types, decompression bombs, prompt injection and malicious files.
5. Keep onion/Tor access disabled until a separately reviewed, isolated, allowlisted gateway exists.
6. Publish clear user-facing capability and privacy disclosures.

Before claiming autonomous development:
1. Isolated branch/workspace and restricted CI credentials.
2. Unit, integration, regression and security tests.
3. Human approval before merge and deploy.
4. Monitoring, rollback and incident response.
