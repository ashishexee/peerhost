User-Run Worker Delegation Architecture (Formal Spec)
1. Overview

This system enables users to run their own worker nodes (mobile / desktop) that execute sandboxed JavaScript tasks and submit execution results on-chain without repeated wallet approvals, while ensuring:

No exposure of the user’s wallet private key

Full automation of worker execution

Trustless reward distribution to the user

Revocable and auditable permissions

2. Identity Model

Each user operates two distinct cryptographic identities:

2.1 User Identity (Wallet Key)

Controlled via MetaMask or compatible wallet

Used only for:

Onboarding

Worker registration / delegation

Revocation

Receives rewards

Never used for background execution

2.2 Worker Identity (Execution Key)

Generated and stored locally on the user’s device

Controlled by the app / worker runtime

Used for:

Executing sandboxed code

Signing execution results

Submitting on-chain transactions

Pays gas fees

Fully autonomous

Revocable by the user

Important: Even though the user runs the worker, the worker must not use the user’s wallet key.

3. High-Level Flow
User Wallet (MetaMask)
        │
        │ 1. Register Worker (one-time approval)
        ▼
Smart Contract ──── stores mapping ──── Worker Address
        ▲                                   │
        │                                   │ 2. Execute task
        │                                   │ 3. Sign result
        │                                   ▼
        │                           Worker Runtime (Sandbox)
        │
        │ 4. Verify & Reward
        ▼
User Wallet (Reward Receiver)

4. Detailed Execution Flow
Step 1: Worker Key Generation (Off-chain)

The app generates a new EVM keypair:

On mobile: stored in Android Keystore / iOS Secure Enclave

On desktop/server: stored encrypted

This key represents the worker identity

Step 2: Worker Registration (One-Time User Approval)

The user registers the worker using MetaMask:

registerWorker(workerAddress)


This transaction:

Links workerAddress → userAddress

Grants the worker permission to submit execution results

Does not give access to user funds

Step 3: Task Execution (Off-chain)

The worker:

Runs user-provided JavaScript in a sandbox / isolate

Produces:

requestIdHash

resultHash

Step 4: Worker Signs Execution Result

The worker signs the execution output:

signature = sign(
  workerPrivateKey,
  keccak256(requestIdHash, resultHash)
)


This signature proves:

Which worker executed the task

Integrity of the result

Step 5: Result Submission (On-chain)

The worker submits the result:

submitResult(
  requestIdHash,
  resultHash,
  workerSignature
)


Gas is paid by the worker.

Step 6: On-Chain Verification & Reward

The contract:

Recovers signer from workerSignature

Verifies the worker is registered

Validates execution constraints

Computes reward

Sends reward directly to the user’s wallet

payable(userAddress).transfer(rewardAmount);


Receiving funds never requires a private key.

5. Smart Contract Reference Design
Worker Registration
mapping(address => address) public workerToUser;

function registerWorker(address worker) external {
    workerToUser[worker] = msg.sender;
}

Result Submission
function submitResult(
    bytes32 requestIdHash,
    bytes32 resultHash,
    bytes calldata sig
) external {
    bytes32 digest = keccak256(
        abi.encodePacked(requestIdHash, resultHash)
    );

    address worker = ECDSA.recover(digest, sig);
    address user = workerToUser[worker];

    require(user != address(0), "Unregistered worker");

    // validate execution, prevent replay, etc.

    uint256 reward = computeReward(...);
    payable(user).transfer(reward);
}

6. Security Properties
What the worker can do

Submit execution results

Pay gas

Operate autonomously

What the worker cannot do

Access user wallet funds

Transfer user assets arbitrarily

Act outside contract-defined permissions

7. Revocation & Rotation

Users can:

Revoke a worker at any time

Register a new worker

Run multiple workers if allowed

function revokeWorker(address worker) external {
    require(workerToUser[worker] == msg.sender);
    delete workerToUser[worker];
}

8. Why This Architecture Is Correct

Matches real-world systems:

Validators (owner key vs signing key)

Oracles (operator vs node key)

Keepers & relayers

Works on mobile and background

Requires minimal user interaction

Fully auditable and trust-minimized

Safe for production and audits

9. Key Principles (Non-Negotiable)

Private keys are only for spending, never for receiving

The entity that executes must sign the result

MetaMask is for consent, not automation

Users and workers are distinct cryptographic identities