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
    try {
        console.log(`[Result] Submitting proof on-chain...`);
        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const wallet = new ethers.Wallet(WORKER_PRIVATE_KEY, provider);
        const contract = new ethers.Contract(CONTRACT_ADDRESS, ExecutionABI, wallet);

        const resultString = typeof result === 'object' ? JSON.stringify(result) : String(result);
        const resultHash = ethers.keccak256(ethers.toUtf8Bytes(resultString));

        const tx = await contract.submitResult(requestId, resultHash);
        console.log(`[Result] Transaction sent: ${tx.hash}`);

        // Wait for 1 confirmation to ensure proof is mined
        await tx.wait(1);
        txHash = tx.hash;
        console.log(`[Result] Transaction confirmed for ${requestId}`);

    } catch (err) {
        console.error(`[Result] Failed to submit result on-chain for ${requestId}:`, err.message);
        // Note: We might still want to report to Gateway even if chain fails? 
        // For strict "Proof" architecture, maybe not. But for user experience, probably yes.
        // Let's rethrow for now to enforce strictness, or log and proceed.
        // Rethrowing ensures we don't return unproven results if that's the goal.
        throw err;
    }

    // 2. Report to Gateway (Result Data Delivery)
    try {
        console.log(`[Result] Sending result data to Gateway ${GATEWAY_URL}...`);
        await axios.post(`${GATEWAY_URL}/_internal/worker-result`, {
            requestId,
            result,
            txHash // Sending the proof tx hash to the gateway for verification
        }, {
            timeout: 5000
        });
        console.log(`[Result] Successfully delivered result data for ${requestId}`);
    } catch (err) {
        console.error(`[Result] Failed to send result to Gateway for ${requestId}:`, err.message);
        // This is bad for the user (no response), but the work is "proven" on chain.
        throw err;
    }
}
