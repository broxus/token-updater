const BigNumber = require('bignumber.js');
BigNumber.config({EXPONENTIAL_AT: 257});

const NEW_TOKEN_CONTRACTS_PATH = 'node_modules/ton-eth-bridge-token-contracts/build'

const newOwner = '0:0000000000000000000000000000000000000000000000000000000000000000'

async function main() {
    const [keyPair] = await locklift.keys.getKeyPairs();

    const Account = await locklift.factory.getAccount('Wallet');

    const TokenRootUpgradeable = await locklift.factory.getContract('TokenRootUpgradeable', NEW_TOKEN_CONTRACTS_PATH);
    const TokenWalletUpgradeable = await locklift.factory.getContract('TokenWalletUpgradeable', NEW_TOKEN_CONTRACTS_PATH);
    const TokenWalletPlatform = await locklift.factory.getContract('TokenWalletPlatform', NEW_TOKEN_CONTRACTS_PATH);
    const TokenUpdaterFactory = await locklift.factory.getContract('TokenUpdaterFactory');
    const TokenUpdater = await locklift.factory.getContract('TokenUpdater');

    await locklift.giver.deployContract({
      contract: Account,
      constructorParams: {},
      initParams: {
        _randomNonce: locklift.utils.getRandomNonce(),
      },
      keyPair
    }, locklift.utils.convertCrystal(20, 'nano'));

    console.log(`Deploying TokenUpdaterFactory`);
    await locklift.giver.deployContract({
      contract: TokenUpdaterFactory,
      constructorParams: {
        _owner: Account.address
      },
      initParams: {
        randomNonce_: locklift.utils.getRandomNonce(),
      },
      keyPair,
    }, locklift.utils.convertCrystal(2, 'nano'));

    console.log(`TokenUpdaterFactory: ${TokenUpdaterFactory.address}`);

    console.log(`TokenUpdaterFactory.setRootCode`);
    await Account.runTarget({
      contract: TokenUpdaterFactory,
      method: 'setRootCode',
      params: {_rootCode: TokenRootUpgradeable.code},
      keyPair
    });

    console.log(`TokenUpdaterFactory.setWalletCode`);
    await Account.runTarget({
      contract: TokenUpdaterFactory,
      method: 'setWalletCode',
      params: {_walletCode: TokenWalletUpgradeable.code},
      keyPair
    });

    console.log(`TokenUpdaterFactory.setWalletPlatformCode`);
    await Account.runTarget({
      contract: TokenUpdaterFactory,
      method: 'setWalletPlatformCode',
      params: {_walletPlatformCode: TokenWalletPlatform.code},
      keyPair
    });

    console.log(`TokenUpdaterFactory.setUpdaterCode`);
    await Account.runTarget({
      contract: TokenUpdaterFactory,
      method: 'setUpdaterCode',
      params: {_updaterCode: TokenUpdater.code},
      keyPair
    });

  console.log(`Transfer ownership for TokenUpdaterFactory`);
  await Account.runTarget({
    contract: TokenUpdaterFactory,
    method: 'transferOwner',
    params: {newOwner: newOwner, answerId: '0'},
    value: locklift.utils.convertCrystal(1, 'nano'),
    keyPair: keyPair
  });
}


main()
  .then(() => process.exit(0))
  .catch(e => {
    console.log(e);
    process.exit(1);
  });
