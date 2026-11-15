# Testnet acceptance report

Acceptance of the multi-wallet web app against the deployed testnet contract
`CBOGI62MN5V3M7QSOKS7E6YWLLAO73LJIS3TMBMEFIADG2LDC37HUI5Q`. Automated and manual results are kept
separate: automated runs use a test implementation of a wallet protocol, manual runs use the real
wallet.

## Checks per wallet

Each wallet is checked for the same five steps:

1. **Connect:** the wallet appears in the picker and connects on Testnet.
2. **Account display:** the header shows the connected address and wallet name.
3. **Signing:** the wallet shows and signs a circle transaction (join, deposit or payout).
4. **Confirmation:** the dashboard confirms the action and links the transaction.
5. **State refresh:** deposit count, round and payout history update without a reload.

## Automated results

| Run | Wallet path | Connect | Account display | Signing | Confirmation | State refresh | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Browser lifecycle on production, 2026-11-15 (circle 30) | Freighter protocol (test implementation) | Pass | Pass | Pass, 16 transactions | Pass | Pass | [browser-e2e-run.md](testnet/browser-e2e-run.md) |
| Browser lifecycle on a local production build, 2026-11-14 (circle 25) | Freighter protocol (test implementation) | Pass | Pass | Pass, 16 transactions | Pass | Pass | Commit history of [browser-e2e-run.jsonl](testnet/browser-e2e-run.jsonl) |
| [Testnet workflow](https://github.com/fivauygn/halka/actions/workflows/testnet.yml), weekly in CI | Freighter protocol (test implementation) | Pass | Pass | Pass | Pass | Pass | Transaction logs attached to each workflow run |

A captioned [demo video](media/halka-demo.mp4) shows a further production run (circle 32) from
one member's screen. The read-only browser suite additionally verifies, on every CI run and against production, that a
wallet on the wrong network is refused, that invalid circle parameters are rejected before any
signature, and that completed circles and closed invite links render correctly.

## Manual results

Recorded with the real wallets, following the [manual testing guide](manual-testing.md).

Manual run on the live app, 2026-11-15, circle 31.

| Wallet | Connect | Account display | Signing | Confirmation | State refresh | Transactions | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Hana | Pass | Pass | Pass | Pass | Pass | [create_circle](https://stellar.expert/explorer/testnet/tx/4a014b28fed1b9b8f4f4e4fdbcbcffdd133f2b4af90f09077da1ff403166b6ca), [join_circle](https://stellar.expert/explorer/testnet/tx/81ef0623c135c312ee4fd206985be7237de44e441b9b06ccad032e489d77291e) | Hana must be on Testnet: on Mainnet it shows "Incorrect network" and disables Sign, because the app requests a Testnet signature. |
| Albedo | Pass | Pass | Pending | Pending | Pending | | Connects after the fix in issue 1. With an account that is not a member, the app refuses to join and names the connected address. |
| Freighter | Pending | Pending | Pending | Pending | Pending | | |

Record each result as **Pass**, **Fail** (with the message shown) or **Not available** (with the
reason), and link the transaction on stellar.expert.

## Issues found during manual testing

| # | Issue | Found with | Resolution |
| --- | --- | --- | --- |
| 1 | Albedo and Hana failed to connect: "does not support the getNetwork function". | Albedo, Hana | Fixed in [795b328](https://github.com/fivauygn/halka/commit/795b328): the network check is skipped only for wallets that cannot report their network; signing requests still carry the Testnet passphrase. |
| 2 | An account not yet funded on testnet produced a raw "Account not found" error. | Hana | Fixed in [965118b](https://github.com/fivauygn/halka/commit/965118b): the app explains that the account needs testnet funds and points to Friendbot. |
| 3 | When the wallet window was closed without approving or declining, the app stayed on "Creating…". | Hana | Fixed in [965118b](https://github.com/fivauygn/halka/commit/965118b): after two minutes without an answer the app stops waiting and explains what to do. Nothing is submitted without a signature. |
| 4 | Joins and deposits by other members appeared only after a reload. | All | Fixed in [965118b](https://github.com/fivauygn/halka/commit/965118b): circle state refreshes every 15 seconds. |
| 5 | Signing on the wrong network. | Hana | Working as intended: Hana refuses to sign a Testnet request while set to Mainnet. |
