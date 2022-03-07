pragma ton-solidity >= 0.57.0;

import "@broxus/contracts/contracts/libraries/MsgFlag.sol";

import "ton-eth-bridge-token-contracts/contracts/TokenRootUpgradeable.sol";
import "ton-eth-bridge-token-contracts/contracts/interfaces/ITransferableOwnership.sol";

import "./libraries/TokenUpdaterErrors.sol";
import "./libraries/TokenUpdaterGas.sol";

import "./TokenUpdater.sol";
import "./interfaces/ITokenUpdaterCreatedCallback.sol";

import "./structures/NumeratorDenominatorStructure.sol";

contract TokenUpdaterFactory is NumeratorDenominatorStructure {

    uint32 static randomNonce_;

    address owner_;

    TvmCell rootCode_;
    TvmCell walletCode_;
    TvmCell walletPlatformCode_;
    TvmCell updaterCode_;

    event UpdaterCreated(address oldRoot, address newRoot, address updater);

    constructor(address _owner) public {
        require(_owner.value != 0, TokenUpdaterErrors.WRONG_OWNER);

        tvm.accept();
        tvm.rawReserve(TokenUpdaterGas.TARGET_BALANCE, 0);

        owner_ = _owner;
        owner_.transfer({value: 0, flag: MsgFlag.ALL_NOT_RESERVED + MsgFlag.IGNORE_ERRORS });
    }

    modifier onlyOwner {
        require(msg.sender.value != 0 && msg.sender == owner_, TokenUpdaterErrors.NOT_MY_OWNER);
        _;
    }

    function owner() external view responsible returns (address) {
        return { value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS } owner_;
    }

    function rootCode() external view responsible returns (TvmCell) {
        return { value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS } rootCode_;
    }

    function walletCode() external view responsible returns (TvmCell) {
        return { value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS } walletCode_;
    }

    function walletPlatformCode() external view responsible returns (TvmCell) {
        return { value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS } walletPlatformCode_;
    }

    function updaterCode() external view responsible returns (TvmCell) {
        return { value: 0, bounce: false, flag: MsgFlag.REMAINING_GAS } updaterCode_;
    }

    function createUpdater(
        uint32 callId,
        address oldRoot,
        address updaterOwner,
        string name,
        string symbol,
        uint8 decimals,
        NumeratorDenominator ratio,
        bool burnByRootDisabled,
        bool burnPaused,
        address remainingGasTo
    ) public view {
        require(msg.value >= TokenUpdaterGas.CREATE_UPDATER);
        tvm.rawReserve(TokenUpdaterGas.TARGET_BALANCE, 0);

        TvmCell rootInitData = tvm.buildStateInit({
            contr: TokenRootUpgradeable,
            varInit: {
                randomNonce_: now,
                deployer_: address(this),
                rootOwner_: address(this),
                name_: name,
                symbol_: symbol,
                decimals_: decimals,
                walletCode_: walletCode_,
                platformCode_: walletPlatformCode_
            },
            pubkey: 0,
            code: rootCode_
        });

        address newRoot = new TokenRootUpgradeable {
            stateInit: rootInitData,
            value: TokenUpdaterGas.DEPLOY_TOKEN_ROOT,
            flag: MsgFlag.SENDER_PAYS_FEES
        }(
            address(0),
            0,
            0,
            false,
            burnByRootDisabled,
            burnPaused,
            remainingGasTo
        );

        TvmCell updaterInitData = tvm.buildStateInit({
            contr: TokenUpdater,
            varInit: {
                factory: address(this),
                oldRoot: oldRoot,
                newRoot: newRoot,
                ratio: ratio
            },
            pubkey: 0,
            code: updaterCode_
        });

        address updater = new TokenUpdater {
            stateInit: updaterInitData,
            value: TokenUpdaterGas.DEPLOY_UPDATER,
            flag: MsgFlag.SENDER_PAYS_FEES
        }(updaterOwner, remainingGasTo);

        emit UpdaterCreated(oldRoot, newRoot, updater);

        ITokenUpdaterCreatedCallback(msg.sender).onTokenUpdaterCreated{
            value: TokenUpdaterGas.SUCCESS_CALLBACK,
            flag: MsgFlag.SENDER_PAYS_FEES,
            bounce: false
        }(callId, oldRoot, newRoot, updater);

        ITransferableOwnership(newRoot).transferOwnership{
            value: 0,
            flag: MsgFlag.ALL_NOT_RESERVED
        }(updater, remainingGasTo, emptyMap);
    }

    function renounceOwnership() external onlyOwner {
        owner_ = address(0);
        msg.sender.transfer({value: 0, flag: MsgFlag.REMAINING_GAS + MsgFlag.IGNORE_ERRORS });
    }

    function setRootCode(TvmCell _rootCode) public onlyOwner {
        rootCode_ = _rootCode;
        msg.sender.transfer({value: 0, flag: MsgFlag.REMAINING_GAS + MsgFlag.IGNORE_ERRORS });
    }

    function setWalletCode(TvmCell _walletCode) public onlyOwner {
        walletCode_ = _walletCode;
        msg.sender.transfer({value: 0, flag: MsgFlag.REMAINING_GAS + MsgFlag.IGNORE_ERRORS });
    }

    function setWalletPlatformCode(TvmCell _walletPlatformCode) public onlyOwner {
        walletPlatformCode_ = _walletPlatformCode;
        msg.sender.transfer({value: 0, flag: MsgFlag.REMAINING_GAS + MsgFlag.IGNORE_ERRORS });
    }

    function setUpdaterCode(TvmCell _updaterCode) public onlyOwner {
        updaterCode_ = _updaterCode;
        msg.sender.transfer({value: 0, flag: MsgFlag.REMAINING_GAS + MsgFlag.IGNORE_ERRORS });
    }
}
