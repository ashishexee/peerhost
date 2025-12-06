import axios from "axios";
import NodeCache from "node-cache";

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// Use a public gateway or your own. 
// Ideally configure via env, defaulting to cloudflare or ipfs.io
// Fallback Gateways
const GATEWAYS = [
    process.env.IPFS_GATEWAY || "https://gateway.pinata.cloud/ipfs",
    "https://ipfs.io/ipfs",
    "https://dweb.link/ipfs"
];

export async function fetchFunctionCode(cid) {
    if (cache.has(cid)) {
        console.log(`[IPFS] Cache hit for ${cid}`);
        return cache.get(cid);
    }

    for (const gateway of GATEWAYS) {
        console.log(`[IPFS] Trying fetch ${cid} from ${gateway}...`);
        try {
            const response = await axios.get(`${gateway}/${cid}`, {
                timeout: 10000,
                responseType: 'text'
            });

            const code = response.data;
            // Basic validation to ensure we didn't get an HTML error page
            if (typeof code === 'string' && code.trim().startsWith('<')) {
                throw new Error("Received HTML content instead of code");
            }

            cache.set(cid, code);
            console.log(`[IPFS] Success from ${gateway}`);
            return code;
        } catch (err) {
            console.warn(`[IPFS] Failed from ${gateway}: ${err.message}`);
            // Continue to next gateway
        }
    }

    console.error(`[IPFS] All gateways failed for ${cid}`);
    throw new Error("Failed to fetch function code from any IPFS gateway");
}
