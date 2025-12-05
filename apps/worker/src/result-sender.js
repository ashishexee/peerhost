import axios from "axios";

const GATEWAY_URL = process.env.GATEWAY_URL || "http://localhost:3000";

export async function sendResult(requestId, result) {
    console.log(`[Result] Sending result for ${requestId} to ${GATEWAY_URL}`);
    try {
        await axios.post(`${GATEWAY_URL}/_internal/worker-result`, {
            requestId,
            result
        }, {
            timeout: 5000
        });
        console.log(`[Result] Successfully sent ${requestId}`);
    } catch (err) {
        console.error(`[Result] Failed to send result for ${requestId}:`, err.message);
        // Retry logic could go here
        throw err;
    }
}
