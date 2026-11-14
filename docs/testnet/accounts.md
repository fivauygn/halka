# Testnet accounts

Accounts funded via Friendbot and used for the testnet runs in this folder. Only public keys are
listed; secret keys stay in the local Stellar CLI identity store and are never committed.

| Alias | Role | Public key |
| --- | --- | --- |
| `deployer` | Deploys the contract; creator in the CLI runs | `GCIDRR6NMN6WIRWVKIMUSNX4TVLDUR5XDBH2T3E57U57FCKB4IUCLHYJ` |
| `member1` | Circle member | `GAMYNYJR2UILL4GXGNPUSFQBMKDBXV2EVLHOIYFH34FTORBY7ULTJHIU` |
| `member2` | Circle member | `GBTKI7JP6WXFBBSW6CORWJQIVUCZFKCYU2MAV3552RY4ZZDEOI2AXANG` |
| `member3` | Circle member | `GC2F6KCU2QHJXYBSFIWPYX5REDFSOI7ODTK3O2OUJCDIXYJJVT2FHWGC` |
| `member4` | Circle member | `GDVUAI3W7WVPBKZZZBLFUDBQFPS7TAZ4T2QJXYEHNVZ4SYLQOF3QLXPM` |
| `member5` | Circle member | `GAAEGZZTLWIHEWENYLYZNEO4CBSMMRI7RSZTAQOPCGJ62P6PNEURZO7B` |

The wallets used for the USDC run are listed in
[three-member-cycle-usdc.md](three-member-cycle-usdc.md#member-wallets-public-keys-only).

To create or re-fund an account:

```bash
stellar keys generate <alias> --network testnet --fund
stellar keys public-key <alias>
```
