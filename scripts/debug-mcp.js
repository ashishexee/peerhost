
const targetUrl = process.argv[2];

if (!targetUrl) {
    console.error("Usage: node debug-mcp.js http://wallet.localhost:3001/project");
    process.exit(1);
}

async function fetchTools() {
    try {
        const mcpUrl = `${targetUrl}/mcp.json`;
        console.log(`[Debug] Fetching manifest from ${mcpUrl}...`);

        const u = new URL(mcpUrl);
        const headers = {};
        if (u.hostname.endsWith(".localhost")) {
            headers["X-Forwarded-Host"] = u.hostname + (u.port ? `:${u.port}` : "");
            u.hostname = "127.0.0.1";
        }

        console.log(`[Debug] Actual URL: ${u.toString()}`);
        console.log(`[Debug] Headers:`, headers);

        const res = await fetch(u.toString(), { headers });
        console.log(`[Debug] Status: ${res.status} ${res.statusText}`);

        const text = await res.text();
        console.log(`[Debug] Body: ${text}`);

        if (!res.ok) {
            console.error("❌ Failed!");
        } else {
            console.log("✅ Success!");
            console.log(JSON.parse(text));
        }

    } catch (err) {
        console.error("[Debug] Error:", err.message);
    }
}

fetchTools();
