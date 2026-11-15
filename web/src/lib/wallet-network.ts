/**
 * Reads the network passphrase reported by the connected wallet.
 *
 * Some Stellar Wallets Kit modules (Albedo, Hana) cannot report their network and throw a
 * "does not support the getNetwork function" error. For those, this returns null and the app
 * relies on passing the Testnet passphrase with every signing request. Any other error is rethrown.
 */
export async function walletNetworkPassphrase(
  getNetwork: () => Promise<{ networkPassphrase: string }>
): Promise<string | null> {
  try {
    return (await getNetwork()).networkPassphrase;
  } catch (error) {
    if (isUnsupportedNetworkQuery(error)) return null;
    throw error;
  }
}

function isUnsupportedNetworkQuery(error: unknown): boolean {
  const message =
    typeof error === "object" && error !== null && "message" in error ? String(error.message) : String(error);
  return /does not support the "getNetwork" function/i.test(message);
}
