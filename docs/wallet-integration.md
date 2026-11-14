# Wallet integration and transaction preflight

The contract is the final authority for deposits, payouts and reclaims. The web app adds wallet
connection and client-side checks on top of it; it has no key generation, custody, recovery,
export or server-side signing path.

## Wallets

Stellar Wallets Kit is configured for Testnet and limited to three wallets:

| Wallet | Integration |
| --- | --- |
| Freighter (via Varial, the Freighter-compatible Kit module) | Stellar Wallets Kit |
| Albedo | Stellar Wallets Kit |
| Hana | Stellar Wallets Kit |

The user picks and connects a wallet in the Kit modal. Halka keeps only the connected public
address and the wallet's display name in React state. Transaction envelopes and Soroban
authorization entries are always signed inside the selected wallet.

## Transaction preflight

Before a deposit, payout or reclaim, the app:

1. Reads the circle through the read-only contract client and fetches the latest testnet ledger
   timestamp.
2. Checks the relevant condition: current round, membership, deposit status, payout eligibility
   or reclaim deadline.
3. Builds the unsigned contract call with the generated Soroban client, which simulates it through
   Soroban RPC before `signAndSend` asks the wallet for a signature.

If the simulation returns a contract error, the app shows a plain-language message and nothing is
signed or submitted. These checks can go stale between simulation and execution, so the contract
enforces every rule again on-chain.

When a round is incomplete, the dashboard also offers a read-only **"Check why payout is
unavailable"** action. It simulates `payout` and shows the result without requesting a signature.

| Contract error | Message shown before signing |
| --- | --- |
| `AlreadyDepositedThisRound` | You've already deposited your contribution for this round. |
| `NotMember` | Your connected wallet is not an eligible member of this circle. |
| `RoundNotComplete` | Not all members have contributed for this round yet. |
| `RoundNotTimedOut` | The reclaim window for this round hasn't opened yet. |
| `NothingToReclaim` | You have no contribution to reclaim. |

## Testnet regression harness

[`web/scripts/testnet-regression.ts`](../web/scripts/testnet-regression.ts) runs against the
deployed testnet contract. Each run creates fresh circles and covers create, join, deposit,
payout and timeout reclaim, plus the expected rejections: duplicate deposit, non-member deposit,
payout of an incomplete round, early reclaim, and reclaim by an address that did not deposit.
Rejection cases are simulated only and never submitted.

Use dedicated, funded **testnet** accounts and pass their secrets as environment variables. Never
commit secret keys or leave them in shell history.

```bash
export HALKA_TESTNET_CREATOR_SECRET='S...'
export HALKA_TESTNET_MEMBER1_SECRET='S...'
export HALKA_TESTNET_MEMBER2_SECRET='S...'
export HALKA_TESTNET_OUTSIDER_SECRET='S...'
cd web
npm ci
npm run test:contract
```

The default fixtures are the `deployer`, `member1`, `member2` and `member4` accounts from
[testnet/accounts.md](testnet/accounts.md); `member4` acts as the outsider. Results are written as
newline-delimited JSON (scenario, outcome, time, transaction hash).

### Latest run

The run on 2026-11-11 created circles 20 and 21. All 19 scenarios passed: 14 submitted
transactions and 5 expected rejections. See
[testnet/regression-run.jsonl](testnet/regression-run.jsonl).

## Browser tests

[`web/e2e/`](../web/e2e/) contains Playwright tests that run the production build in Chrome. They
connect through Stellar Wallets Kit's Freighter option using
[`fake-freighter.ts`](../web/e2e/fake-freighter.ts), a test implementation of the Freighter
extension's page protocol. The app's wallet code runs unmodified, while signing happens in the test
process with testnet keys that never enter the page.

- **Read-only suite (runs in CI):** wallet connect and disconnect, rejection of a wallet on the
  wrong network, form validation before any signature, a completed circle's payout history, and a
  closed invite link.
- **Wallet-signed lifecycle (runs with three funded testnet accounts):** create, join ×3, then
  deposit ×3 and payout in each of three rounds, including the read-only payout check. The latest
  run is recorded in [testnet/browser-e2e-run.md](testnet/browser-e2e-run.md).

## Manual wallet testing

The browser tests emulate Freighter's protocol; they do not exercise the real extensions' own
interfaces. Testing with the Freighter, Albedo and Hana extensions is still open; see the
[manual testing guide](manual-testing.md).
