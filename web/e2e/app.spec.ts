import { expect, test } from "@playwright/test";
import { Keypair, Networks } from "@stellar/stellar-sdk";

import { installFakeFreighter } from "./fake-freighter";
import { connectWallet, short } from "./helpers";

// Read-only browser tests: they read live testnet state but never sign or submit a transaction.

const COMPLETED_FIVE_MEMBER_CIRCLE = 1;
const FIVE_MEMBERS = [
  "GAMYNYJR2UILL4GXGNPUSFQBMKDBXV2EVLHOIYFH34FTORBY7ULTJHIU",
  "GBTKI7JP6WXFBBSW6CORWJQIVUCZFKCYU2MAV3552RY4ZZDEOI2AXANG",
  "GC2F6KCU2QHJXYBSFIWPYX5REDFSOI7ODTK3O2OUJCDIXYJJVT2FHWGC",
  "GDVUAI3W7WVPBKZZZBLFUDBQFPS7TAZ4T2QJXYEHNVZ4SYLQOF3QLXPM",
  "GAAEGZZTLWIHEWENYLYZNEO4CBSMMRI7RSZTAQOPCGJ62P6PNEURZO7B",
];

test("connects and disconnects a Freighter-compatible wallet", async ({ page }) => {
  const keypair = Keypair.random();
  await installFakeFreighter(page, keypair);
  await page.goto("/");

  await connectWallet(page, keypair.publicKey());
  const header = page.getByRole("banner");
  await expect(header.getByText("Varial")).toBeVisible();
  await expect(page.getByRole("button", { name: "Create circle" })).toBeVisible();

  await header.getByRole("button", { name: "Disconnect" }).click();
  await expect(header.getByRole("button", { name: "Connect wallet" })).toBeVisible();
});

test("refuses a wallet that is not on testnet", async ({ page }) => {
  await installFakeFreighter(page, Keypair.random(), { networkPassphrase: Networks.PUBLIC });
  await page.goto("/");

  const header = page.getByRole("banner");
  await header.getByRole("button", { name: "Connect wallet" }).click();
  await page.locator("li", { hasText: /^Varial$/ }).click();

  await expect(
    header.getByText("Your wallet is not on the Stellar Testnet. Switch networks in the wallet and reconnect.")
  ).toBeVisible();
  await expect(header.getByRole("button", { name: "Connect wallet" })).toBeVisible();
});

test("validates the create-circle form before asking the wallet to sign", async ({ page }) => {
  const keypair = Keypair.random();
  const signed: string[] = [];
  await installFakeFreighter(page, keypair, { onSign: (tx) => signed.push(tx.hash) });
  await page.goto("/");
  await connectWallet(page, keypair.publicKey());

  await page.getByPlaceholder("Member 1 address (G…)").fill(keypair.publicKey());
  await page.getByPlaceholder("Member 2 address (G…)").fill("GNOTAVALIDADDRESS");
  await page.getByRole("button", { name: "Create circle" }).click();

  await expect(page.getByText("One or more member addresses is not a valid Stellar address (G…).")).toBeVisible();
  expect(signed).toHaveLength(0);
});

test("shows a completed circle with its full payout history", async ({ page }) => {
  await page.goto(`/circle/${COMPLETED_FIVE_MEMBER_CIRCLE}`);

  await expect(page.getByRole("heading", { name: `Halka #${COMPLETED_FIVE_MEMBER_CIRCLE}` })).toBeVisible();
  await expect(page.getByText("Completed", { exact: true })).toBeVisible();
  await expect(page.getByText("5 members · Contribution: 5 / round")).toBeVisible();
  for (const [round, member] of FIVE_MEMBERS.entries()) {
    const row = page.getByRole("listitem").filter({ hasText: `Round ${round + 1}` });
    await expect(row).toContainText(short(member));
  }
});

test("closes the invite page once a circle is no longer forming", async ({ page }) => {
  await page.goto(`/circle/${COMPLETED_FIVE_MEMBER_CIRCLE}/join`);

  await expect(page.getByText("This circle is no longer open for joining — invitations are closed.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Join" })).toHaveCount(0);
});
