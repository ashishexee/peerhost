
import axios from "axios";
const GATEWAY_URL = "http://127.0.0.1:3000";
const WALLET_ADDRESS = "0xda684a91a506f3e303834c97784dee2b31bbc6bc"; // Deployer
const PROJECT_NAME = "real-project";
const FUNCTION_NAME = "complex";

async function runTest() {
    console.log("🚀 Starting End-to-End Test...");

    // We strictly force IPv4 loopback to avoid Windows IPv6 resolution issues.
    // We spoof the Host header to simulate the subdomain routing used in production.
    const displayUrl = `http://${WALLET_ADDRESS}.localhost:3000/${PROJECT_NAME}/${FUNCTION_NAME}`;
    const connectionUrl = `${GATEWAY_URL}/${PROJECT_NAME}/${FUNCTION_NAME}`;

    console.log(`Target (Simulated): ${displayUrl}`);
    console.log(`Connecting via: ${connectionUrl} (Host: ${WALLET_ADDRESS}.localhost:3000)`);

    try {
        console.log("\n1. Sending Request...");
        const start = Date.now();

        const response = await axios.get(connectionUrl, {
            headers: {
                "Host": `${WALLET_ADDRESS}.localhost:3000`
            },
            timeout: 60000
        });

        const latency = Date.now() - start;
        console.log(`\n✅ Success! Received response in ${latency}ms`);
        console.log("Response Body:", JSON.stringify(response.data, null, 2));

        if (response.data.message && response.data.message.includes("COMPLEX")) {
            console.log("\n🎉 Flow Verified: Complex bundled code executed successfully!");
        }

    } catch (err) {
        console.error("\n❌ Test Failed!");
        if (err.response) {
            console.error(`Status: ${err.response.status}`);
            console.error("Data:", err.response.data);
        } else {
            console.error("Error:", err.message);
        }
    }
}

runTest();
