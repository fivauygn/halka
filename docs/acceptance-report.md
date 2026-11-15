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

Manual run on the live app, 2026-11-15, with one circle whose three members each used a different
wallet (circle 33). Hana created the circle; every member joined and deposited from its own wallet;
Hana triggered the round 1 payout to the Albedo member. All 8 transactions succeeded on testnet.

| Wallet | Connect | Account display | Signing | Confirmation | State refresh | Transactions | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Freighter (shown as Varial) | Pass | Pass | Pass | Pass | Pass | [join](https://stellar.expert/explorer/testnet/tx/ecce0c5659c7320a0f03f348268237e10dc13bbe24193f2544dcc59a0c466444), [deposit](https://stellar.expert/explorer/testnet/tx/572c9d7d8bf841dfbd13ad62899c4302490f3be8aa38af8321b5d5f36ab08257) | |
| Albedo | Pass | Pass | Pass | Pass | Pass | [join](https://stellar.expert/explorer/testnet/tx/36bfd165eeaa343d217f798dd061d896674dcb40b220a677b2c5941e52d3ffa7), [deposit](https://stellar.expert/explorer/testnet/tx/e3ba270808afa2507ef81baaf888f42482585937542a44f7ea3eee9b7f452d5e) | Connects after the fix in issue 1. Signs with the account selected in Albedo; with an account that is not a member, the app refuses to join and names the connected address. |
| Hana | Pass | Pass | Pass | Pass | Pass | [create_circle](https://stellar.expert/explorer/testnet/tx/0800f052e1e466f02cce799a6184b7d0fc78e21b4e8d7263fca938feab6baef9), [join](https://stellar.expert/explorer/testnet/tx/d11a55659f5ceb0ea42730788be1af373fb5f81745e64699cf6a1221219c4ab6), [deposit](https://stellar.expert/explorer/testnet/tx/a0527a9b374f588ea7b440235db4086532404fa7c29102515ad89719f10f0e88), [payout](https://stellar.expert/explorer/testnet/tx/960be5596efbef8ab0583865440a9b42daf4c8b72a697e1da8e8f808524e2877) | Hana must be on Testnet: on Mainnet it shows "Incorrect network" and disables Sign, because the app requests a Testnet signature. An earlier run (circle 31) also created and joined a circle with Hana. |

Members of circle 33, in payout order: `GAGPTGD45TI5FZUVINBBFRVI57HTWWUEBWQEKTT5OEMIFJABTTBKPX5I`
(Albedo), `GCTABTJ67VIFIRIICRZ3YJ3WLM46R5SVHTJOVLVCVR5HJJ3JU3N72WNY` (Freighter),
`GAFXJXPAHCOI4OE6W5E6CNG757UOQNP6RPV3AMACD4BOAUOTBTQXBKI3` (Hana).

## Issues found during manual testing

| # | Issue | Found with | Resolution |
| --- | --- | --- | --- |
| 1 | Albedo and Hana failed to connect: "does not support the getNetwork function". | Albedo, Hana | Fixed in [795b328](https://github.com/fivauygn/halka/commit/795b328): the network check is skipped only for wallets that cannot report their network; signing requests still carry the Testnet passphrase. |
| 2 | An account not yet funded on testnet produced a raw "Account not found" error. | Hana | Fixed in [965118b](https://github.com/fivauygn/halka/commit/965118b): the app explains that the account needs testnet funds and points to Friendbot. |
| 3 | When the wallet window was closed without approving or declining, the app stayed on "Creating…". | Hana | Fixed in [965118b](https://github.com/fivauygn/halka/commit/965118b): after two minutes without an answer the app stops waiting and explains what to do. Nothing is submitted without a signature. |
| 4 | Joins and deposits by other members appeared only after a reload. | All | Fixed in [965118b](https://github.com/fivauygn/halka/commit/965118b): circle state refreshes every 15 seconds. |
| 5 | Signing on the wrong network. | Hana | Working as intended: Hana refuses to sign a Testnet request while set to Mainnet. |
