import crypto from 'crypto';
export default async function (inputs) {
    try {
        const message = inputs?.message || "PeerHost Trustless Execution Verification " + Date.now();
        
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.createHash('sha256');
        hash.update(message + salt);
        const digest = hash.digest('hex');
        const secretKey = "super-secret-worker-key";
        const hmac = crypto.createHmac('sha256', secretKey);
        hmac.update(digest);
        const signature = hmac.digest('hex');

        return {
            status: 200,
            body: {
                test: "Crypto Hashing & HMAC",
                compatibility: "Universal (Node + Mobile)",
                original_message: message,
                salt: salt,
                sha256_hash: digest,
                hmac_signature: signature,
                timestamp: new Date().toISOString()
            }
        };
    } catch (err) {
        return {
            status: 500,
            body: {
                error: "Crypto operation failed",
                details: err.message
            }
        };
    }
}
