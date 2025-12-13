# PeerHost Android Worker Strategy

## 1. Executive Summary
This document outlines the technical strategy for implementing a **PeerHost Worker Node** as a **Flutter Android Application**. The goal is to allow users to run worker nodes on their mobile devices efficiently in the background.

**Chosen Strategy:** **Native Dart Port with QuickJS Execution**.
This approach maximizes performance and battery life by implementing the networking layer in Dart and only using a lightweight Javascript engine for the actual task execution.

**Wallet Strategy:** **Session Keys (Delegated Signing)**.
This enhances security by allowing users to delegate signing rights to a specialized "Worker Key" on their device, removing the need to expose their main wallet's private key.

---

## 2. System Architecture

### 2.1 High-Level Overview
The application will consist of two main contexts:
1.  **UI Context (Main Isolate):** The Flutter UI for user interaction (Wallet connection, Start/Stop, Logs).
2.  **Background Service Context (Background Isolate):** A persistent Dart isolate running as an Android Foreground Service. This handles the core logic.

### 2.2 Component Diagram
```mermaid
graph TD
    User[User's MetaMask] -.->|Authorize| Chain[Execution Contract]
    
    subgraph "Android Worker App"
        UI[Flutter UI]
        Service[Background Service]
        Store[Secure Storage]
    end

    UI <-->|Control| Service
    Service -->|Listen (web3dart)| Chain
    Service -->|Fetch (dio)| IPFS[IPFS Gateway]
    Service -->|Execute| QJS[QuickJS Engine]
    Service -->|Sign Result (Worker Key)| Chain
    Store <-->|Load Key| Service
```

---

## 3. Detailed Implementation

### 3.1 Background Execution
To ensure the node stays online without being killed by Android:
*   **Foreground Service:** Use `flutter_background_service`.
*   **Notification:** Persistent "PeerHost Worker is Active" notification.
*   **Wake Lock:** `wakelock_plus` to keep CPU active during task execution.

### 3.2 The "Worker Shell" (Dart)
We port the `worker.js` logic to Dart:
*   **Blockchain:** `web3dart` for listening to `ExecutionRequested` events.
*   **Networking:** `dio` or `http` for fetching code from IPFS.
*   **State:** Maintain a local queue of tasks.

### 3.3 The Execution Runtime (QuickJS)
The worker must execute dynamic Javascript code. We use **QuickJS** (`flutter_qjs`) as a sandboxed environment.
*   **Polyfills:** We must inject a mock environment into QuickJS to match Node.js features expected by tasks:
    *   `console.log` -> Maps to Dart logger.
    *   `fetch` -> Maps to Dart's HTTP client.
    *   `Buffer` -> Injected JS polyfill.
    *   `process.env` -> Injected JSON object.

---

## 4. Wallet & Security (Session Keys)

Start-up flow designed to avoid handling the user's main Private Key.

### 4.1 Key Generation
1.  **Fresh Key:** On first install, the Worker App generates a random ECDSA keypair (**"Worker Key"**) and stores it in Android KeyStore (via `flutter_secure_storage`).
2.  **Address:** The app displays the Worker Key's address (e.g., `0x123...abc`).

### 4.2 Authorization (The Handshake)
1.  **Connect:** User connects their main wallet (e.g., MetaMask Mobile) to the Worker App via **WalletConnect**.
2.  **Delegate:** User signs a transaction on the `ExecutionCoordinator` contract:
    *   `function addDelegate(address workerKey)`
    *   *This authorizes `0x123...abc` to submit results on behalf of the User.*

### 4.3 Automated Operation
1.  **Result Submission:** When a task is complete, the Worker App signs the result using the **Worker Key**.
2.  **Contract Verification:** The smart contract checks `delegates[msg.sender] == userAddress` before accepting the result.
3.  **Gas Fees:**
    *   **Phase 1:** User sends small ETH (e.g., 0.01 ETH) to the Worker Key address during setup.
    *   **Phase 2 (Future):** Implement EIP-4337 Paymaster to sponsor gas fees for the Worker Key.

---

## 5. Work Breakdown

### Phase 1: Core Service (Dart)
1.  Setup Flutter project with `flutter_background_service`.
2.  Implement `BlockchainService` (web3dart) to listen to events.
3.  Implement `SecureStorage` for the Session Key.

### Phase 2: Runtime (QuickJS)
1.  Integrate `flutter_qjs`.
2.  Create polyfill layer (`Buffer`, `console`, `fetch`).
3.  Test running simple tasks.

### Phase 3: Wallet Connect & UI
1.  Implement WalletConnect v2 for the "Handshake".
2.  Build "Start/Stop" UI and "Logs" console.
