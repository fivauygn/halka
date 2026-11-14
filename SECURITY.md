# Security policy

## Supported versions

Halka is a testnet prototype. Only the latest commit on `main` and the contract deployed on Stellar
testnet (`CBOGI62MN5V3M7QSOKS7E6YWLLAO73LJIS3TMBMEFIADG2LDC37HUI5Q`) are supported. The contract
has not been audited and must not be used with real funds.

## Reporting a vulnerability

Please report vulnerabilities **privately** through GitHub:
[Security → Report a vulnerability](https://github.com/fivauygn/halka/security/advisories/new).
Do not open a public issue for security problems.

Include, where possible:

- the affected component (contract, web app or scripts) and commit;
- steps to reproduce, or a testnet transaction hash that demonstrates the issue;
- the impact you expect (for example, locked or misdirected funds).

You can expect an acknowledgement within 7 days and an assessment within 30 days. Please give us a
reasonable chance to fix the issue before disclosing it publicly.

## Scope

In scope:

- the Soroban contract in [`contracts/circle`](contracts/circle): fund custody, payout, reclaim and
  authorization logic;
- the web app in [`web`](web): transaction construction, preflight checks and wallet handling.

Out of scope: third-party wallets, Stellar network infrastructure, and attacks that require a
compromised user device.
