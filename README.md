# PeerHost — The Universal Decentralized & Monetizable Serverless Network

**PeerHost** is a next-generation serverless platform that evolves the cloud in two revolutionary ways:

1.  **Unstoppable Execution**: A distributed, censorship-resistant worker network coordinated on **Polygon**.
2.  **Native Monetization**: The first platform where developers can **price their API endpoints** using the **x402 Protocol**.

While PeerHost is the **native execution layer for the Agentic Economy**, its open monetization standard is **universally compatible**. Whether accessed by an AI Agent, a dApp, or a human developer, **PeerHost gets you paid**.

**Build Unstoppable Backends. Monetize Every Request.**

---

## Why PeerHost Exists

Modern backend infrastructure is fast, but fundamentally centralized. Even “serverless” platforms ultimately depend on a small number of cloud providers, creating risks around:

* Vendor lock-in
* Regional outages
* Silent censorship
* Opaque execution guarantees
* Rising operational costs at scale

If one node goes offline, another node takes its place automatically.

---

### 3. Security by Isolation

Every function execution happens inside an **ephemeral, isolated sandbox**:

* Docker or microVM based isolation
* Strict CPU and memory limits
* Network access only when explicitly allowed
* Filesystem isolation by default

Workers cannot persist state between executions and never receive long-lived secrets.

---

### 4. Immutable Code Execution

All function code is bundled and stored on **IPFS**:

* Content-addressed
* Immutable
* Globally retrievable
* Verifiable by all workers

This guarantees that the code executed at runtime is **exactly the code the developer deployed**, without modification.

---

### 5. Trustless On-Chain Coordination

Execution is coordinated through the **Execution Coordinator smart contract** on **Polygon Amoy Testnet**:

* **Service Registration**: Functions and their prices are registered on-chain.
* **Payment Settlement**: Uses **x402** to gate execution until payment is verified.
* **Result Verification**: Dispute resolution and slashing happens on Polygon.

---

### 6. Verifiable Proof-of-Execution

Workers compete to execute requests and must submit **cryptographic proofs of result correctness**. Honest execution is rewarded, and malicious behavior can be penalized via staking and slashing mechanisms.

This creates a **self-incentivizing compute network**.

---

## High-Level Architecture

PeerHost operates as a five-layer system:

1. **Application Layer**
   Clients interact using ordinary HTTP/REST requests.

2. **Gateway Layer**
   Authenticates, validates, canonicalizes requests and triggers on-chain execution.

3. **Blockchain Coordination Layer (Polygon Amoy)**
    Smart contracts coordinate job dispatch, result submission, and incentive settlement.

4. **Worker Network**
   Distributed worker nodes execute functions inside secure sandboxes.

5. **Storage Layer (IPFS)**
   Immutable storage for bundled function code and static assets.

End-users experience a normal low-latency API. Under the hood, execution is fully decentralized.

---

## Developer Experience

PeerHost is designed to feel as simple as modern serverless platforms.

### Deployment Flow

```text
1. Connect GitHub repository (or public repo URL)
2. Add environment variables
3. Deploy
```

Behind the scenes, PeerHost:

* Extracts your `/functions` directory
* Bundles each function using deterministic builds
* Uploads bundles to IPFS
* Registers execution metadata
* Makes the functions live instantly

### Live Endpoints

Your functions become immediately accessible at:

```
https://<wallet>.peerhost.com/<project>/<function>
```

No servers to provision.
No scaling rules to configure.
No cold starts.

---

## Primary Use Cases

* **API Backends** — Fast, globally available REST APIs
* **Event & Webhook Processing** — Stripe, Twilio, GitHub, etc.
* **dApp Backends** — Off-chain compute for Web3 frontends
* **Agent Skills** — Monetized tools and services for AI Agents (e.g. "Search Web", "Analyze Data")
* **Automation & Job Runners** — Deterministic background execution
* **Micro-services at Internet Scale** — Without infrastructure overhead

---

## Worker Network & Incentives

PeerHost is a two-sided network:

### Builders

Deploy backend logic without running any servers.

### Workers

Contribute compute power to the network and earn rewards by:

* Running a PeerHost worker node
* Listening for on-chain execution events
* Executing functions in secure sandboxes
* Submitting verifiable results on-chain

Workers stake collateral to participate and are rewarded for correct execution, establishing economic security for the network.

---

## What PeerHost Is (and Is Not)

**PeerHost is:**

* A serverless backend runtime
* A blockchain-coordinated compute network
* A developer infrastructure protocol
* An **Agentic Payment Gateway**

**PeerHost is not:**

* A traditional cloud hosting provider
* A centralized serverless platform
* A DeFi product
* A storage-only protocol

---

## Network Status

* Execution: ✅ On-chain coordinated
* Storage: ✅ IPFS-backed
* Workers: ✅ Distributed sandboxed runtime
* Gateway: ✅ HTTP + WebSocket orchestration

---

## Join PeerHost

You can participate as both a user and a contributor:

* **Start Building** — Deploy your first decentralized backend
* **Run a Worker** — Contribute to the execution layer and earn rewards
* **Contribute to the Protocol** — Open-source, community-driven development

---

## Final Statement

**PeerHost is the missing infrastructure layer between Web2 backends and Web3 trust guarantees.**
It brings serverless execution into the decentralized era — without sacrificing developer experience, performance, or security.

> *PeerHost — The Backend for the Unstoppable Web.*