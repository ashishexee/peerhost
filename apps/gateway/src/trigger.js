// this is reponsible for interacting with the admin smart contract

import { ethers, JsonRpcProvider } from "ethers";
import { getFunctionCID } from "./registry.js";
import { createRequire } from "module";
import { supabase } from "./db/supabase.js";

const require = createRequire(import.meta.url);
const ExecutionABI = require("./abi/ExecutionCoordinator.json");

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.GATEWAY_PRIVATE_KEY, provider);

const contract = new ethers.Contract(process.env.EXECUTION_CONTRACT_ADDRESS, ExecutionABI, wallet);


export async function triggerExecution({ request, hash }) {

    const cid = await getFunctionCID(
        request.meta.wallet,
        request.meta.project,
        request.meta.function
    )

    if (!cid) {
        const err = new Error("Function not found");
        err.code = "FUNCTION_NOT_FOUND";
        throw err;
    }

    const tx = await contract.triggerRequest(
        request.meta.wallet,
        request.meta.project,
        request.meta.function,
        cid,
        `0x${hash}`
    );

    const receipt = await tx.wait(1);

    const event = receipt.logs.find(
        (l) => l.fragment?.name === "ExecutionRequested"
    );

    const requestId = event?.args?.requestId?.toString();

    if (!requestId) {
        throw new Error("Failed to extract requestId");
    }

    // Persist the pending request in Supabase
    const { error } = await supabase
        .from('requests')
        .insert({
            request_id: requestId,
            status: 'PENDING',
            created_at: new Date().toISOString()
        });

    if (error) {
        console.error("Failed to insert pending request:", error);
        // We warn but do not throw, as the chain event happened.
        // The subscription might miss it if logic relies solely on DB existence,
        // but `waitForWorkerResult` might just listen to "updates".
    }

    return { requestId };
}