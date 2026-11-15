# Manual testing guide

How to check the web app with the real Freighter, Albedo and Hana wallets on testnet. The
[browser tests](wallet-integration.md#browser-tests) cover the same flow with an emulated Freighter
wallet; this guide covers what they cannot: each wallet's own connection and signing prompts.

One circle with three members, each on a different wallet, exercises every wallet in about
15 minutes. Record the results in the [acceptance report](acceptance-report.md).

## 1. Prepare three testnet accounts

Use testnet-only accounts. Never use a key that holds real funds.

```bash
for i in 1 2 3; do stellar keys generate halka-manual-$i --network testnet --fund; done
for i in 1 2 3; do stellar keys public-key halka-manual-$i; done
```

| Member | Wallet | Setup |
| --- | --- | --- |
| 1 | Freighter | Install [Freighter](https://freighter.app), switch it to **Testnet**, then **Add another wallet → Import secret key** with `stellar keys secret halka-manual-1`. |
| 2 | Albedo | Open [albedo.link](https://albedo.link) and add an account with the secret key of `halka-manual-2`. Nothing to install. |
| 3 | Hana | Install [Hana Wallet](https://www.hanawallet.io), switch it to **Testnet**, and import the secret key of `halka-manual-3`. |

## 2. Create the circle (Freighter)

1. Open [halkawebapp.vercel.app](https://halkawebapp.vercel.app), click **Connect wallet** and pick
   **Varial** (Stellar Wallets Kit's Freighter option). Check that the header shows the address
   and wallet name.
2. In **Create a new circle**, enter the three public keys in order, keep **XLM**, set the round
   duration to **1** hour and the contribution to **1**.
3. Click **Create circle** and approve in Freighter. You land on `/circle/{id}`.

## 3. Join (all three wallets)

For each member, open `/circle/{id}/join` (or **Invite link → Copy link**), connect that member's
wallet, click **Join** and approve in the wallet. After the third join the circle shows **Active**.

## 4. Deposit and payout (all three wallets)

1. Each member opens `/circle/{id}`, connects and clicks **Deposit contribution (1)**. Check the
   **Deposit confirmed. View transaction** message and that the deposit count goes up.
2. Before the last deposit, click **Check why payout is unavailable**: it should explain that not
   all members have contributed, without asking for a signature.
3. After the third deposit, any member clicks **Trigger payout**. Check **Payout sent** and that
   **Payout history** shows round 1.

## 5. Optional checks

- **Wrong network:** switch Freighter to Mainnet and connect. The app should refuse with the
  wrong-network message.
- **Rejection:** click **Deposit contribution** and reject in the wallet. The app should say the
  transaction was not approved.

## Recording results

For each wallet, record Pass, Fail (with the message shown) or Not available (with the reason) for
connect, account display, signing, confirmation and state refresh, plus the wallet version and a
transaction link, in the [acceptance report](acceptance-report.md).
