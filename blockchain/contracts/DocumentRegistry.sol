// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title DocumentRegistry
/// @notice Stores only SHA-256 document digests. Never store names, Aadhaar, PAN, or file bytes.
contract DocumentRegistry {
    struct Record {
        address registrar;
        uint256 timestamp;
        bool exists;
    }

    mapping(bytes32 => Record) private records;

    event DigestRegistered(bytes32 indexed digest, address indexed registrar, uint256 timestamp);

    function register(bytes32 digest) external {
        require(digest != bytes32(0), "empty digest");
        require(!records[digest].exists, "already registered");
        records[digest] = Record({
            registrar: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });
        emit DigestRegistered(digest, msg.sender, block.timestamp);
    }

    function verify(bytes32 digest) external view returns (bool exists, address registrar, uint256 timestamp) {
        Record memory rec = records[digest];
        return (rec.exists, rec.registrar, rec.timestamp);
    }
}
