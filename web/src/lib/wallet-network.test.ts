import { describe, expect, it } from "vitest";

import { walletNetworkPassphrase } from "./wallet-network";

const TESTNET = "Test SDF Network ; September 2015";

describe("walletNetworkPassphrase", () => {
  it("returns the passphrase a wallet reports (Freighter)", async () => {
    await expect(walletNetworkPassphrase(async () => ({ networkPassphrase: TESTNET }))).resolves.toBe(TESTNET);
  });

  it("returns null for wallets that cannot report their network (Albedo, Hana)", async () => {
    // Errors exactly as thrown by Stellar Wallets Kit 2.8's Albedo and Hana modules.
    for (const wallet of ["Albedo", "Hana"]) {
      await expect(
        walletNetworkPassphrase(async () => {
          throw { code: -3, message: `${wallet} does not support the "getNetwork" function` };
        })
      ).resolves.toBeNull();
    }
  });

  it("rethrows any other wallet error", async () => {
    await expect(
      walletNetworkPassphrase(async () => {
        throw new Error("User declined access");
      })
    ).rejects.toThrow("User declined access");
  });
});
