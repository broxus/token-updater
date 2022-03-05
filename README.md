## Description 
Contracts for update old tip-3 standard tokens to new tip-3.1 standard.

## TokenUpdaterFactory

Mainnet address: `0:992d790ee8aadd1f2a3b41a392a55a1fd00a8dcafbb0fd29444e0ad7c458d526`

ABI: [TokenUpdaterFactory.abi.json](https://github.com/broxus/token-updater/blob/master/build/TokenUpdaterFactory.abi.json)

## How it works:

Public method `TokenUpdaterFactory.createUpdater` allows to deploy new `TokenRoot` + `TokenUpdater` contracts.

After deployment `TokenUpdater` is owner of `TokenRoot`.

When `TokenUpdater` receive burn callback from old token root, it mint new tokens.

`TokenUpdater` allows to it's owner receive `TokenRoot` ownership. But in this case tokens updating possibility will stop for users.

## How to allow upgrade token for users: 

### 1. Create TokenUpdater

Run `TokenUpdaterFactory.createUpdater` method.\
Gas value: 10 EVER

Params: \
`callId` - This value used only for callbacks. Reccomended value: 0.\
`oldRoot` - Old token address.\
`updaterOwner` - Address which can get new TokenRoot ownership in the future.\
`name` - New token name. Reccomended value: same as old token name.\
`symbol` - New token symbol. Reccomended value: same as old token symbol.\
`decimals` - New token decimals. Reccomended value: same as old token decimals.\
`burnByRootDisabled` - Disable burn by root functionality for new token. Reccomended value: true.\
`burnPaused` - Pause burn of new token. Reccomended value: false.\
`remainingGasTo` - Address for remaining gas. 

Addresses of deployed contracts can be found in emited event \
```event UpdaterCreated(address oldRoot, address newRoot, address updater);```

### 2. Create pull-request to repository https://github.com/broxus/everscale-assets-upgrade

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