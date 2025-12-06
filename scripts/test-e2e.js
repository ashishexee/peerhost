
import axios from "axios";

// Configuration
const GATEWAY_URL = "http://127.0.0.1:3000";
const WALLET_ADDRESS = "0xda684a91a506f3e303834c97784dee2b31bbc6bc"; // Use your deployer wallet to allow matching
const PROJECT_NAME = "real-project";
const FUNCTION_NAME = "hello";

// The Gateway expects requests in the format: http://<wallet>.peerhost.com/<project>/<function>
// Since we are running locally (localhost), we need to fake the Host header.

async function runTest() {
    console.log("🚀 Starting End-to-End Test...");
    console.log(`Target: ${GATEWAY_URL}`);
    console.log(`Simulated Host: ${WALLET_ADDRESS}.peerhost.com`);

    try {
        console.log("\n1. Sending Request to Gateway...");
        const start = Date.now();

        const response = await axios.get(`${GATEWAY_URL}/${PROJECT_NAME}/${FUNCTION_NAME}`, {
            headers: {
                "Host": `${WALLET_ADDRESS}.peerhost.com` // Spoof the host for local testing
            },
            timeout: 30000 // 30s timeout
        });

        const latency = Date.now() - start;
        console.log(`\n✅ Success! Received response in ${latency}ms`);
        console.log("Response Body:", JSON.stringify(response.data, null, 2));

        if (response.data.result) {
            console.log("\n🎉 Flow Verified: Gateway -> Chain -> Worker -> Gateway -> Client");
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
