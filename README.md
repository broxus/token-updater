## Description
Smart contracts to update old TIP-3 standard tokens to the new TIP-3.1 standard.

## TokenUpdaterFactory

Mainnet address: `0:ede0eaab4f24e2bdb3224fcabf4fa4507d4df5b66ca0d6e63321dd448dde9e23`

ABI: [TokenUpdaterFactory.abi.json](https://github.com/broxus/token-updater/blob/change_decimals/build/TokenUpdaterFactory.abi.json)

## How it works:

Public method `TokenUpdaterFactory.createUpdater` allows you to deploy new `TokenRoot` + `TokenUpdater` contracts.

After deployment `TokenUpdater` is owner of `TokenRoot`.

When `TokenUpdater` receives a burn callback from an old token root, it will mint new tokens.

`TokenUpdater` allows its owner to receive `TokenRoot` ownership. But in this case, users will no longer be able to update tokens.

## How to allow upgrade tokens for users:

### 1. Create TokenUpdater

Run the `TokenUpdaterFactory.createUpdater` method.\
Gas value: 10 EVER

Parameters: \
`callId` - This value is only used for callbacks. Recommended value: 0.\
`oldRoot` - Old token address.\
`updaterOwner` - Address which can acquire new TokenRoot ownership in the future.\
`name` - New token name. Recommended value: same as the old token name.\
`symbol` - New token symbol. Recommended value: same as the old token symbol.\
`decimals` - New token decimals. Recommended value: same as the old token decimals.\
`ratio` - The coefficient. `amountToMint = burnedAmount * ratio.numerator / ratio.denominator`\
`burnByRootDisabled` - Disable burn via the root functionality for new tokens. Recommended value: true.\
`burnPaused` - Pause burn of new tokens. Recommended value: false.\
`remainingGasTo` - Address for remaining gas.

Addresses of deployed contracts can be found in emitted event \
```event UpdaterCreated(address oldRoot, address newRoot, address updater);```

### 2. Create pull-request to the repository https://github.com/broxus/everscale-assets-upgrade

Modify `main.json` by adding item
```
{
    "symbol": "<symbol>",
    "logoURI": "<icon url>",
    "rootV4": "<old token root address>",
    "rootV5": "<new token root address>",
    "proxy": "<updater address>"
}
```

### 3. After the pull-request has been merged, it will be possible for users to upgrade tokens using DAPPs https://flatqube.io or https://octusbridge.io
