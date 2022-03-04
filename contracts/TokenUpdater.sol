pragma ton-solidity >= 0.57.0;

pragma AbiHeader time;
pragma AbiHeader expire;

import "./interfaces/ILegacyBurnTokensCallback.sol";

import "ton-eth-bridge-token-contracts/contracts/interfaces/ITokenRoot.sol";
import "ton-eth-bridge-token-contracts/contracts/interfaces/ITransferableOwnership.sol";

import "./libraries/TokenUpdaterErrors.sol";
import "./libraries/TokenUpdaterGas.sol";

import '@broxus/contracts/contracts/access/InternalOwner.sol';
import "@broxus/contracts/contracts/libraries/MsgFlag.sol";

contract TokenUpdater is InternalOwner {

    address static public factory;

    address static public oldRoot;
    address static public newRoot;

    uint128 public upgradedCount;

    constructor(address _owner, address remainingGasTo) public {
        if(msg.sender == factory) {
            tvm.rawReserve(TokenUpdaterGas.TARGET_BALANCE, 0);
            setOwnership(_owner);
            remainingGasTo.transfer({value: 0, flag: MsgFlag.ALL_NOT_RESERVED, bounce: false});
        } else {
            remainingGasTo.transfer({value: 0, flag: MsgFlag.ALL_NOT_RESERVED + MsgFlag.DESTROY_IF_ZERO, bounce: false});
        }
    }

    function transferTokenOwnership(address newOwner, address remainingGasTo) external view onlyOwner {
        tvm.rawReserve(TokenUpdaterGas.TARGET_BALANCE, 0);
        ITransferableOwnership(newRoot).transferOwnership{
            value: 0,
            flag: MsgFlag.ALL_NOT_RESERVED
        }(newOwner, remainingGasTo, emptyMap);
    }


    // Legacy token migration
    fallback() external {
        tvm.rawReserve(TokenUpdaterGas.TARGET_BALANCE, 0);
        TvmSlice bodySlice = msg.data;
        uint32 functionId = bodySlice.decode(uint32);
        require(functionId == tvm.functionId(ILegacyBurnTokensCallback.burnCallback), TokenUpdaterErrors.NOT_LEGACY_BURN);
        (uint128 tokens,, address sender_address)
            = bodySlice.decode(uint128, uint256, address);
        TvmCell payload = bodySlice.loadRef();
        bodySlice = bodySlice.loadRefAsSlice();
        address send_gas_to = bodySlice.decode(address);

        if (oldRoot == msg.sender) {
            upgradedCount += tokens;

            ITokenRoot(newRoot).mint{value: 0, flag: MsgFlag.ALL_NOT_RESERVED}(
                tokens,
                sender_address,
                TokenUpdaterGas.DEPLOY_WALLET_GRAMS,
                send_gas_to,
                true,
                payload
            );
        } else {
            send_gas_to.transfer({value: 0, flag: MsgFlag.ALL_NOT_RESERVED});
        }
    }
}
