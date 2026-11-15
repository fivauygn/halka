import { afterEach, describe, expect, it, vi } from "vitest";

import { describeError } from "./errors";
import { WALLET_TIMEOUT_MESSAGE, withWalletTimeout } from "./wallet-timeout";

afterEach(() => {
  vi.useRealTimers();
});

describe("withWalletTimeout", () => {
  it("passes through a wallet answer that arrives in time", async () => {
    await expect(withWalletTimeout(Promise.resolve("signed"), 1_000)).resolves.toBe("signed");
  });

  it("passes through a wallet rejection unchanged", async () => {
    await expect(withWalletTimeout(Promise.reject(new Error("User declined access")), 1_000)).rejects.toThrow(
      "User declined access"
    );
  });

  it("gives up when the wallet never answers", async () => {
    vi.useFakeTimers();
    const pending = withWalletTimeout(new Promise<string>(() => {}), 120_000);
    const assertion = expect(pending).rejects.toThrow(WALLET_TIMEOUT_MESSAGE);
    await vi.advanceTimersByTimeAsync(120_000);
    await assertion;
  });

  it("is shown to the user unchanged", () => {
    expect(describeError(new Error(WALLET_TIMEOUT_MESSAGE))).toBe(WALLET_TIMEOUT_MESSAGE);
  });
});
