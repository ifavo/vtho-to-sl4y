# Commands

- `yarn build` – Compile Contracts
- `yarn test` – Run Tests
- `yarn deploy` – Run Deploy Scripts
- `yarn test:watch` – Run Tests in Watchmode (run when files change)
- `yarn coverage` – Display Code Coverage
- `yarn typechain` – Update Types

# Project Setup

Install all required dependencies using yarn:

```shell
yarn install
```

## Generate your own private keys

For example by running the below command to generate a new random wallet:

```bash
echo "PRIVATE_KEY=0x$(openssl rand -hex 32)" > .env.production
```

- `PRIVATE_KEY` is your wallet deploying and upgrading the contracts
- storing the details in `.env.production` creates a new environment named `production`


## Encrypt your private keys

```bash
npx dotenvx encrypt
```

the output will look similar to this:

```bash
$ npx dotenvx encrypt
Update available 0.20.0 → 0.32.0 [see changelog](dotenvx.com/changelog)
✔ encrypted to .env.vault (.env,.env.example,.env.production)
ℹ commit .env.vault to code: [git commit -am ".env.vault"]
✔ key added to .env.keys (DOTENV_KEY_PRODUCTION)
ℹ push .env.keys up to hub: [dotenvx hub push]
ℹ run [DOTENV_KEY='dotenv://:key_d2765b31f83ee454c369fb5a29b72d7bf4cdd08e2280618f892b24afb209671d@dotenvx.com/vault/.env.vault?environment=production' dotenvx run -- yourcommand] to test decryption locally
```

- This also adds a new line in `.env.vault` with the encrypted details
- You can delete `.env.production` now
- Backup your private key!

# Deploy

## Test Deployment

Depoy on TestNet to check for errors using the previous `DOTENV_KEY`:

```shell
DOTENV_KEY='...' yarn deploy --network vechain_testnet
```

The output should look similar to this:

```shell
[dotenvx@0.20.0] injecting env (1) from encrypted .env.vault
[dotenv@16.4.5][INFO] Loading env from encrypted .env.vault
Warning: SPDX license identifier not provided in source file. Before publishing, consider adding a comment containing "SPDX-License-Identifier: <SPDX-License>" to each source file. Use "SPDX-License-Identifier: UNLICENSED" for non-open-source code. Please see https://spdx.org for more information.
--> contracts/TestERC20.sol


Generating typings for: 35 artifacts in dir: typechain-types for target: ethers-v6
Successfully generated 100 typings!
Compiled 35 Solidity files successfully (evm target: paris).
Deploying SL4YMinter from 0x984A76543E49E751F651A65237bA1C4d7618B4A2
deploying "SL4YMinter_Implementation" (tx: 0xc846090c7feb341d407aca649b486d32c0f9a3e3952f8852e0c2f5626e3a443d)...: deployed at 0xF1A74a7B5c2B03Ae5951aAe728FA099c07dAb5A1 with 3717093 gas
deploying "SL4YMinter_Proxy" (tx: 0x4861168921f7f8ec3a665aedeb6645f60e590e61c319de68465e010afd132a4b)...: deployed at 0x49f8e1F81dF3da4d3313B429ba29C474Df12452a with 654862 gas
SL4YMinter is available at 0x49f8e1F81dF3da4d3313B429ba29C474Df12452a
```

Take note of this line:

```shell
Deploying SL4YMinter from 0x984A76543E49E751F651A65237bA1C4d7618B4A2
```

This is your deploying wallet, it will need VTHO to deploy the contracts. You need to send VTHO to its address, to be able to deploy.


## Main Deployment

```shell
DOTENV_KEY='...' yarn deploy --network vechain_mainnet
```

If deployment fails with:

```shell
deploying "SL4YMinter_Implementation"403 post transactions: tx rejected: insufficient energy {"code":-32000} ProviderRpcError: 403 post transactions: tx rejected: insufficient energy
```

Then your deploying wallet requires more VTHO.

# Misc

- **Upgrading**: Whenever you do changes to the contracts, re-run the previous deployment command and it will deploy the upgrades automatically ensuring your contract address remains the same.
- **Addresses**: Addresses and ABIs are found in the `delpoyments/<network>` folder.
- **Reset**: Reset a whole network requires removings it folder from the `deployments/` folder. For example deleting `deployments/vechain_testnet` will re-deploy all contracts on the next run.
- **Private Keys**: Always make sure you never commit `.env.*`files (except `.env.vault`) to git.
