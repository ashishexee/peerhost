import axios from "axios";
import NodeCache from "node-cache";

// Cache for 1 hour
const cache = new NodeCache({ stdTTL: 3600 });

// Use a public gateway or your own. 
// Ideally configure via env, defaulting to cloudflare or ipfs.io
const GATEWAY = process.env.IPFS_GATEWAY || "https://ipfs.io/ipfs";

export async function fetchFunctionCode(cid) {
    if (cache.has(cid)) {
        console.log(`[IPFS] Cache hit for ${cid}`);
        return cache.get(cid);
    }

    console.log(`[IPFS] Fetching ${cid} from ${GATEWAY}...`);
    try {
        const response = await axios.get(`${GATEWAY}/${cid}`, {
            timeout: 10000,
            responseType: 'text'
        });

        const code = response.data;
        cache.set(cid, code);
        return code;
    } catch (err) {
        console.error(`[IPFS] Failed to fetch ${cid}:`, err.message);
        throw new Error("Failed to fetch function code from IPFS");
    }
}
