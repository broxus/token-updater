pragma ton-solidity >= 0.57.0;

library TokenUpdaterGas {
    uint128 constant TARGET_BALANCE                   = 1 ton;
    uint128 constant CREATE_UPDATER                   = 9 ton;
    uint128 constant DEPLOY_TOKEN_ROOT                = 3 ton;
    uint128 constant DEPLOY_UPDATER                   = 2 ton;
    uint128 constant DEPLOY_WALLET_GRAMS              = 0.1 ton;

    uint128 constant SUCCESS_CALLBACK                 = 0.001 ton;
}
