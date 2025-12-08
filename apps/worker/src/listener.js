import { ethers } from "ethers";
import { createRequire } from "module";
import { fetchFunctionCode } from "./ipfs-cache.js";
import { executeFunction } from "./executor.js";
import { sendResult } from "./result-sender.js";

const require = createRequire(import.meta.url);
const ExecutionABI = require("./abi/ExecutionCoordinator.json");

export async function startListener() {
    const RPC_URL = process.env.RPC_URL;
    const CONTRACT_ADDRESS = process.env.EXECUTION_CONTRACT_ADDRESS;

    if (!RPC_URL || !CONTRACT_ADDRESS) {
        throw new Error("Missing RPC_URL or EXECUTION_CONTRACT_ADDRESS");
    }

    console.log(`[Listener] Connecting to ${RPC_URL}...`);
    // Use WebSocketProvider if URL starts with ws/wss, else JsonRpcProvider (polling)
    const provider = RPC_URL.startsWith("http")
        ? new ethers.JsonRpcProvider(RPC_URL)
        : new ethers.WebSocketProvider(RPC_URL);

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ExecutionABI, provider);

    console.log(`[Listener] Watching contract at ${CONTRACT_ADDRESS}`);

    // Event: ExecutionRequested(address wallet, string project, string fn, string cid, string inputs)
    // Note: 'inputs' usually comes as hex or bytes, need to parse if so.
    // For this prototype, assuming simplified signature matching Gateway's emission.

    contract.on("ExecutionRequested", async (wallet, project, fn, cid, requestIdHex, event) => {
        const requestId = BigInt(requestIdHex).toString(); // Convert Hex to Decimal String to match Gateway
        console.log(`[Event] ExecutionRequested: ${project}/${fn} (ReqID: ${requestId})`);

        try {
            // 1. Fetch Code
            const code = await fetchFunctionCode(cid);

            // 2. Fetch Inputs (from Gateway)
            const GATEWAY_URL = process.env.GATEWAY_URL || "https://peerhost-jl8u.vercel.app";
            let inputs = {};

            // Retry loop for inputs (handling race condition where Gateway persists after event)
            for (let attempt = 1; attempt <= 5; attempt++) {
                try {
                    console.log(`[Worker] Fetching inputs for ${requestId} (Attempt ${attempt}/5)...`);
                    const res = await fetch(`${GATEWAY_URL}/_internal/requests/${requestId}`);
                    if (res.ok) {
                        const data = await res.json();
                        inputs = data;
                        console.log(`[Worker] Inputs fetched successfully.`);
                        break; // Success
                    } else if (res.status === 404) {
                        console.warn(`[Worker] Inputs not ready yet (404). Retrying in 1s...`);
                    } else {
                        console.warn(`[Worker] Failed to fetch inputs: ${res.status} ${res.statusText}`);
                    }
                } catch (err) {
                    console.warn(`[Worker] Input fetch error:`, err.message);
                }

                if (attempt < 5) await new Promise(r => setTimeout(r, 1000));
            }

            // 3. Execute
            const result = await executeFunction(code, inputs);

            // 3. Report
            await sendResult(requestId, result);

        } catch (err) {
            console.error(`[Worker] Job failed for ${requestId}:`, err);
            // Report failure to gateway
            try {
                // We send a specific error-like object or status if the API supports it
                // Ideally sendResult supports { error: ... }
            } catch (ignore) { }
        }
    });
}
