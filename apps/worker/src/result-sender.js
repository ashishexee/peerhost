import { ethers } from "ethers";
import { createRequire } from "module";
import axios from "axios";

const require = createRequire(import.meta.url);
const ExecutionABI = require("./abi/ExecutionCoordinator.json");

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3001";

export async function sendResult(requestId, result) {
    const RPC_URL = process.env.RPC_URL;
    const CONTRACT_ADDRESS = process.env.EXECUTION_CONTRACT_ADDRESS;
    const WORKER_PRIVATE_KEY = process.env.WORKER_PRIVATE_KEY;

    if (!WORKER_PRIVATE_KEY) {
        console.error("[Result] Missing WORKER_PRIVATE_KEY. Cannot submit on-chain.");
        throw new Error("Missing WORKER_PRIVATE_KEY");
    }

    console.log(`[Result] Processing result for ${requestId}`);
    let txHash = null;

    // 1. Submit to Blockchain (Proof of Execution)
    // Contract expects Bytes32 (Hex)
    try {
        console.log(`[Result] Submitting proof on-chain...`);
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(WORKER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ExecutionABI, wallet);

        const resultString = typeof result === 'object' ? JSON.stringify(result) : String(result);
        const resultHash = ethers.keccak256(ethers.toUtf8Bytes(resultString));

        // requestId should be Hex for the contract
        const tx = await contract.submitResult(requestId, resultHash);
        console.log(`[Result] Transaction sent: ${tx.hash}`);

        // Wait for 1 confirmation to ensure proof is mined
        await tx.wait(1);
        txHash = tx.hash;
        console.log(`[Result] Transaction confirmed for ${requestId}`);

    } catch (err) {
        if (err.message.includes("Request already completed") || err.message.includes("already completed")) {
            console.log(`[Result] Request ${requestId} already completed on-chain. Proceeding to Gateway report.`);
            // We proceed even if on-chain failed (specifically because it's already done)
        } else {
            console.error(`[Result] Failed to submit result on-chain for ${requestId}:`, err.message);
            // This is bad for the user (no response), but we rethrow to signal failure.
            throw err;
        }
    }

    // 2. Report to Gateway (Result Data Delivery)
    // Gateway expects Hex String (matching DB) and Polling matches Hex
    try {
        console.log(`[Result] Sending result data to Gateway ${GATEWAY_URL}... (ID: ${requestId})`);

        await axios.post(`${GATEWAY_URL}/_internal/worker-result`, {
            requestId: requestId,
            result,
            txHash
        }, {
            timeout: 5000
        });
        console.log(`[Result] Successfully delivered result data for ${requestId}`);
    } catch (err) {
        console.error(`[Result] Failed to send result to Gateway for ${requestId}:`, err.message);
        throw err;
    }
}
