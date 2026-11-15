/** How long the app waits for the wallet to approve or reject a signing request. */
export const WALLET_RESPONSE_TIMEOUT_MS = 120_000;

export const WALLET_TIMEOUT_MESSAGE =
  "The wallet did not respond. Open your wallet to approve or decline the request, then try again.";

/**
 * Rejects if the wallet has not answered a signing request in time, so the app never stays stuck
 * on "Creating…" or "Processing…" when a wallet window was closed or hidden. Nothing is submitted
 * without a signature, so giving up is safe.
 */
export function withWalletTimeout<T>(request: Promise<T>, ms = WALLET_RESPONSE_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(WALLET_TIMEOUT_MESSAGE)), ms);
  });
  return Promise.race([request, timeout]).finally(() => clearTimeout(timer));
}
