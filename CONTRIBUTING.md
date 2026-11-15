# Contributing to Halka

Thanks for your interest in improving Halka. Bug reports, fixes and documentation improvements are
welcome.

## Reporting issues

- **Bugs and feature requests:** open a [GitHub issue](https://github.com/fivauygn/halka/issues)
  with steps to reproduce, what you expected and what happened. Testnet transaction hashes help.
- **Security vulnerabilities:** do not open a public issue; follow [SECURITY.md](SECURITY.md).

## Development setup

Prerequisites: Rust (stable) with the `wasm32v1-none` target, Stellar CLI v27 or later, Node.js 24
or later and Google Chrome (used by the browser tests).

```bash
# Contract
rustup target add wasm32v1-none
cargo test --workspace
stellar contract build

# Web app
cd web
npm install
npm run dev
```

## Tests

| Command | What it covers |
| --- | --- |
| `cargo test --workspace` | Contract unit tests |
| `npm run lint` and `npx tsc --noEmit` (in `web/`) | Linting and type checks |
| `npm test` (in `web/`) | Unit and component tests (Vitest, Testing Library) |
| `npm run test:e2e` (in `web/`) | Browser tests (Playwright); read-only against testnet |
| `npm run test:contract` (in `web/`) | Contract regression run on testnet; needs funded test accounts |

The browser suite also contains a full circle lifecycle with signed testnet transactions. It is
skipped unless three funded **testnet** accounts are provided:

```bash
export HALKA_E2E_MEMBER1_SECRET="$(stellar keys secret <alias-1>)"
export HALKA_E2E_MEMBER2_SECRET="$(stellar keys secret <alias-2>)"
export HALKA_E2E_MEMBER3_SECRET="$(stellar keys secret <alias-3>)"
npm run test:e2e
```

Never use keys that hold real funds, and never commit secret keys. To create throwaway funded
accounts, run `npx tsx scripts/fund-testnet-accounts.ts NAME…` (it prints the public keys), or use
`stellar keys generate <alias> --network testnet --fund`. The
[Testnet workflow](.github/workflows/testnet.yml) does the same in CI and can be started from the
Actions tab.

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Keep changes focused; add or update tests for behavior changes.
3. Make sure CI passes: contract tests and build, web lint, type checks, unit tests, browser tests
   and build.
4. Describe what changed and why in the pull request. Link related issues.

Commit messages use the imperative mood (for example, "Fix payout preflight for completed
circles"). By contributing, you agree that your contributions are licensed under the
[MIT License](LICENSE).
