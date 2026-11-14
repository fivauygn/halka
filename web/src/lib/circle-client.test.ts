import { beforeEach, describe, expect, it, vi } from "vitest";

const MEMBER = "GAMYNYJR2UILL4GXGNPUSFQBMKDBXV2EVLHOIYFH34FTORBY7ULTJHIU";
const OTHER = "GBTKI7JP6WXFBBSW6CORWJQIVUCZFKCYU2MAV3552RY4ZZDEOI2AXANG";
const OUTSIDER = "GDVUAI3W7WVPBKZZZBLFUDBQFPS7TAZ4T2QJXYEHNVZ4SYLQOF3QLXPM";

const ok = <T,>(value: T) => ({ result: { isErr: () => false, unwrap: () => value } });

const state = {
  circle: {} as Record<string, unknown>,
  deposited: false,
  ledgerCloseTime: 1_000,
};

vi.mock("@/lib/contracts/circle", () => ({
  networks: { testnet: { contractId: "CTEST", networkPassphrase: "Test SDF Network ; September 2015" } },
  Errors: { 12: { message: "RoundNotComplete" } },
  Client: class {
    get_circle = async () => ok(state.circle);
    has_deposited_current_round = async () => ok(state.deposited);
    // Mirrors the SDK on testnet: an empty error message, with the code only in the simulation.
    payout = async () => ({
      result: { isErr: () => true, unwrapErr: () => ({ message: "" }) },
      simulation: { error: "HostError: Error(Contract, #12)" },
    });
  },
  rpc: {
    Server: class {
      getLatestLedger = async () => ({ closeTime: state.ledgerCloseTime });
    },
  },
}));

const { preflightCircleAction, simulatePayoutEligibility } = await import("./circle-client");

function activeCircle(overrides: Record<string, unknown> = {}) {
  return {
    status: { tag: "Active" },
    members: [MEMBER, OTHER],
    round_deposit_count: 1,
    round_deadline: 2_000n,
    ...overrides,
  };
}

beforeEach(() => {
  state.circle = activeCircle();
  state.deposited = false;
  state.ledgerCloseTime = 1_000;
});

describe("preflightCircleAction", () => {
  it("allows a member who has not deposited this round to deposit", async () => {
    await expect(preflightCircleAction(1n, MEMBER, "deposit")).resolves.toMatchObject({ members: [MEMBER, OTHER] });
  });

  it("rejects actions on a circle that is not active", async () => {
    state.circle = activeCircle({ status: { tag: "Completed" } });
    await expect(preflightCircleAction(1n, MEMBER, "deposit")).rejects.toThrow(
      "This circle is not active, so this action is unavailable."
    );
  });

  it("rejects deposits from non-members", async () => {
    await expect(preflightCircleAction(1n, OUTSIDER, "deposit")).rejects.toThrow(
      "Your connected wallet is not an eligible member of this circle."
    );
  });

  it("rejects a second deposit in the same round", async () => {
    state.deposited = true;
    await expect(preflightCircleAction(1n, MEMBER, "deposit")).rejects.toThrow(
      "You've already deposited your contribution for this round."
    );
  });

  it("only allows payout once every member has deposited", async () => {
    await expect(preflightCircleAction(1n, OUTSIDER, "payout")).rejects.toThrow(
      "Not all members have contributed for this round yet."
    );
    state.circle = activeCircle({ round_deposit_count: 2 });
    await expect(preflightCircleAction(1n, OUTSIDER, "payout")).resolves.toBeDefined();
  });

  it("only allows reclaim after the round deadline, by a member who deposited", async () => {
    state.deposited = true;
    await expect(preflightCircleAction(1n, MEMBER, "reclaim")).rejects.toThrow(
      "The reclaim window for this round hasn't opened yet."
    );

    state.ledgerCloseTime = 3_000;
    await expect(preflightCircleAction(1n, MEMBER, "reclaim")).resolves.toBeDefined();

    state.deposited = false;
    await expect(preflightCircleAction(1n, MEMBER, "reclaim")).rejects.toThrow(
      "You have no contribution to reclaim."
    );
  });
});

describe("simulatePayoutEligibility", () => {
  it("surfaces the contract's simulated error in plain language", async () => {
    await expect(simulatePayoutEligibility(1n)).rejects.toThrow(
      "Not all members have contributed for this round yet."
    );
  });
});
