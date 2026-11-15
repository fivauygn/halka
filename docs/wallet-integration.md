# Wallet integration and transaction preflight

The contract is the final authority for deposits, payouts and reclaims. The web app adds wallet
connection and client-side checks on top of it; it has no key generation, custody, recovery,
export or server-side signing path.

## Wallet compatibility matrix

Stellar Wallets Kit (v2.8) is configured for Testnet and limited to three wallets. The user picks
one in the Kit modal. If the wallet can report its network (Freighter), the app refuses a
connection that is not on Testnet. Albedo and Hana cannot report their network, so for them the
app relies on the Testnet passphrase it sends with every signing request.

| Wallet | Kit module | Shown in the picker as | Automated coverage | Manual acceptance | Known limitations and fallback |
| --- | --- | --- | --- | --- | --- |
| Freighter | `varial`, built on `@stellar/freighter-api` | **Varial** | Full lifecycle, 16 signed testnet transactions ([run](testnet/browser-e2e-run.md)) | See [acceptance report](acceptance-report.md) | Kit 2.8 serves Freighter through its `varial` module, so the picker labels it Varial; it talks to the installed Freighter extension. If no extension is detected, the entry shows **Install**. |
| Albedo | `albedo`, built on `@albedo-link/intent` | **Albedo** | Not covered (Albedo signs in its own albedo.link window) | See [acceptance report](acceptance-report.md) | Web-based, nothing to install; the user must create or select an account in Albedo's window, and the browser must allow albedo.link to open. Does not report its network; signing requests carry the Testnet passphrase. |
| Hana | `hana` | **Hana Wallet** | Not covered (needs the extension) | See [acceptance report](acceptance-report.md) | If the extension is not installed, the entry shows **Install** and links to the wallet. Does not report its network; signing requests carry the Testnet passphrase. |

Fallbacks shown to the user in every wallet:

| Situation | Message |
| --- | --- |
| Wallet reports another network (Freighter) | Your wallet is not on the Stellar Testnet. Switch networks in the wallet and reconnect. |
| User closes the wallet picker | Wallet selection was cancelled. |
| User rejects the signature | The transaction was not approved in the wallet. |
| No usable wallet | No compatible wallet was found. Install a supported wallet or select another option. |
| RPC unreachable | Network error — could not reach the Stellar testnet. Please try again. |

After a successful deposit, payout, reclaim or join, the dashboard confirms the action, links the
transaction on stellar.expert and refreshes the circle state.

## Security boundary

- **Keys never reach Halka.** The app does not generate, import, store, export or recover private
  keys or seed phrases. Halka's own code keeps only the connected public address and the wallet's
  name, in memory. Stellar Wallets Kit remembers the selected wallet, the public address and
  recently used wallets in the browser's `localStorage`; this is public information only.
- **Every signature happens in the user's wallet.** Transaction envelopes and Soroban authorization
  entries are passed to the selected wallet through Stellar Wallets Kit, and the user approves
  each one there.
- **No server-side signing.** The Next.js server only renders pages. Contract reads, simulations
  and signed transactions go from the user's browser directly to Soroban RPC; no Halka server
  holds keys, signs or relays transactions.
- **Preflight is advisory.** Client-side checks and simulation reduce failed transactions, but the
  contract enforces every rule on-chain; a stale or bypassed preflight cannot move funds the
  contract would not allow.
- **Test keys stay out of the browser.** The browser tests sign in the Node test process; secret
  keys are read from environment variables and never committed.

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

The browser tests emulate Freighter's protocol; they do not exercise the real wallets' own
interfaces. Manual checks with Freighter, Albedo and Hana follow the
[manual testing guide](manual-testing.md), and results are recorded in the
[acceptance report](acceptance-report.md).
