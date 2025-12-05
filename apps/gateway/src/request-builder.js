import crypto from "crypto";
import { canonicalizeJson } from "./utils/canonical-json.js";
import { filterHeaders } from "./utils/header-filter.js";

export function buildRequest(req, identity) {
    const { wallet, project, functionName } = identity;

    const method = req.method.toUpperCase();

    const path = `/${project}/${functionName}`;

    const query = normalizeObject(req.query || {});
    const body = normalizeObject(req.body || null);

    const headers = filterHeaders(req.headers || {});

    const executionRequest = {
        meta: {
            wallet,
            project,
            function: functionName
        },
        http: {
            method,
            path,
            query,
            headers,
            body
        }
    };

    const canonicalJson = canonicalizeJson(executionRequest);

    const hash = crypto
        .createHash("sha256")
        .update(canonicalJson)
        .digest("hex");

    return {
        request: executionRequest,
        canonicalJson,
        hash
    };
}

function normalizeObject(obj) {
    if (obj === null) return null;

    if (Array.isArray(obj)) {
        return obj.map(normalizeObject);
    }

    if (typeof obj === "object") {
        const clean = {};
        for (const key of Object.keys(obj)) {
            const val = obj[key];
            if (
                val !== undefined &&
                typeof val !== "function" &&
                typeof val !== "symbol"
            ) {
                clean[key] = normalizeObject(val);
            }
        }
        return clean;
    }

    return obj;
}
