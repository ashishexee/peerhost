// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ExecutionCoordinator
 * @notice Coordinates decentralized execution of PeerHost functions.
 */
contract ExecutionCoordinator {
    // =============================================================
    //                           STATE
    // =============================================================

    address public owner;
    uint256 public constant REWARD_AMOUNT = 0.001 ether;

    struct Request {
        address requester;
        address worker;
        bytes32 resultHash;
        bool isCompleted;
    }

    mapping(bytes32 => Request) public requests;
    mapping(bytes32 => bool) public processedRequests; // request ID deduplication
    uint256 public nonce;

    // =============================================================
    //                           EVENTS
    // =============================================================

    /**
     * @dev Emitted when a request to execute a function is triggered.
     */
    event ExecutionRequested(
        address indexed wallet,
        string project,
        string fn,
        string cid,
        bytes32 requestId
    );

    /**
     * @dev Emitted when a result is submitted by a worker.
     */
    event ResultSubmitted(
        bytes32 indexed requestId,
        address indexed worker,
        bytes32 resultHash
    );

    event TreasuryDeposited(address indexed sender, uint256 amount);
    event RewardPaid(address indexed worker, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // =============================================================
    //                         FUNCTIONS
    // =============================================================

    /**
     * @notice Allows the owner to fund the treasury.
     */
    function depositTreasury() external payable onlyOwner {
        emit TreasuryDeposited(msg.sender, msg.value);
    }

    /**
     * @notice Allows the owner to withdraw funds.
     */
    function withdrawTreasury() external onlyOwner {
        payable(owner).transfer(address(this).balance);
    }

    /**
     * @notice Triggers an execution request on the network.
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

        requests[requestId] = Request({
            requester: msg.sender,
            worker: address(0),
            resultHash: bytes32(0),
            isCompleted: false
        });

        emit ExecutionRequested(wallet, project, fn, cid, requestId);

        return requestId;
    }

    /**
     * @notice Submits the result of an execution.
     * @dev First worker to submit gets recorded as the winner.
     * @param requestId The ID of the request.
     * @param resultHash The hash of the execution result.
     */
    function submitResult(bytes32 requestId, bytes32 resultHash) external {
        require(processedRequests[requestId], "Request does not exist");
        require(!requests[requestId].isCompleted, "Request already completed");
        require(resultHash != bytes32(0), "Invalid result hash");

        Request storage request = requests[requestId];
        request.worker = msg.sender;
        request.resultHash = resultHash;
        request.isCompleted = true;

        emit ResultSubmitted(requestId, msg.sender, resultHash);

        // PAYOUT LOGIC
        if (address(this).balance >= REWARD_AMOUNT) {
            payable(msg.sender).transfer(REWARD_AMOUNT);
            emit RewardPaid(msg.sender, REWARD_AMOUNT);
        }
    }
}
