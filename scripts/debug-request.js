
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

async function main() {
    const RPC_URL = process.env.RPC_URL;
    const PRIVATE_KEY = process.env.GATEWAY_PRIVATE_KEY;
    const CONTRACT_ADDRESS = process.env.EXECUTION_CONTRACT_ADDRESS;

    if (!RPC_URL || !CONTRACT_ADDRESS) return console.error("Missing Env Vars");

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

    // Load ABI
    const abiPath = path.resolve(__dirname, "../apps/worker/src/abi/ExecutionCoordinator.json");
    const abiArtifact = require(abiPath);
    const ExecutionABI = abiArtifact.abi ? abiArtifact.abi : abiArtifact;

    const contract = new ethers.Contract(CONTRACT_ADDRESS, ExecutionABI, wallet);

    // The Request ID from the user's log
    const requestId = "0x315ac143755f3eb3509f74ddbd2867fea9bf1358e1f04058d7b78b6838b8ea01";

    console.log("Checking Request:", requestId);
    console.log("Contract:", CONTRACT_ADDRESS);

    try {
        // Simulate the call to get the Revert Reason
        const dummyHash = ethers.keccak256(ethers.toUtf8Bytes("debug"));
        try {
            await contract.submitResult.staticCall(requestId, dummyHash);
            console.log("Simulation Success: Transaction would pass!");
        } catch (simErr) {
            console.error("Simulation Reverted with:", simErr.shortMessage || simErr.message);
            if (simErr.data) {
                // Try to decode if custom error (though simple requires usually show up in message)
                console.log("Revert Data:", simErr.data);
            }
            if (simErr.revert) {
                console.log("Revert Reason:", simErr.revert.args);
            }
        }

    } catch (err) {
        console.error("Read Error:", err);
    }
}

main();
