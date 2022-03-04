pragma ton-solidity >= 0.57.0;

library TokenUpdaterErrors {
    uint16 constant NOT_MY_OWNER                     = 101;
    uint16 constant NOT_PENDING_OWNER                = 102;
    uint16 constant WRONG_OWNER                      = 103;

    uint16 constant NOT_LEGACY_BURN                  = 200;
}
