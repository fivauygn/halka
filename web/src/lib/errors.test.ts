import { describe, expect, it } from "vitest";

import { contractCallError, contractErrorMessage, describeError } from "./errors";

const failed = (message: string, simulationError?: string) => ({
  result: { unwrapErr: () => ({ message }) },
  simulation: simulationError ? { error: simulationError } : undefined,
});

describe("contractCallError", () => {
  it("uses the error variant reported by the SDK", () => {
    expect(contractCallError(failed("NotMember")).message).toBe("This address is not a member of this circle.");
  });

  it("falls back to the contract error code in the simulation when the SDK message is empty", () => {
    // Shape returned by @stellar/stellar-sdk for a failed simulation on testnet.
    expect(contractCallError(failed("", "HostError: Error(Contract, #12)")).message).toBe(
      "Not all members have contributed for this round yet."
    );
  });

  it("reports an unknown error when no code is available", () => {
    expect(contractCallError(failed("")).message).toBe("An unknown contract error occurred.");
  });
});

describe("contractErrorMessage", () => {
  it("maps contract error variants to plain language", () => {
    expect(contractErrorMessage("RoundNotComplete")).toBe("Not all members have contributed for this round yet.");
    expect(contractErrorMessage("NotMember")).toBe("This address is not a member of this circle.");
  });

  it("falls back to the variant name or a generic message", () => {
    expect(contractErrorMessage("SomethingNew")).toBe("SomethingNew");
    expect(contractErrorMessage(undefined)).toBe("An unknown contract error occurred.");
  });
});

describe("describeError", () => {
  it("explains wallet cancellations and rejections", () => {
    expect(describeError(new Error("The user closed the modal."))).toBe("Wallet selection was cancelled.");
    expect(describeError({ message: "User declined access" })).toBe(
      "The transaction was not approved in the wallet."
    );
  });

  it("explains missing wallets and network failures", () => {
    expect(describeError(new Error("Wallet not found"))).toMatch(/No compatible wallet was found/);
    expect(describeError(new TypeError("Failed to fetch"))).toMatch(/could not reach the Stellar testnet/);
    expect(describeError(new Error("NetworkError when attempting to fetch resource."))).toMatch(
      /could not reach the Stellar testnet/
    );
  });

  it("explains an account that is not funded on testnet", () => {
    expect(describeError(new Error("Account not found: GAFXJXPAHCOI4OE6W5E6CNG757UOQNP6RPV3AMACD4BOAUOTBTQXBKI3"))).toBe(
      "This account isn't funded on Stellar testnet yet. Fund it with Friendbot (friendbot.stellar.org) and try again."
    );
  });

  it("keeps the wrong-network message instead of reporting a connection error", () => {
    const message = "Your wallet is not on the Stellar Testnet. Switch networks in the wallet and reconnect.";
    expect(describeError(new Error(message))).toBe(message);
  });

  it("finds contract error variants inside raw simulation errors", () => {
    expect(describeError(new Error("HostError: Error(Contract, #12) AlreadyDepositedThisRound"))).toBe(
      "You've already deposited your contribution for this round."
    );
  });

  it("passes unknown errors through unchanged", () => {
    expect(describeError("plain string")).toBe("plain string");
  });
});
