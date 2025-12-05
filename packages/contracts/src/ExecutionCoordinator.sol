// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ExecutionCoordinator
 * @notice Coordinates decentralized execution of PeerHost functions.
 */
contract ExecutionCoordinator {
    
    // =============================================================
    //                           EVENTS
    // =============================================================

    /**
     * @dev Emitted when a request to execute a function is triggered.
     * @param wallet The wallet subdomain/owner.
     * @param project The project name.
     * @param fn The function name.
     * @param cid The IPFS CID of the function code.
     * @param requestId Unique ID for this execution request.
     */
    event ExecutionRequested(
        address indexed wallet, 
        string project, 
        string fn, 
        string cid, 
        bytes32 requestId
    );


    // =============================================================
    //                           STATE
    // =============================================================

    mapping(bytes32 => bool) public processedRequests;
    uint256 public nonce;

    // =============================================================
    //                         FUNCTIONS
    // =============================================================

    /**
     * @notice Triggers an execution request on the network.
     * @dev Anyone can trigger, but typically the Gateway does this on behalf of a user.
     * @param wallet The wallet address owning the function.
     * @param project The project identifier.
     * @param fn The function identifier.
     * @param cid The IPFS Content Identifier.
     * @param inputHash Optional hash of inputs (for verification).
     */
    function triggerRequest(
        address wallet, 
        string calldata project, 
        string calldata fn, 
        string calldata cid, 
        bytes32 inputHash
    ) external returns (bytes32) {
        // Generate a unique Request ID
        bytes32 requestId = keccak256(
            abi.encodePacked(
                msg.sender,
                wallet,
                project,
                fn,
                cid,
                inputHash,
                block.timestamp,
                nonce
            )
        );

        nonce++;

        processedRequests[requestId] = true;

        emit ExecutionRequested(wallet, project, fn, cid, requestId);

        return requestId;
    }
}
