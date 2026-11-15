import { writeFileSync } from "node:fs";

import { expect, test, type Browser, type Page } from "@playwright/test";
import { Keypair } from "@stellar/stellar-sdk";

import { installFakeFreighter } from "./fake-freighter";
import { connectWallet } from "./helpers";

/**
 * Records the demo video: one member's screen while a 3-member circle runs to completion on
 * testnet. The other two members act in their own (unrecorded) browsers. Step captions and their
 * start times are written to captions.json next to the video.
 *
 * Run: DEMO_VIDEO=1 E2E_BASE_URL=https://halkawebapp.vercel.app \
 *      HALKA_E2E_MEMBER{1,2,3}_SECRET=... npx playwright test e2e/demo-video.spec.ts
 */

const secrets = [1, 2, 3].map((i) => process.env[`HALKA_E2E_MEMBER${i}_SECRET`]);
test.skip(!process.env.DEMO_VIDEO || secrets.some((s) => !s), "Set DEMO_VIDEO=1 and HALKA_E2E_MEMBER{1,2,3}_SECRET.");

const SIZE = { width: 1280, height: 800 };

async function memberPage(browser: Browser, keypair: Keypair, record: boolean): Promise<Page> {
  const context = await browser.newContext({
    viewport: SIZE,
    colorScheme: "dark",
    recordVideo: record ? { dir: test.info().outputPath("video"), size: SIZE } : undefined,
  });
  const page = await context.newPage();
  await installFakeFreighter(page, keypair);
  return page;
}

test("demo video", async ({ browser }) => {
  test.setTimeout(20 * 60_000);
  const keypairs = secrets.map((s) => Keypair.fromSecret(s!));
  const addresses = keypairs.map((k) => k.publicKey());

  const main = await memberPage(browser, keypairs[0], true);
  const started = Date.now();
  const captions: { at: number; text: string }[] = [];
  const caption = (text: string) => captions.push({ at: (Date.now() - started) / 1000, text });
  const pause = (ms: number) => main.waitForTimeout(ms);

  // 1. Connect
  await main.goto("/");
  caption("Halka: a rotating savings circle on Stellar testnet");
  await pause(2500);
  caption("1 · Connect a wallet through Stellar Wallets Kit");
  await connectWallet(main, addresses[0]);
  await pause(1500);

  // 2. Create
  caption("2 · Create a circle: 3 members, 1 XLM per round, payout order = member order");
  await main.getByRole("button", { name: "+ Add member" }).click();
  for (const [i, address] of addresses.entries()) {
    await main.getByPlaceholder(`Member ${i + 1} address (G…)`).pressSequentially(address.slice(0, 6), { delay: 40 });
    await main.getByPlaceholder(`Member ${i + 1} address (G…)`).fill(address);
  }
  await main.getByLabel("Round duration (hours)").fill("1");
  await main.getByLabel(/Contribution amount/).fill("1");
  await pause(1200);
  caption("The wallet signs; the circle is created on-chain");
  await main.getByRole("button", { name: "Create circle" }).click();
  await main.waitForURL(/\/circle\/\d+$/, { timeout: 120_000 });
  const circleId = main.url().match(/\/circle\/(\d+)$/)![1];
  await pause(2000);

  // 3. Join
  caption("3 · Every member joins from the invite link");
  await main.getByRole("button", { name: "Join circle" }).click();
  await expect(main.getByText("Joined the circle.")).toBeVisible({ timeout: 120_000 });
  const others = await Promise.all(keypairs.slice(1).map((k) => memberPage(browser, k, false)));
  for (const [i, page] of others.entries()) {
    await page.goto(`/circle/${circleId}/join`);
    await connectWallet(page, addresses[i + 1]);
    await page.getByRole("button", { name: "Join", exact: true }).click();
    await page.waitForURL(new RegExp(`/circle/${circleId}$`), { timeout: 120_000 });
  }
  caption("All members joined: the circle is active");
  await expect(main.getByText("Active", { exact: true })).toBeVisible({ timeout: 60_000 });
  await pause(2000);

  for (let round = 1; round <= 3; round++) {
    // 4. Deposit
    caption(
      round === 1
        ? "4 · Each member deposits; the app checks the circle and simulates the call before signing"
        : `Round ${round} of 3`
    );
    await main.getByRole("button", { name: "Deposit contribution (1)" }).click();
    await expect(main.getByText("Deposit confirmed.")).toBeVisible({ timeout: 120_000 });
    if (round === 1) {
      caption("Confirmed on-chain, with a link to the transaction");
      await pause(2500);
      caption("5 · Read-only check: why the payout is not possible yet (no signature needed)");
      await main.getByRole("button", { name: "Check why payout is unavailable" }).click();
      await expect(main.getByText("Not all members have contributed for this round yet.")).toBeVisible();
      await pause(3000);
      caption("The other members deposit from their own wallets; this page refreshes by itself");
    }
    for (const page of others) {
      await page.getByRole("button", { name: "Deposit contribution (1)" }).click({ timeout: 90_000 });
      await expect(page.getByText("Deposit confirmed.")).toBeVisible({ timeout: 120_000 });
    }

    // 6. Payout
    await expect(main.getByRole("button", { name: "Trigger payout" })).toBeVisible({ timeout: 60_000 });
    caption(round === 1 ? "6 · Round complete: anyone can trigger the payout to the member whose turn it is" : `Payout for round ${round}`);
    await main.getByRole("button", { name: "Trigger payout" }).click();
    await expect(main.getByText("Payout sent.")).toBeVisible({ timeout: 120_000 });
    await pause(2000);
  }

  await expect(main.getByText("Completed", { exact: true })).toBeVisible({ timeout: 60_000 });
  caption("Circle completed: each member received the pool exactly once");
  await pause(5000);

  writeFileSync(test.info().outputPath("captions.json"), JSON.stringify({ circleId, captions }, null, 2));
  await Promise.all([main, ...others].map((p) => p.context().close()));
});
