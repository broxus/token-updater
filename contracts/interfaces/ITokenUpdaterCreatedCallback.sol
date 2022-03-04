pragma ton-solidity >= 0.57.0;

interface ITokenUpdaterCreatedCallback {
    function onTokenUpdaterCreated(
        address oldRoot,
        address newRoot,
        address updater
    ) external;
}
