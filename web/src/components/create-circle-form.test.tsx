import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { NATIVE_TOKEN_ID } from "@/lib/config";

const MEMBER_A = "GAMYNYJR2UILL4GXGNPUSFQBMKDBXV2EVLHOIYFH34FTORBY7ULTJHIU";
const MEMBER_B = "GBTKI7JP6WXFBBSW6CORWJQIVUCZFKCYU2MAV3552RY4ZZDEOI2AXANG";
const MEMBER_C = "GC2F6KCU2QHJXYBSFIWPYX5REDFSOI7ODTK3O2OUJCDIXYJJVT2FHWGC";

const wallet = { address: MEMBER_A as string | null, connect: vi.fn() };
const push = vi.fn();
const signAndSend = vi.fn();
const createCircle = vi.fn();

vi.mock("@/lib/wallet", () => ({ useWallet: () => wallet }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/lib/circle-client", () => ({
  getWalletClient: () => ({ create_circle: createCircle }),
}));

const { CreateCircleForm } = await import("./create-circle-form");

async function fillMembers(user: ReturnType<typeof userEvent.setup>, addresses: string[]) {
  for (let i = 2; i < addresses.length; i++) {
    await user.click(screen.getByRole("button", { name: "+ Add member" }));
  }
  for (const [i, address] of addresses.entries()) {
    await user.type(screen.getByPlaceholderText(`Member ${i + 1} address (G…)`), address);
  }
}

beforeEach(() => {
  vi.clearAllMocks();
  wallet.address = MEMBER_A;
  signAndSend.mockResolvedValue({ result: { isErr: () => false, unwrap: () => 7n } });
  createCircle.mockResolvedValue({ signAndSend });
});

describe("CreateCircleForm", () => {
  it("asks for a wallet connection when no wallet is connected", async () => {
    wallet.address = null;
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    await user.click(screen.getByRole("button", { name: "Connect wallet to continue" }));

    expect(wallet.connect).toHaveBeenCalledOnce();
    expect(screen.queryByRole("button", { name: "Create circle" })).not.toBeInTheDocument();
  });

  it("requires every member address", async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    await user.type(screen.getByPlaceholderText("Member 1 address (G…)"), MEMBER_A);
    await user.click(screen.getByRole("button", { name: "Create circle" }));

    expect(screen.getByText("All member addresses must be filled in.")).toBeInTheDocument();
    expect(createCircle).not.toHaveBeenCalled();
  });

  it("rejects invalid and duplicate addresses", async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    await fillMembers(user, [MEMBER_A, "GNOTANADDRESS"]);
    await user.click(screen.getByRole("button", { name: "Create circle" }));
    expect(screen.getByText("One or more member addresses is not a valid Stellar address (G…).")).toBeInTheDocument();

    const second = screen.getByPlaceholderText("Member 2 address (G…)");
    await user.clear(second);
    await user.type(second, MEMBER_A);
    await user.click(screen.getByRole("button", { name: "Create circle" }));
    expect(screen.getByText("The member list has a duplicate address.")).toBeInTheDocument();
    expect(createCircle).not.toHaveBeenCalled();
  });

  it("rejects an invalid contribution amount, and blocks a zero round duration", async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);
    await fillMembers(user, [MEMBER_A, MEMBER_B]);

    const amount = screen.getByPlaceholderText("10");
    await user.clear(amount);
    await user.type(amount, "0");
    await user.click(screen.getByRole("button", { name: "Create circle" }));
    expect(screen.getByText("Amount must be greater than zero.")).toBeInTheDocument();

    await user.clear(amount);
    await user.type(amount, "5");
    const duration = screen.getByLabelText("Round duration (hours)");
    await user.clear(duration);
    await user.type(duration, "0");
    // The duration input has min=1, so the browser's own validation blocks submission.
    expect(duration).toBeInvalid();
    await user.click(screen.getByRole("button", { name: "Create circle" }));
    expect(createCircle).not.toHaveBeenCalled();
  });

  it("adds and removes member rows", async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    expect(screen.queryByRole("button", { name: /Remove member/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "+ Add member" }));
    expect(screen.getByRole("textbox", { name: "Member 3 address" })).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Remove member/ })).toHaveLength(3);

    await user.click(screen.getByRole("button", { name: "Remove member 3" }));
    expect(screen.queryByPlaceholderText("Member 3 address (G…)")).not.toBeInTheDocument();
  });

  it("creates the circle with the entered parameters and opens it", async () => {
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    await fillMembers(user, [MEMBER_A, MEMBER_B, MEMBER_C]);
    const amount = screen.getByPlaceholderText("10");
    await user.clear(amount);
    await user.type(amount, "2.5");
    const duration = screen.getByLabelText("Round duration (hours)");
    await user.clear(duration);
    await user.type(duration, "1");
    await user.click(screen.getByRole("button", { name: "Create circle" }));

    expect(createCircle).toHaveBeenCalledWith({
      creator: MEMBER_A,
      token: NATIVE_TOKEN_ID,
      members: [MEMBER_A, MEMBER_B, MEMBER_C],
      payout_order: [MEMBER_A, MEMBER_B, MEMBER_C],
      contribution_amount: 25_000_000n,
      round_timeout_secs: 3600n,
    });
    expect(signAndSend).toHaveBeenCalledOnce();
    expect(push).toHaveBeenCalledWith("/circle/7");
  });

  it("shows a plain-language error when the wallet rejects the transaction", async () => {
    signAndSend.mockRejectedValue(new Error("User declined access"));
    const user = userEvent.setup();
    render(<CreateCircleForm />);

    await fillMembers(user, [MEMBER_A, MEMBER_B]);
    await user.click(screen.getByRole("button", { name: "Create circle" }));

    expect(await screen.findByText("The transaction was not approved in the wallet.")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
