import { appendFileSync } from "node:fs";
import path from "node:path";

import { expect, test, type Browser, type Page } from "@playwright/test";
import { Keypair } from "@stellar/stellar-sdk";

import { installFakeFreighter } from "./fake-freighter";
import { connectWallet, short } from "./helpers";

/**
 * Full circle lifecycle through the web UI, signed by a Freighter-compatible wallet and submitted
 * to Stellar testnet: create → join ×3 → (deposit ×3 + payout) ×3 → Completed.
 *
 * Needs three funded testnet accounts:
 *   HALKA_E2E_MEMBER1_SECRET, HALKA_E2E_MEMBER2_SECRET, HALKA_E2E_MEMBER3_SECRET
 * Every signed transaction hash is appended to HALKA_E2E_TX_LOG (default
 * ../docs/testnet/browser-e2e-run.jsonl).
 */

const secrets = [1, 2, 3].map((i) => process.env[`HALKA_E2E_MEMBER${i}_SECRET`]);
const logPath = path.resolve(process.env.HALKA_E2E_TX_LOG ?? "../docs/testnet/browser-e2e-run.jsonl");

test.skip(secrets.some((s) => !s), "Set HALKA_E2E_MEMBER{1,2,3}_SECRET to run against testnet.");

interface Member {
  keypair: Keypair;
  page: Page;
}

const records: { at: string; step: string; signer: string; txHash: string }[] = [];
let currentStep = "";

async function openAs(browser: Browser, keypair: Keypair, name: string): Promise<Member> {
  const size = { width: 1280, height: 800 };
  const context = await browser.newContext({
    viewport: size,
    // Each member's browser is recorded separately when E2E_VIDEO is set.
    recordVideo: process.env.E2E_VIDEO ? { dir: test.info().outputPath(name), size } : undefined,
  });
  const page = await context.newPage();
  await installFakeFreighter(page, keypair, {
    onSign: (tx) => records.push({ at: new Date().toISOString(), step: currentStep, signer: tx.signer, txHash: tx.hash }),
  });
  return { keypair, page };
}

async function openCircle(member: Member, circleId: string) {
  await member.page.goto(`/circle/${circleId}`);
  await connectWallet(member.page, member.keypair.publicKey());
  await expect(member.page.getByRole("heading", { name: `Halka #${circleId}` })).toBeVisible();
}

test("runs a full 3-member, 3-round circle with wallet-signed testnet transactions", async ({ browser }) => {
  test.setTimeout(15 * 60_000);
  const members = await Promise.all(secrets.map((s, i) => openAs(browser, Keypair.fromSecret(s!), `member${i + 1}`)));
  const addresses = members.map((m) => m.keypair.publicKey());
  const [creator] = members;

  // Create the circle.
  currentStep = "create_circle";
  await creator.page.goto("/");
  await connectWallet(creator.page, addresses[0]);
  await creator.page.getByRole("button", { name: "+ Add member" }).click();
  for (const [i, address] of addresses.entries()) {
    await creator.page.getByPlaceholder(`Member ${i + 1} address (G…)`).fill(address);
  }
  await creator.page.getByRole("spinbutton").fill("1");
  await creator.page.getByPlaceholder("10").fill("1");
  await creator.page.getByRole("button", { name: "Create circle" }).click();
  await creator.page.waitForURL(/\/circle\/\d+$/, { timeout: 120_000 });
  const circleId = creator.page.url().match(/\/circle\/(\d+)$/)![1];
  await expect(creator.page.getByText("Awaiting join")).toBeVisible();

  // Every member joins through the invite link.
  for (const [i, member] of members.entries()) {
    currentStep = `join_circle:${circleId}:member${i + 1}`;
    await member.page.goto(`/circle/${circleId}/join`);
    await connectWallet(member.page, addresses[i]);
    await member.page.getByRole("button", { name: "Join", exact: true }).click();
    await member.page.waitForURL(new RegExp(`/circle/${circleId}$`), { timeout: 120_000 });
  }
  await openCircle(creator, circleId);
  await expect(creator.page.getByText("Active", { exact: true })).toBeVisible();

  for (let round = 0; round < 3; round++) {
    for (const [i, member] of members.entries()) {
      await openCircle(member, circleId);
      await expect(member.page.getByText(`Round ${round + 1} / 3`)).toBeVisible();

      if (i === 1) {
        // Read-only check: explains why payout is not yet possible, without a signature.
        const signedBefore = records.length;
        await member.page.getByRole("button", { name: "Check why payout is unavailable" }).click();
        await expect(member.page.getByText("Not all members have contributed for this round yet.")).toBeVisible();
        expect(records).toHaveLength(signedBefore);
      }

      currentStep = `deposit:${circleId}:round${round + 1}:member${i + 1}`;
      await member.page.getByRole("button", { name: "Deposit contribution (1)" }).click();
      await expect(member.page.getByText(`${i + 1} / 3 members deposited`)).toBeVisible({ timeout: 120_000 });
    }

    const last = members[2];
    currentStep = `payout:${circleId}:round${round + 1}`;
    await last.page.getByRole("button", { name: "Trigger payout" }).click();
    const historyRow = last.page.getByRole("listitem").filter({ hasText: `Round ${round + 1}` });
    await expect(historyRow).toContainText(short(addresses[round]), { timeout: 120_000 });
  }

  await openCircle(creator, circleId);
  await expect(creator.page.getByText("Completed", { exact: true })).toBeVisible();
  expect(records).toHaveLength(1 + 3 + 3 * 4);

  // Closing the contexts finalizes any recorded videos.
  await Promise.all(members.map((m) => m.page.context().close()));
});

test.afterAll(() => {
  if (records.length === 0) return;
  appendFileSync(logPath, records.map((r) => JSON.stringify(r)).join("\n") + "\n");
});
