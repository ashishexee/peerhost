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

            // 2. Execute
            // Inputs: In a real system, inputs would be decoded from the event or a separate data availability layer.
            // For now, passing empty args.
            const result = await executeFunction(code, {});

            // 3. Report
            await sendResult(requestIdHex, result);

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
