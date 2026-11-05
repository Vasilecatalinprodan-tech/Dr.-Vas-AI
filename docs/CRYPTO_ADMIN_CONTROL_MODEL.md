# Dr.Vas Crypto — administrator control model

Status: design specification only. No mining agent, wallet custody or live trading is enabled by this document.

## Administrator access
- The Crypto area is hidden from normal navigation and protected by server-side role checks on every request.
- Access requires an authenticated administrator and an enrolled device. Device enrolment is explicit, revocable and time-limited.
- Separate owner, operator and read-only auditor roles. Require step-up authentication for sensitive settings.
- Audit access and configuration changes without recording credentials, wallet secrets or private keys.

## Authorised mining equipment
- Mining can run only on equipment owned by an administrator or explicitly authorised in writing by that administrator.
- No visitor, customer or public website device may be used. No hidden browser mining or covert background workload.
- Each device must display its authorisation, workload, resource limits, energy estimate and pause/stop controls.
- Revoking device authorisation must disable its mining workload.

## Administrator-owned accounts
- Connect each administrator's exchange or wallet account separately; do not pool funds by default.
- Begin with read-only connections for balances and market data.
- Never request seed phrases or private keys. Any later exchange API connection must have withdrawals and transfers disabled, with encryption, rotation and revocation.
- Maintain a separate ledger for each account, showing deposits, withdrawals, mining proceeds, fees and realised/unrealised results.
- Shared treasury or managing another person's funds requires separate legal review and written agreement.

## Analysis and reinvestment
- Separate realised mining proceeds, operating costs, reserve and the amount the administrator has allocated to risk.
- First release: market data, portfolio display, mining economics and alerts.
- Second release: historical backtesting with clear limitations.
- Third release: simulated trading using live prices and realistic fees/slippage.
- Fourth release: administrator-approved live orders with asset allowlists, per-order and daily limits, exposure limits, audit trail and emergency stop.
- Any later bounded automation requires independent security, legal and operational review. It cannot increase its own budget, change its own risk limits, add assets, or withdraw funds.
- Display net results and losses. Never promise or imply guaranteed returns.

## Release gate
Before real mining or trading is enabled, complete threat modelling, device-agent review, exchange API security, cost modelling, tax/accounting review and UK legal advice. The legal perimeter depends on the actual activity and business model. FCA guidance distinguishes personal use from carrying on in-scope cryptoasset services as a business; check current registration/authorisation and financial-promotion requirements before offering services to others.

Official FCA references:
- https://www.fca.org.uk/firms/cryptoassets/who-needs-register
- https://handbook.fca.org.uk/handbook/perg18
- https://www.fca.org.uk/firms/cryptoassets
