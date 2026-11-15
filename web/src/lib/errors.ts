import { Errors } from "@/lib/contracts/circle";

const CONTRACT_ERROR_MESSAGES: Record<string, string> = {
  InvalidMemberCount: "A circle must have at least 2 members.",
  DuplicateMember: "The member list has the same address more than once.",
  InvalidPayoutOrder: "The payout order must be a permutation of the member list.",
  InvalidAmount: "The contribution amount must be greater than zero.",
  InvalidTimeout: "Round duration must be greater than zero.",
  CircleNotFound: "This circle could not be found.",
  CircleNotForming: "This circle is no longer open for joining (it's already active or completed).",
  CircleNotActive: "This circle isn't active yet — waiting for all members to join.",
  NotMember: "This address is not a member of this circle.",
  AlreadyJoined: "This member has already joined.",
  AlreadyDepositedThisRound: "You've already deposited your contribution for this round.",
  RoundNotComplete: "Not all members have contributed for this round yet.",
  RoundNotTimedOut: "The reclaim window for this round hasn't opened yet.",
  NothingToReclaim: "You have no contribution to reclaim.",
};

/** Maps a contract Error variant name (e.g. "NotMember") to a plain-language message. */
export function contractErrorMessage(name: string | undefined): string {
  if (!name) return "An unknown contract error occurred.";
  return CONTRACT_ERROR_MESSAGES[name] ?? name;
}

interface FailedContractCall {
  result: { unwrapErr(): { message?: string } };
  simulation?: unknown;
}

/** Turns a failed contract call into an Error with a plain-language message. The SDK can return
 * an empty error message, so the contract error code is also read from the simulation result. */
export function contractCallError(call: FailedContractCall): Error {
  let name = call.result.unwrapErr().message;
  if (!name) {
    const raw = String((call.simulation as { error?: unknown } | undefined)?.error ?? "");
    const code = raw.match(/Error\(Contract, #(\d+)\)/)?.[1];
    name = code ? Errors[Number(code) as keyof typeof Errors]?.message : undefined;
  }
  return new Error(contractErrorMessage(name));
}

/** Turns any thrown error (wallet rejection, network failure, contract
 * error) into a message safe to show the user directly. */
export function describeError(err: unknown): string {
  const raw = err instanceof Error
    ? err.message
    : typeof err === "object" && err !== null && "message" in err
      ? String(err.message)
      : String(err);
  const lower = raw.toLowerCase();

  if (lower.includes("account not found")) {
    return "This account isn't funded on Stellar testnet yet. Fund it with Friendbot (friendbot.stellar.org) and try again.";
  }
  if (lower.includes("user closed the modal")) {
    return "Wallet selection was cancelled.";
  }
  if (lower.includes("user declined") || lower.includes("rejected")) {
    return "The transaction was not approved in the wallet.";
  }
  if (lower.includes("wallet") && lower.includes("not found")) {
    return "No compatible wallet was found. Install a supported wallet or select another option.";
  }
  if (lower.includes("failed to fetch") || lower.includes("network error") || lower.includes("networkerror")) {
    return "Network error — could not reach the Stellar testnet. Please try again.";
  }

  for (const [name, message] of Object.entries(CONTRACT_ERROR_MESSAGES)) {
    if (raw.includes(name)) return message;
  }

  return raw;
}
