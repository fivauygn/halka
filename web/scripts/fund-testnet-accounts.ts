/**
 * Creates fresh testnet accounts funded by Friendbot and exposes their secrets to later CI steps.
 *
 * Usage: tsx scripts/fund-testnet-accounts.ts NAME [NAME ...]
 * Each NAME becomes an environment variable holding a new secret key. In GitHub Actions the
 * secrets are masked in logs and written to $GITHUB_ENV; outside CI only public keys are printed.
 */
import { appendFileSync } from "node:fs";

import { Keypair } from "@stellar/stellar-sdk";

const names = process.argv.slice(2);
if (names.length === 0) {
  console.error("Usage: tsx scripts/fund-testnet-accounts.ts NAME [NAME ...]");
  process.exit(1);
}

async function fund(publicKey: string) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const response = await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    if (response.ok) return;
    if (attempt === 3) throw new Error(`Friendbot failed for ${publicKey}: HTTP ${response.status}`);
    await new Promise((resolve) => setTimeout(resolve, 2_000 * attempt));
  }
}

async function main() {
  const githubEnv = process.env.GITHUB_ENV;
  for (const name of names) {
    const keypair = Keypair.random();
    await fund(keypair.publicKey());
    if (githubEnv) {
      console.log(`::add-mask::${keypair.secret()}`);
      appendFileSync(githubEnv, `${name}=${keypair.secret()}\n`);
    }
    console.log(`${name}: ${keypair.publicKey()}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
