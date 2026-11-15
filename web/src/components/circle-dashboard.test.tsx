import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const A = "GAMYNYJR2UILL4GXGNPUSFQBMKDBXV2EVLHOIYFH34FTORBY7ULTJHIU";
const B = "GBTKI7JP6WXFBBSW6CORWJQIVUCZFKCYU2MAV3552RY4ZZDEOI2AXANG";
const C = "GC2F6KCU2QHJXYBSFIWPYX5REDFSOI7ODTK3O2OUJCDIXYJJVT2FHWGC";

const TX_HASH = "a".repeat(64);
const wallet = { address: null as string | null, connect: vi.fn() };
const refetch = vi.fn();
const circleState = {
  circle: undefined as Record<string, unknown> | undefined,
  members: undefined as { address: string; joined: boolean; depositedThisRound: boolean }[] | undefined,
};
const preflight = vi.fn();
const simulatePayout = vi.fn();
const deposit = vi.fn();
const signAndSend = vi.fn();

vi.mock("@/lib/wallet", () => ({ useWallet: () => wallet }));
vi.mock("@/lib/use-circle", () => ({
  useCircle: () => ({ ...circleState, loading: false, error: null, refetch }),
}));
vi.mock("@/lib/circle-client", () => ({
  preflightCircleAction: (...args: unknown[]) => preflight(...args),
  simulatePayoutEligibility: (...args: unknown[]) => simulatePayout(...args),
  getWalletClient: () => ({ deposit }),
}));

const { CircleDashboard } = await import("./circle-dashboard");

function setCircle(status: string, roundIndex: number, depositCount: number, deposited: string[] = []) {
  circleState.circle = {
    status: { tag: status },
    members: [A, B, C],
    payout_order: [A, B, C],
    contribution_amount: 10_000_000n,
    round_index: roundIndex,
    round_deposit_count: depositCount,
    round_deadline: BigInt(Math.floor(Date.now() / 1000) + 3600),
  };
  circleState.members = [A, B, C].map((address) => ({
    address,
    joined: true,
    depositedThisRound: deposited.includes(address),
  }));
}

beforeEach(() => {
  vi.clearAllMocks();
  wallet.address = null;
  preflight.mockResolvedValue(undefined);
  deposit.mockResolvedValue({ result: { isErr: () => false }, signAndSend });
  signAndSend.mockResolvedValue({ result: { isErr: () => false }, sendTransactionResponse: { hash: TX_HASH } });
});

describe("CircleDashboard", () => {
  it("shows a completed circle's payout history", () => {
    setCircle("Completed", 3, 0);
    render(<CircleDashboard circleId={1n} />);

    expect(screen.getByRole("heading", { name: "Halka #1" })).toBeInTheDocument();
    expect(screen.getByText("Completed")).toBeInTheDocument();
    expect(screen.getByText("Payout history")).toBeInTheDocument();
    for (const round of ["Round 1", "Round 2", "Round 3"]) {
      expect(screen.getByText(round)).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: /Deposit contribution/ })).not.toBeInTheDocument();
  });

  it("shows round progress and offers a read-only payout check before the round is complete", async () => {
    setCircle("Active", 0, 1, [A]);
    simulatePayout.mockRejectedValue(new Error("Not all members have contributed for this round yet."));
    const user = userEvent.setup();
    render(<CircleDashboard circleId={2n} />);

    expect(screen.getByText("Round 1 / 3")).toBeInTheDocument();
    expect(screen.getByText("1 / 3 members deposited")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Check why payout is unavailable" }));
    expect(simulatePayout).toHaveBeenCalledWith(2n);
    expect(await screen.findByText("Not all members have contributed for this round yet.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Trigger payout" })).not.toBeInTheDocument();
  });

  it("lets a member who has not deposited deposit, after a preflight check", async () => {
    setCircle("Active", 0, 1, [A]);
    wallet.address = B;
    const user = userEvent.setup();
    render(<CircleDashboard circleId={2n} />);

    await user.click(screen.getByRole("button", { name: "Deposit contribution (1)" }));

    expect(preflight).toHaveBeenCalledWith(2n, B, "deposit");
    expect(deposit).toHaveBeenCalledWith({ circle_id: 2n, member: B });
    expect(signAndSend).toHaveBeenCalledOnce();
    expect(refetch).toHaveBeenCalled();

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("Deposit confirmed.");
    expect(screen.getByRole("link", { name: "View transaction" })).toHaveAttribute(
      "href",
      `https://stellar.expert/explorer/testnet/tx/${TX_HASH}`
    );
  });

  it("does not request a signature when the preflight check fails", async () => {
    setCircle("Active", 0, 1, [A]);
    wallet.address = B;
    preflight.mockRejectedValue(new Error("You've already deposited your contribution for this round."));
    const user = userEvent.setup();
    render(<CircleDashboard circleId={2n} />);

    await user.click(screen.getByRole("button", { name: "Deposit contribution (1)" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("You've already deposited your contribution for this round.");
    expect(signAndSend).not.toHaveBeenCalled();
  });

  it("hides the deposit action for a member who already deposited, and offers payout when the round is full", () => {
    setCircle("Active", 0, 3, [A, B, C]);
    wallet.address = A;
    render(<CircleDashboard circleId={2n} />);

    expect(screen.queryByRole("button", { name: /Deposit contribution/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Trigger payout" })).toBeInTheDocument();
  });
});
