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
| Browser lifecycle on production, 2026-11-15 (circle 30) | Freighter protocol (test implementation) | Pass | Pass | Pass, 16 transactions | Pass | Pass | [browser-e2e-run.md](testnet/browser-e2e-run.md), [video](media/halka-demo.mp4) |
| Browser lifecycle on a local production build, 2026-11-14 (circle 25) | Freighter protocol (test implementation) | Pass | Pass | Pass, 16 transactions | Pass | Pass | Commit history of [browser-e2e-run.jsonl](testnet/browser-e2e-run.jsonl) |
| [Testnet workflow](https://github.com/fivauygn/halka/actions/workflows/testnet.yml), weekly in CI | Freighter protocol (test implementation) | Pass | Pass | Pass | Pass | Pass | Transaction logs attached to each workflow run |

The read-only browser suite additionally verifies, on every CI run and against production, that a
wallet on the wrong network is refused, that invalid circle parameters are rejected before any
signature, and that completed circles and closed invite links render correctly.

## Manual results

Recorded with the real wallets, following the [manual testing guide](manual-testing.md).

| Wallet | Version | Connect | Account display | Signing | Confirmation | State refresh | Transaction | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Freighter | | Pending | Pending | Pending | Pending | Pending | | |
| Albedo | | Pending | Pending | Pending | Pending | Pending | | |
| Hana | | Pending | Pending | Pending | Pending | Pending | | |

Record each result as **Pass**, **Fail** (with the message shown) or **Not available** (with the
reason), and link the transaction on stellar.expert.
