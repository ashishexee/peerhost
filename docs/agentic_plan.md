# PeerHost Agentic Integration Plan

This document outlines the robust strategy to transform PeerHost into a **Monetized Agent Capability Network** using Polygon's Agentic Standards (ERC-8004 and x402).

## Vision
PeerHost will not just host code; it will host **Paid Skills for AI Agents**.
*   **Users** deploy code and set a price (e.g., $0.01/call).
*   **Agents** discover these skills via on-chain registries (ERC-8004).
*   **Agents** pay automatically using the x402 protocol.

---

## Phase 1: The Commerce Layer (x402)
*Enable developers to gate their functions with micropayments.*

### 1. Developer Dashboard Updates (`/frontend`)
*   **UI Addition:** In `NewDeployment.tsx`, add a "Monetization" toggle.
    *   Inputs: `Price per Call (USDC)`, `Beneficiary Wallet`.
*   **Configuration:** Store this metadata in Supabase alongside the function config.

### 2. Gateway Implementation (`/apps/gateway`)
*   **Middleware:** Implement an `x402` middleware.
    *   **Check:** Does this function have a price?
    *   **If Yes:** Check for `X-Protocol-Payment` or `X-Payment` header.
    *   **If Missing/Invalid:** Return `402 Payment Required`.
        *   Body: `{ "details": { "price": "0.01", "currency": "USDC", "receiver": "0x..." } }`
    *   **If Valid:** Verify the payment proof (using Polygon's Payment Facilitator API or signature verification).
    *   **Proceed:** Rate limit and trigger `ExecutionCoordinator`.

### 3. Settlement
*   **Accumulation:** Payments are initially off-chain proofs (Pre-Auth) or direct on-chain txs.
*   **Cash Out:** Provide a "Claim Earnings" button in the dashboard that settles outstanding proofs to the user's wallet.

---

## Phase 2: The Discovery Layer (ERC-8004)
*Make functions discoverable by the global agent swarm.*

### 1. On-Chain Registration
*   **Mechanism:** When a user deploys a generic project (e.g., "Weather API"), PeerHost automatically mints/updates an **ERC-8004 Identity NFT** on Polygon Amoy.
*   **Metadata:**
    *   `TokenURI` points to a JSON describing the MCP (Model Context Protocol) capabilities.
    *   Lists the tools available: `get_weather`, `get_forecast`.

### 2. MCP Endpoint Hosting
*   **Server:** The Gateway serves an `/mcp/manifest.json` for each project.
*   **Format:** Complies with the Model Context Protocol so LLMs can "read" how to use the tool.

---

## Phase 3: The Client Experience (LLM Wallet)
*Standardize how Agents consume PeerHost.*

*   **Documentation:** Add a guide on "How to use PeerHost with Cursor/Claude".
*   **Integration:** Instruct users to install `@payment/llm-wallet`.
*   **Usage:**
    ```bash
    # An agent using PeerHost
    @LLM_Wallet call https://api.peerhost.net/my-project/my-func
    ```
    (The wallet handles the 402 challenge automatically).

---

## Implementation Roadmap (Immediate Steps)

1.  **Install SDKs:** `npm install @polygon/x402-server` (or equivalent) in Gateway.
2.  **Update Database:** Add `price_usd`, `beneficiary_address` columns to `projects` table.
3.  **Deploy Middleware:** Write the 402-interception logic in Fastify.
