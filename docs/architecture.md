# PeerHost — System Architecture

PeerHost is a decentralized, serverless backend execution network that allows developers to deploy backend **functions instead of servers**, with execution coordinated on-chain and performed by a distributed network of sandboxed worker nodes.

This document describes the **complete architecture**: from how users interact with the platform to how requests flow through the Gateway, Smart Contract, Workers, and back to the client with Proof-of-Execution.

---

## 1. High-Level System Overview

PeerHost is composed of four core layers:

1. **User Layer** — Developers and API consumers.
2. **Gateway Layer** — Central HTTP entrypoint that parses requests and triggers blockchain coordination.
3. **Blockchain Coordination Layer** — Smart contract that emits execution jobs.
4. **Worker Execution Layer** — Distributed sandboxed nodes that execute user code and return results.

The system replaces traditional server hosting with:
- Event-driven execution
- Decentralized compute
- Sandbox isolation
- On-chain coordination

---

## 2. How Users Use PeerHost

### 2.1 Developer Onboarding

A developer interacts with PeerHost like a serverless platform:

1. Connects a wallet on the PeerHost dashboard.
2. Creates a **project name**.
3. Uploads or links a GitHub repository containing:
   - A `/functions` folder.
4. Sets environment variables (`.env`) via the dashboard UI.
5. The platform:
   - Bundles the code.
   - Uploads it to IPFS.
   - Stores the CID in an internal registry.
6. The developer receives live API endpoints in the form:

```

https://<wallet>.peerhost.com/<project>/<function>

```

Example:
```

[https://0xabc123.peerhost.com/weather/getCity](https://0xabc123.peerhost.com/weather/getCity)

```

---

### 2.2 API Consumer Usage

A normal user or frontend application simply sends HTTP requests to the PeerHost URL:

```

GET /weather/getCity
POST /auth/login

```

They do not interact with:
- The blockchain
- Workers
- IPFS

To them, it behaves like a normal always-on backend.

---

## 3. Core Components

### 3.1 Gateway (Central HTTP Orchestrator)

The Gateway is the **only public HTTP server** in the system.

Its responsibilities:

- Parse incoming requests
- Validate URL & headers
- Load function metadata from the registry
- Canonicalize the request
- Trigger the Execution Contract
- Collect results from workers
- Respond to the HTTP client

The Gateway **never executes user code directly**.

It only:
- Coordinates execution
- Handles client communication
- Maintains temporary request state

---

### 3.2 Execution Contract (Blockchain Coordination Layer)

The Execution Coordinator smart contract is deployed on a low-cost blockchain (e.g., Polygon Amoy).

Its responsibilities:

- Accept execution triggers from the Gateway
- Store request metadata (lightweight)
- Emit `ExecutionRequested` events
- Receive result submissions from workers (future phase)
- Act as the source of truth for job coordination

The contract **does not execute any code**.  
It exists only to:
- Coordinate
- Order
- Broadcast
- Verify

---

### 3.3 Worker Network (Decentralized Execution Layer)

Workers are independent machines run by:

- The platform owner
- Community contributors
- Future incentivized node operators

Their responsibilities:

- Listen to blockchain execution events
- Fetch function code from IPFS
- Run the function inside a Docker sandbox
- Capture the output
- Send the result back to the Gateway
- (Later phases) Submit proofs on-chain

Workers are:
- Stateless
- Isolated
- Permissionless (in future)
- Replaceable

---

### 3.4 IPFS Layer (Code Storage)

All user function bundles are stored on IPFS.

IPFS provides:

- Content-addressed storage
- Immutable builds
- Distributed availability
- Worker-verifiable source code

Workers fetch code **by CID**, not from the Gateway.

---

## 4. Full Request Lifecycle (End-to-End Flow)

This section describes **every step that occurs for a single API request**.

---

### Step 1 — Client Sends HTTP Request

The user or frontend calls:

```

https://<wallet>.peerhost.com/<project>/<function>

```

This request reaches the **Gateway**.

---

### Step 2 — Gateway Parses & Validates

The Gateway:

- Extracts:
  - Wallet subdomain
  - Project name
  - Function name
- Validates:
  - HTTP method
  - Headers
  - Payload size
  - Rate limits
- Canonicalizes request into a normalized JSON format.
- Computes a deterministic `inputHash`.

---

### Step 3 — Gateway Loads Function Metadata

From the internal registry:

- Fetches:
  - IPFS CID
  - Function version
  - Authorization settings
  - Execution limits

---

### Step 4 — Gateway Triggers On-Chain Execution

The Gateway calls the Execution Coordinator smart contract:

- Passes:
  - Wallet
  - Project
  - Function name
  - CID
  - Input hash
  - Canonical request JSON
- Contract:
  - Generates a unique `requestId`
  - Emits an `ExecutionRequested` event on-chain

At this point:
> The HTTP request becomes a **globally visible decentralized job**.

---

### Step 5 — Workers Listen for Execution Events

All connected workers are subscribed to blockchain events via WebSocket RPC.

When `ExecutionRequested` is emitted:

- Every worker receives the same job:
  - `requestId`
  - CID
  - Function identifier
  - Request payload

---

### Step 6 — Workers Fetch Code from IPFS

Each worker:

- Downloads the function bundle from IPFS using the CID.
- Extracts the `/functions` directory.
- Selects the requested function file.

---

### Step 7 — Workers Execute Inside Docker Sandbox

Each worker:

1. Creates a temporary isolated container.
2. Injects:
   - The function code
   - The canonical request JSON
   - Environment variables (securely)
3. Executes the function inside Docker with:
   - CPU limits
   - Memory limits
   - Read-only filesystem
   - No network access (unless explicitly allowed)
4. Captures `stdout` as the execution result.

This ensures:
- No worker host compromise
- Deterministic runtime
- Safe untrusted code execution

---

### Step 8 — Workers Submit Result

Each worker sends:

- `requestId`
- `result payload`
- `result hash`

Back to:

- The smart contract 

---

### Step 9 — Proof of Execution

In the Proof-of-Execution phase:

- Multiple workers submit result hashes on-chain.
- The contract:
  - Selects the first valid result
  - Marks the job as fulfilled
- Incorrect or late submissions are ignored or penalized.
- Workers may be rewarded.

This creates:
- Trustless execution
- Economic incentives
- Sybil resistance

---

### Step 10 — Gateway Responds to Client

The Gateway:

- Matches the result with the pending HTTP request
- Sends the final response to the original client
- Logs:
  - Latency
  - Worker ID
  - Execution stats

From the client’s point of view:
> It looks exactly like a normal fast backend response.

---

## 5. Worker Trust & Security Model

Workers:

- Never see user secrets outside of sandbox
- Never run code on host OS
- Are stateless and disposable
- Cannot fake execution without submitting a verifiable result

Security is enforced by:

- Docker sandboxing
- On-chain event transparency
- Deterministic code from IPFS
- Future cryptographic proofs