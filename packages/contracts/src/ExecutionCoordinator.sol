// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "openzeppelin-contracts/contracts/utils/cryptography/ECDSA.sol";
import "openzeppelin-contracts/contracts/utils/cryptography/MessageHashUtils.sol";

contract ExecutionCoordinator {
    using ECDSA for bytes32;
    using MessageHashUtils for bytes32;

    uint256 public constant REWARD_TOTAL = 0.05 ether;
    uint256 public constant REWARD_FAST_BONUS = 0.03 ether;
    uint256 public constant MIN_STAKE = 2 ether;
    uint256 public constant UNBAN_PENALTY = 1 ether;
    uint256 public constant PROBATION_TARGET = 30;

    address public owner;
    uint256 public totalUserStakes;

    struct Request {
        address requester;
        bytes32 resultHash;
        bool isCompleted;
    }

    struct StakerInfo {
        uint256 stakedAmount;
        bool isBlacklisted;
        uint256 probationCount;
        uint256 penaltyDeposited;
    }

    mapping(address => address) public workerToUser;
    mapping(address => address[]) public userToWorkers;
    mapping(address => StakerInfo) public workerStakes;
    mapping(address => bool) public isGateway;
    mapping(bytes32 => Request) public requests;
    mapping(bytes32 => bool) public processedRequests;
    mapping(address => uint256) public depositedForCredits;

    uint256 public nonce;
    event ExecutionRequested(
        address indexed wallet,
        string project,
        string fn,
        string cid,
        bytes32 requestId
    );
    event ResultFinalized(
        bytes32 indexed requestId,
        bytes32 resultHash,
        address winner
    );
    event WorkerRegistered(address indexed worker, address indexed user);
    event WorkerRevoked(address indexed worker, address indexed user);
    event CreditDeposited(address indexed user, uint256 amount);
    event Staked(address indexed user, address indexed worker, uint256 amount);
    event StakeWithdrawn(
        address indexed user,
        address indexed worker,
        uint256 amount
    );
    event SlashingProbationStarted(
        address indexed user,
        address indexed worker
    );
    event WorkerUnbanned(address indexed worker);
    event WorkerSlashed(address indexed worker);
    event RewardsDistributed(uint256 totalAmount, uint256 winnerCount);

    constructor() {
        owner = msg.sender;
        isGateway[msg.sender] = true;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    modifier onlyGateway() {
        require(isGateway[msg.sender], "Not gateway");
        _;
    }

    function setGateway(address _gateway, bool _status) external onlyOwner {
        isGateway[_gateway] = _status;
    }

    function depositTreasury() external payable {}

    function withdrawTreasury(uint256 amount) external onlyOwner {
        require(
            address(this).balance >= totalUserStakes + amount,
            "Cannot withdraw user stakes"
        );
        payable(owner).transfer(amount);
    }

    function registerWorker(address worker) external {
        require(worker != address(0), "Invalid worker address");
        require(
            workerToUser[worker] == address(0),
            "Worker already registered"
        );
        require(worker != msg.sender, "Cannot register self");

        workerToUser[worker] = msg.sender;
        userToWorkers[msg.sender].push(worker);

        emit WorkerRegistered(worker, msg.sender);
    }

    function depositCredits() external payable {
        require(msg.value > 0, "No FUNDS to deposit");
        depositedForCredits[msg.sender] += msg.value;
        emit CreditDeposited(msg.sender, msg.value);
    }

    function revokeWorker(address worker) external {
        require(workerToUser[worker] == msg.sender, "Not owner of worker");
        delete workerToUser[worker];
        address[] storage workers = userToWorkers[msg.sender];
        for (uint256 i = 0; i < workers.length; i++) {
            if (workers[i] == worker) {
                workers[i] = workers[workers.length - 1];
                workers.pop();
                break;
            }
        }
        emit WorkerRevoked(worker, msg.sender);
    }

    function getUserWorkers(
        address user
    ) external view returns (address[] memory) {
        return userToWorkers[user];
    }

    function stake(address worker) external payable {
        require(workerToUser[worker] == msg.sender, "Not owner of worker");
        require(msg.value >= MIN_STAKE, "Insufficient stake amount");
        require(
            !workerStakes[worker].isBlacklisted,
            "Worker is blacklisted. Use requestUnban()"
        );

        workerStakes[worker].stakedAmount += msg.value;
        totalUserStakes += msg.value;

        emit Staked(msg.sender, worker, msg.value);
    }

    function withdrawStake(address worker, uint256 amount) external {
        require(workerToUser[worker] == msg.sender, "Not owner of worker");
        StakerInfo storage info = workerStakes[worker];

        require(!info.isBlacklisted, "Cannot withdraw while blacklisted");
        require(info.stakedAmount >= amount, "Insufficient staked balance");

        if (info.stakedAmount - amount < MIN_STAKE) {
            require(
                amount == info.stakedAmount,
                "Must maintain MIN_STAKE or withdraw all"
            );
        }

        info.stakedAmount -= amount;
        totalUserStakes -= amount;

        payable(msg.sender).transfer(amount);
        emit StakeWithdrawn(msg.sender, worker, amount);
    }
    function requestUnban(address worker) external payable {
        require(workerToUser[worker] == msg.sender, "Not owner of worker");
        StakerInfo storage info = workerStakes[worker];

        require(info.isBlacklisted, "Worker is not blacklisted");
        require(msg.value == UNBAN_PENALTY, "Must pay exactly 1 POL penalty");

        info.penaltyDeposited += msg.value;
        info.probationCount = 0;

        emit SlashingProbationStarted(msg.sender, worker);
    }

    function triggerRequest(
        address wallet,
        string calldata project,
        string calldata fn,
        string calldata cid,
        bytes32 inputHash
    ) external returns (bytes32) {
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
            resultHash: bytes32(0),
            isCompleted: false
        });

        emit ExecutionRequested(wallet, project, fn, cid, requestId);
        return requestId;
    }
    function finalizeRequests(
        bytes32 requestId,
        bytes32 resultHash,
        address[] calldata workers,
        bytes[] calldata signatures,
        address fastestWorker,
        address[] calldata slashees
    ) external onlyGateway {
        require(
            requests[requestId].requester != address(0),
            "Request not found"
        );
        require(!requests[requestId].isCompleted, "Already completed");
        require(workers.length == signatures.length, "Length mismatch");

        requests[requestId].resultHash = resultHash;
        requests[requestId].isCompleted = true;

        address[] memory validPayees = new address[](workers.length);
        uint256 validPayeeCount = 0;
        bool fastestIsHonest = false;

        for (uint256 i = 0; i < workers.length; i++) {
            address worker = workers[i];
            address user = workerToUser[worker];
            StakerInfo storage info = workerStakes[worker];

            bytes32 messageHash = keccak256(
                abi.encodePacked(requestId, resultHash)
            );
            bytes32 ethSignedMessageHash = messageHash.toEthSignedMessageHash();
            if (ECDSA.recover(ethSignedMessageHash, signatures[i]) != worker) {
                continue;
            }

            if (info.stakedAmount < MIN_STAKE && !info.isBlacklisted) {
                continue;
            }
            if (info.isBlacklisted) {
                if (info.penaltyDeposited >= UNBAN_PENALTY) {
                    info.probationCount++;

                    if (info.probationCount >= PROBATION_TARGET) {
                        info.isBlacklisted = false;
                        info.penaltyDeposited = 0;
                        emit WorkerUnbanned(worker);
                    }
                }
                continue;
            }

            validPayees[validPayeeCount] = user;
            validPayeeCount++;

            if (worker == fastestWorker) {
                fastestIsHonest = true;
            }
        }

        for (uint256 i = 0; i < slashees.length; i++) {
            address slasheeWorker = slashees[i];
            StakerInfo storage info = workerStakes[slasheeWorker];

            if (
                workerToUser[slasheeWorker] != address(0) && !info.isBlacklisted
            ) {
                info.isBlacklisted = true;
                info.probationCount = 0;
                info.penaltyDeposited = 0;
                emit WorkerSlashed(slasheeWorker);
            }
        }

        if (address(this).balance < REWARD_TOTAL) return;

        if (fastestIsHonest && fastestWorker != address(0)) {
            address speedsterUser = workerToUser[fastestWorker];
            payable(speedsterUser).transfer(REWARD_FAST_BONUS);

            if (validPayeeCount > 1) {
                uint256 remainingReward = REWARD_TOTAL - REWARD_FAST_BONUS;
                uint256 share = remainingReward / (validPayeeCount - 1);
                for (uint256 k = 0; k < validPayeeCount; k++) {
                    if (validPayees[k] != speedsterUser) {
                        payable(validPayees[k]).transfer(share);
                    }
                }
            }
        } else {
            if (validPayeeCount > 0) {
                uint256 share = REWARD_TOTAL / validPayeeCount;
                for (uint256 k = 0; k < validPayeeCount; k++) {
                    payable(validPayees[k]).transfer(share);
                }
            }
        }

        emit ResultFinalized(requestId, resultHash, fastestWorker);
        emit RewardsDistributed(REWARD_TOTAL, validPayeeCount);
    }
}
