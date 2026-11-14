# Manual testing guide

How to run a complete circle through the web app with a browser wallet on testnet. This covers
what the automated tests cannot: wallet connection, signing prompts and how the dashboard updates.

## Setup

1. Install [Freighter](https://freighter.app) and switch its network to **Testnet**.
2. Export the five member accounts from your local Stellar CLI identity store and import each one
   into Freighter with **Add another wallet → Import secret key**:

   ```bash
   for m in member1 member2 member3 member4 member5; do
     echo "$m: $(stellar keys secret $m)"
   done
   ```

   Use testnet-only accounts. Never import a key that holds real funds.

## Create a circle

1. Open [halkawebapp.vercel.app](https://halkawebapp.vercel.app) and connect as `member1`.
2. Fill in **Create a new circle**:
   - **Members:** the five public keys (`stellar keys public-key member1`, …).
   - **Token:** XLM works immediately. For USDC, fund each member first with
     `npx @sozu/faucet@latest claim <G_ADDRESS>` (the account needs a USDC trustline).
   - **Round duration:** short, for example 1 hour.
   - **Contribution:** a small amount, for example 1.
3. Click **Create circle** and approve in Freighter. You are redirected to `/circle/{id}`.

## Join

For each member, including `member1`: switch accounts in Freighter, open the invite link
(**Invite link → Copy link** on the dashboard, or `/circle/{id}/join`), click **Join** and approve. The
circle becomes **Active** once every member has joined.

## Run the rounds

For each round:

1. Deposit from every member with **Deposit contribution**.
2. Once all members have deposited, click **Trigger payout** from any connected account.
3. Check that **Payout history** updates and the dashboard moves to the next round.

After the last round the circle shows **Completed** with a full payout history.

## Recording results

For each wallet tested (Freighter, Albedo, Hana), note the wallet, the action, the outcome and the
transaction hash. Hashes are listed on each account's stellar.expert page:
`https://stellar.expert/explorer/testnet/account/<G-address>`.
