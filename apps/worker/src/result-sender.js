
import { ethers } from "ethers";
import { createRequire } from "module";
import axios from "axios";

const require = createRequire(import.meta.url);
const ExecutionABI = require("./abi/ExecutionCoordinator.json");

export async function sendResult(requestId, result) {
    const GATEWAY_URL = process.env.GATEWAY_URL;
    const RPC_URL = process.env.RPC_URL;
    const WORKER_PRIVATE_KEY = process.env.WORKER_PRIVATE_KEY;

    if (!WORKER_PRIVATE_KEY) {
        console.error("[Result] Missing WORKER_PRIVATE_KEY. Cannot submit result.");
        throw new Error("Missing WORKER_PRIVATE_KEY");
    }
    if (!GATEWAY_URL) {
        console.error("GATEWAY Url is not found");
        throw new Error("Gateway URL is not found");
    }

    console.log(`[Result] Processing result for ${requestId}`);

    try {
        let provider;
        if (RPC_URL.startsWith("ws")) {
            provider = new ethers.WebSocketProvider(RPC_URL);
        } else {
            provider = new ethers.JsonRpcProvider(RPC_URL);
        }

        const wallet = new ethers.Wallet(WORKER_PRIVATE_KEY, provider);
        const workerAddress = wallet.address;
        const resultString = typeof result === 'object' ? JSON.stringify(result) : String(result);
        const resultHash = ethers.keccak256(ethers.toUtf8Bytes(resultString));
        const requestIdHex = ethers.toBeHex(BigInt(requestId), 32);
        const messageHash = ethers.keccak256(
            ethers.concat([requestIdHex, resultHash])
        );
        const signature = await wallet.signMessage(ethers.getBytes(messageHash));

        console.log(`[Result] Signed result for ${requestId}`);
        console.log(`[Result] Worker: ${workerAddress}`);
        console.log(`[Result] ResultHash: ${resultHash}`);
        console.log(`[Result] Submitting signature to Gateway...`);
        await axios.post(`${GATEWAY_URL}/_internal/submit-signature`, {
            requestId: requestId,
            workerAddress: workerAddress,
            signature: signature,
            resultHash: resultHash,
            result: result
        }, {
            timeout: 10000
        });

        console.log(`[Result] This is the result I am sending ${result}`);

        console.log(`[Result] Successfully submitted signature for ${requestId}`);

    } catch (err) {
        console.error(`[Result] Failed to submit result for ${requestId}:`, err.message);
        throw err;
    }
}