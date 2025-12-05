const HOP_BY_HOP_HEADERS = new Set([
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailer",
    "transfer-encoding",
    "upgrade"
]);

export function filterHeaders(headers) {
    const clean = {};

    for (const [key, value] of Object.entries(headers)) {
        const lowerKey = key.toLowerCase();

        if (HOP_BY_HOP_HEADERS.has(lowerKey)) {
            continue;
        }

        clean[lowerKey] = value;
    }

    return clean;
}
