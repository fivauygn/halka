# Browser end-to-end run: 3 members, 3 rounds (testnet, XLM)

A full circle lifecycle driven through the web app in Chrome by the Playwright test
[`web/e2e/circle-lifecycle.spec.ts`](../../web/e2e/circle-lifecycle.spec.ts). Each member uses its own browser
context and connects through Stellar Wallets Kit's Freighter option. The wallet is a test
implementation of the Freighter extension's page protocol
([`web/e2e/fake-freighter.ts`](../../web/e2e/fake-freighter.ts)), so the app runs its unmodified
wallet code path; keys stay in the test process. Every transaction is built by the app, checked by
its preflight, signed by that wallet and submitted to Stellar testnet. All 16 transactions
succeeded.

- **Contract ID:** `CBOGI62MN5V3M7QSOKS7E6YWLLAO73LJIS3TMBMEFIADG2LDC37HUI5Q`
- **Circle ID:** `25`
- **Run date:** 2026-11-14
- **Token:** native XLM SAC · **Contribution:** 1 XLM / member / round · **Round duration:** 1 hour
- **Result:** `Completed`, payouts to member1, member2, member3 in order
- **Raw log:** [browser-e2e-run.jsonl](browser-e2e-run.jsonl)

## Members

| Member | Public key |
| --- | --- |
| member1 | `GDQAHCQIKXH6OBXO4Q2DOWCPWQRYDMDX2GZINBLP7QGH754ZPM7GT22B` |
| member2 | `GAM3R5SJDQWP4TZWARY5YHD653D2RUJ7EGZZDTBRILGYD6H4L5LFFPKY` |
| member3 | `GA6EF7FU2DEI6AFMTGY7CEKVUBLITE7HNV3MWGVBNYP7GWG4SPD2NLSN` |

## Transactions

| # | Action | Signed by | Tx |
| --- | --- | --- | --- |
| 1 | create_circle | member1 | [c10cc43f…ac9e16c5](https://stellar.expert/explorer/testnet/tx/c10cc43f76db6ec70d48dd25caaeeb7c4835c190b61e30808690c08dac9e16c5) |
| 2 | join_circle | member1 | [5747959a…586ab591](https://stellar.expert/explorer/testnet/tx/5747959ac406d172e60e0f32fc34c1538c5e858452ac547682f5d7b3586ab591) |
| 3 | join_circle | member2 | [df60fa96…306bdb9e](https://stellar.expert/explorer/testnet/tx/df60fa96c073386d907ca217ca08c188c3ddd0094eca803ffba806b5306bdb9e) |
| 4 | join_circle | member3 | [6aa81c1e…3ebfcf50](https://stellar.expert/explorer/testnet/tx/6aa81c1e74b21d5d3861aa70e66c125bccaf7322cebfbd575e72084f3ebfcf50) |
| 5 | deposit (round1) | member1 | [23a468c0…b97a55e1](https://stellar.expert/explorer/testnet/tx/23a468c03222f9911f9addd2161cd3a939fb72ecb224c376d75a17d3b97a55e1) |
| 6 | deposit (round1) | member2 | [5273b35c…6224e0e7](https://stellar.expert/explorer/testnet/tx/5273b35c2190a1fcd1610b8b214a9ef9709c7dd7d266c5e51ba4832a6224e0e7) |
| 7 | deposit (round1) | member3 | [286860e8…38414d01](https://stellar.expert/explorer/testnet/tx/286860e82c244af824c54fe75be06b869e3ecc5aa98d7477c8d7d9b338414d01) |
| 8 | payout (round1) | member3 | [c6592af5…acba7ba2](https://stellar.expert/explorer/testnet/tx/c6592af5ca1decf914660d4697923dd9e1258a4d1aa0869814543f84acba7ba2) |
| 9 | deposit (round2) | member1 | [beb54ff8…dfc09c02](https://stellar.expert/explorer/testnet/tx/beb54ff88ac7e2117248013843fda3f4f026e6250c9583d9f78bea8fdfc09c02) |
| 10 | deposit (round2) | member2 | [8a1d8723…35ea084e](https://stellar.expert/explorer/testnet/tx/8a1d8723320b8f0b67875e81a5be3fa0fd9bebee1dba3141dd6783ef35ea084e) |
| 11 | deposit (round2) | member3 | [eafd1ad1…14c75bd2](https://stellar.expert/explorer/testnet/tx/eafd1ad1abf02ee73bfa75d6914ced81a3e77c0cce47e89af8c0c5f014c75bd2) |
| 12 | payout (round2) | member3 | [89d05163…2c9f5049](https://stellar.expert/explorer/testnet/tx/89d05163cf6d2708c0a86f57d6fae4725674d965b43bc793774c76782c9f5049) |
| 13 | deposit (round3) | member1 | [e1df7054…70968432](https://stellar.expert/explorer/testnet/tx/e1df7054a9aa4ca588dc49cb77f54dc7e360d7c763e7bbeaeca8495e70968432) |
| 14 | deposit (round3) | member2 | [27b6a54a…12a3b7ed](https://stellar.expert/explorer/testnet/tx/27b6a54a4a5e27a70fd2defec8e12d34bff66da18610776d76412d6412a3b7ed) |
| 15 | deposit (round3) | member3 | [5be49ac5…c1fb0924](https://stellar.expert/explorer/testnet/tx/5be49ac55c7fa6bd317992d34aee926f294dda6aaae1dedfdffc5f69c1fb0924) |
| 16 | payout (round3) | member3 | [12c57dde…3a31992d](https://stellar.expert/explorer/testnet/tx/12c57dde4998f1269457bc1ed987bdab0102c4359e638c2bb3966f123a31992d) |

During each round, member2 also used the read-only **Check why payout is unavailable** action
before the round was complete; it showed the contract's `RoundNotComplete` message without
requesting a signature.
