import { expect, type Page } from "@playwright/test";

/** Opens the Stellar Wallets Kit modal and picks the Freighter-compatible option. */
export async function connectWallet(page: Page, address: string) {
  await page.getByRole("banner").getByRole("button", { name: "Connect wallet" }).click();
  await page.locator("li", { hasText: /^Varial$/ }).click();
  await expect(page.getByRole("banner").getByText(`${address.slice(0, 4)}…${address.slice(-4)}`)).toBeVisible();
}

export function short(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}
