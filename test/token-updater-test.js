const { expect } = require('chai');
const logger = require('mocha-logger');
const BigNumber = require('bignumber.js');
BigNumber.config({EXPONENTIAL_AT: 257});

const NEW_TOKEN_CONTRACTS_PATH = 'node_modules/ton-eth-bridge-token-contracts/build'
const OLD_TOKEN_CONTRACTS_PATH = 'precompiled'

let Account;
let OldRoot;
let NewRoot;
let AccountOldWallet;
let AccountNewWallet;
let TokenWalletPlatform;
let Factory;
let Updater;

async function latestCreated() {
  const {
    result
  } = await locklift.ton.client.net.query_collection({
    collection: 'messages',
    filter: {
      src: {eq: Factory.address},
      msg_type: {eq: 2}
    },
    order: [{path: 'created_at', direction: "DESC"}, {path: 'created_lt', direction: "DESC"}],
    limit: 1,
    result: 'body id src created_at created_lt'
  });

  const decodedMessage = await locklift.ton.client.abi.decode_message_body({
    abi: {
      type: 'Contract',
      value: Factory.abi
    },
    body: result[0].body,
    is_internal: false
  });

  return decodedMessage.value;
}

describe('Test Tokens updater', async function() {
  describe('Contracts', async function() {
    this.timeout(200000);
    it('Load contract codes', async function() {
      Account = await locklift.factory.getAccount('Wallet');
      OldRoot = await locklift.factory.getContract('RootTokenContract', OLD_TOKEN_CONTRACTS_PATH);
      AccountOldWallet = await locklift.factory.getContract('TONTokenWallet', OLD_TOKEN_CONTRACTS_PATH);
      NewRoot = await locklift.factory.getContract('TokenRootUpgradeable', NEW_TOKEN_CONTRACTS_PATH);
      AccountNewWallet = await locklift.factory.getContract('TokenWalletUpgradeable', NEW_TOKEN_CONTRACTS_PATH);
      TokenWalletPlatform = await locklift.factory.getContract('TokenWalletPlatform', NEW_TOKEN_CONTRACTS_PATH);
      Factory = await locklift.factory.getContract('TokenUpdaterFactory');
      Updater = await locklift.factory.getContract('TokenUpdater');
      
      expect(Account.code).not.to.equal(undefined, 'Account Code should be available');
      expect(Account.abi).not.to.equal(undefined, 'Account ABI should be available');

      expect(OldRoot.code).not.to.equal(undefined, 'OldRoot Code should be available');
      expect(OldRoot.abi).not.to.equal(undefined, 'OldRoot ABI should be available');

      expect(AccountOldWallet.code).not.to.equal(undefined, 'AccountOldWallet Code should be available');
      expect(AccountOldWallet.abi).not.to.equal(undefined, 'AccountOldWallet ABI should be available');

      expect(NewRoot.code).not.to.equal(undefined, 'NewRoot Code should be available');
      expect(NewRoot.abi).not.to.equal(undefined, 'NewRoot ABI should be available');

      expect(AccountNewWallet.code).not.to.equal(undefined, 'AccountNewWallet Code should be available');
      expect(AccountNewWallet.abi).not.to.equal(undefined, 'AccountNewWallet ABI should be available');

      expect(TokenWalletPlatform.code).not.to.equal(undefined, 'TokenWalletPlatform Code should be available');
      expect(TokenWalletPlatform.abi).not.to.equal(undefined, 'TokenWalletPlatform ABI should be available');

      expect(Factory.code).not.to.equal(undefined, 'Factory Code should be available');
      expect(Factory.abi).not.to.equal(undefined, 'Factory ABI should be available');

      expect(Updater.code).not.to.equal(undefined, 'Updater Code should be available');
      expect(Updater.abi).not.to.equal(undefined, 'Updater ABI should be available');
    });
    
    it('Deploy contracts', async function() {
      const [keyPair] = await locklift.keys.getKeyPairs();

      logger.log(`Deploying Account`);
      await locklift.giver.deployContract({
        contract: Account,
        constructorParams: {},
        initParams: {
          _randomNonce: locklift.utils.getRandomNonce(),
        },
        keyPair
      }, locklift.utils.convertCrystal(30, 'nano'));

      logger.log(`Account: ${Account.address}`);

      logger.log(`Deploying Factory`);
      await locklift.giver.deployContract({
        contract: Factory,
        constructorParams: {
          _owner: Account.address
        },
        initParams: {
          randomNonce_: locklift.utils.getRandomNonce(),
        },
        keyPair,
      }, locklift.utils.convertCrystal(2, 'nano'));

      logger.log(`TokenUpdaterFactory: ${Factory.address}`);

      logger.log(`TokenUpdaterFactory.setRootCode`);
      await Account.runTarget({
        contract: Factory,
        method: 'setRootCode',
        params: {_rootCode: NewRoot.code},
        keyPair
      });

      logger.log(`TokenUpdaterFactory.setWalletCode`);
      await Account.runTarget({
        contract: Factory,
        method: 'setWalletCode',
        params: {_walletCode: AccountNewWallet.code},
        keyPair
      });

      logger.log(`TokenUpdaterFactory.setWalletPlatformCode`);
      await Account.runTarget({
        contract: Factory,
        method: 'setWalletPlatformCode',
        params: {_walletPlatformCode: TokenWalletPlatform.code},
        keyPair
      });

      logger.log(`TokenUpdaterFactory.setUpdaterCode`);
      await Account.runTarget({
        contract: Factory,
        method: 'setUpdaterCode',
        params: {_updaterCode: Updater.code},
        keyPair
      });

      logger.log(`Deploying OldRoot`);
      await locklift.giver.deployContract({
        contract: OldRoot,
        constructorParams: {
          root_public_key_: `0x0`,
          root_owner_address_: Account.address
        },
        initParams: {
          name: new Buffer.from('Old token').toString('hex'),
          symbol: new Buffer.from('OLD').toString('hex'),
          decimals: 9,
          wallet_code: AccountOldWallet.code
        },
        keyPair,
      }, locklift.utils.convertCrystal(1, 'nano'));

      logger.log(`OldRoot: ${OldRoot.address}`);

      logger.log(`TokenUpdaterFactory.createUpdater`);
      await Account.runTarget({
        contract: Factory,
        method: 'createUpdater',
        params: {
          callId: 0,
          oldRoot: OldRoot.address,
          updaterOwner: Account.address,
          name: 'New token',
          symbol: 'NEW',
          decimals: 9,
          burnByRootDisabled: true,
          burnPaused: false,
          remainingGasTo: Account.address
        },
        value: locklift.utils.convertCrystal(10, 'nano'),
        keyPair
      });

      const event = await latestCreated();

      NewRoot.setAddress(event.newRoot);
      Updater.setAddress(event.updater);

      logger.log(`NewRoot: ${NewRoot.address}`);
      logger.log(`Updater: ${Updater.address}`);

      const accountNewWallet = await NewRoot.call({ method: 'walletOf', params: {
          walletOwner: Account.address
      }})
      AccountNewWallet.setAddress(accountNewWallet);
      logger.log(`AccountNewWallet: ${AccountNewWallet.address}`);

      expect(Account.address).to.be.a('string')
        .and.satisfy(s => s.startsWith('0:'), 'Bad Account address');
      expect(OldRoot.address).to.be.a('string')
          .and.satisfy(s => s.startsWith('0:'), 'Bad OldRoot address');
      expect(NewRoot.address).to.be.a('string')
          .and.satisfy(s => s.startsWith('0:'), 'Bad NewRoot address');
      expect(AccountNewWallet.address).to.be.a('string')
          .and.satisfy(s => s.startsWith('0:'), 'Bad Account address');
      expect(Factory.address).to.be.a('string')
          .and.satisfy(s => s.startsWith('0:'), 'Bad Account address');
      expect(Updater.address).to.be.a('string')
          .and.satisfy(s => s.startsWith('0:'), 'Bad Account address');
    });

    it('Mint old tokens', async function() {
      const [keyPair] = await locklift.keys.getKeyPairs();


      logger.log(`OldRoot.deployWallet`);
      await Account.runTarget({
        contract: OldRoot,
        method: 'deployWallet',
        params: {
          tokens: locklift.utils.convertCrystal(100, 'nano'),
          deploy_grams: locklift.utils.convertCrystal('0.1', 'nano'),
          wallet_public_key_: `0x0`,
          owner_address_: Account.address,
          gas_back_address: Account.address,
        },
        value: locklift.utils.convertCrystal(1, 'nano'),
        keyPair
      });

      const accountOldWallet = await OldRoot.call({ method: 'getWalletAddress', params: {
          _answer_id: 0,
          wallet_public_key_: `0x0`,
          owner_address_: Account.address
        }});

      AccountOldWallet.setAddress(accountOldWallet);
      logger.log(`AccountOldWallet: ${AccountOldWallet.address}`);

      const balance = (await AccountOldWallet.call({ method: 'balance', params: { _answer_id: 0 } })).toString();

      logger.log(`AccountOldWallet balance: ${new BigNumber(balance).shiftedBy(-9).toFixed()}`);

      expect(AccountOldWallet.address).to.be.a('string')
          .and.satisfy(s => s.startsWith('0:'), 'Bad AccountOldWallet address');
      expect(balance).to.be.equal(
          locklift.utils.convertCrystal(100, 'nano'),
          'Bad AccountOldWallet balance');

    });

    it('Upgrade half of tokens', async function() {

      const [keyPair] = await locklift.keys.getKeyPairs();

      logger.log(`AccountOldWallet.burnByOwner`);

      await Account.runTarget({
        contract: AccountOldWallet,
        method: 'burnByOwner',
        params: {
          tokens: locklift.utils.convertCrystal(50, 'nano'),
          grams: locklift.utils.convertCrystal('1', 'nano'),
          send_gas_to: Account.address,
          callback_address: Updater.address,
          callback_payload: 'te6ccgEBAQEAAgAAAA=='
        },
        value: locklift.utils.convertCrystal(1, 'nano'),
        keyPair
      });

      const oldBalance = (await AccountOldWallet.call({ method: 'balance', params: { _answer_id: 0 } })).toString();
      const newBalance = (await AccountNewWallet.call({ method: 'balance', params: {} })).toString();
      const upgradedCount = (await Updater.call({ method: 'upgradedCount', params: {} })).toString();

      logger.log(`Account balance: 
      OLD = ${new BigNumber(oldBalance).shiftedBy(-9).toFixed()}, 
      NEW = ${new BigNumber(newBalance).shiftedBy(-9).toFixed()}`);

      expect(oldBalance).to.be.equal(
          locklift.utils.convertCrystal(50, 'nano'),
          'Bad AccountOldWallet balance');
      expect(newBalance).to.be.equal(
          locklift.utils.convertCrystal(50, 'nano'),
          'Bad AccountNewWallet balance');
      expect(upgradedCount).to.be.equal(
          locklift.utils.convertCrystal(50, 'nano'),
          'Bad upgradedCount');

    });

    it('Transfer token ownership', async function() {
      const [keyPair] = await locklift.keys.getKeyPairs();

      logger.log(`Updater.transferTokenOwnership`);

      await Account.runTarget({
        contract: Updater,
        method: 'transferTokenOwnership',
        params: {
          newOwner: AccountOldWallet.address,
          remainingGasTo: Account.address
        },
        value: locklift.utils.convertCrystal(1, 'nano'),
        keyPair
      });

      const newOwner = (await NewRoot.call({ method: 'rootOwner', params: { } })).toString();

      expect(newOwner).to.be.equal(AccountOldWallet.address,
          'Bad NewRoot owner');
    });
  });
});
