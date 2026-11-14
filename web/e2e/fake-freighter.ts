import { hash, Keypair, Networks, TransactionBuilder } from "@stellar/stellar-sdk";
import type { Page } from "@playwright/test";

/**
 * Emulates the Freighter browser extension for end-to-end tests.
 *
 * Freighter's page API (`@stellar/freighter-api`, used by Stellar Wallets Kit) talks to the
 * extension through `window.postMessage`. This installs a listener that answers those messages the
 * way the extension does, so the app runs its real wallet code path unchanged. Signing happens in
 * the Node test process; the secret key never enters the page.
 */

export interface SignedTransaction {
  hash: string;
  signer: string;
}

interface FreighterRequest {
  type: string;
  transactionXdr?: string;
  entryXdr?: string;
  networkPassphrase?: string;
}

export interface FakeFreighterOptions {
  /** Network the fake wallet reports. Defaults to Stellar testnet. */
  networkPassphrase?: string;
  /** Called after every transaction the fake wallet signs. */
  onSign?: (tx: SignedTransaction) => void;
}

export async function installFakeFreighter(page: Page, keypair: Keypair, options: FakeFreighterOptions = {}) {
  const networkPassphrase = options.networkPassphrase ?? Networks.TESTNET;
  const isTestnet = networkPassphrase === Networks.TESTNET;

  await page.exposeFunction("__halkaFakeFreighter", (request: FreighterRequest) => {
    const publicKey = keypair.publicKey();
    switch (request.type) {
      case "REQUEST_ACCESS":
      case "REQUEST_PUBLIC_KEY":
        return { publicKey };
      case "REQUEST_ALLOWED_STATUS":
      case "SET_ALLOWED_STATUS":
        return { isAllowed: true };
      case "REQUEST_CONNECTION_STATUS":
        return { isConnected: true };
      case "REQUEST_NETWORK":
      case "REQUEST_NETWORK_DETAILS":
        return {
          network: isTestnet ? "TESTNET" : "PUBLIC",
          networkPassphrase,
          networkDetails: {
            network: isTestnet ? "TESTNET" : "PUBLIC",
            networkName: isTestnet ? "Test Net" : "Main Net",
            networkUrl: isTestnet ? "https://horizon-testnet.stellar.org" : "https://horizon.stellar.org",
            networkPassphrase,
            sorobanRpcUrl: isTestnet ? "https://soroban-testnet.stellar.org" : undefined,
          },
        };
      case "SUBMIT_TRANSACTION": {
        const tx = TransactionBuilder.fromXDR(request.transactionXdr!, request.networkPassphrase ?? networkPassphrase);
        tx.sign(keypair);
        options.onSign?.({ hash: tx.hash().toString("hex"), signer: publicKey });
        return { signedTransaction: tx.toXDR(), signerAddress: publicKey };
      }
      case "SUBMIT_AUTH_ENTRY": {
        const signature = keypair.sign(hash(Buffer.from(request.entryXdr!, "base64")));
        return { signedAuthEntry: signature.toString("base64"), signerAddress: publicKey };
      }
      default:
        return { apiError: { code: -1, message: `Unsupported request: ${request.type}` } };
    }
  });

  await page.addInitScript(() => {
    const w = window as unknown as {
      freighter: boolean;
      __halkaFakeFreighter: (request: unknown) => Promise<Record<string, unknown>>;
    };
    w.freighter = true;
    window.addEventListener("message", async (event) => {
      const data = event.data as { source?: string; messageId?: number } | null;
      if (event.source !== window || data?.source !== "FREIGHTER_EXTERNAL_MSG_REQUEST") return;
      const response = await w.__halkaFakeFreighter(data);
      // The real extension echoes the id back under the (misspelled) key `messagedId`.
      window.postMessage(
        { source: "FREIGHTER_EXTERNAL_MSG_RESPONSE", messagedId: data.messageId, ...response },
        window.location.origin
      );
    });
  });
}
