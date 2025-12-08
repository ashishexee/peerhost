const targetUrl = process.argv[2];

if (!targetUrl) {
    console.error("❌ Please provide the URL of your monetized function.");
    console.error("Usage: node verify-agentic-payment.js http://wallet.localhost:3001/project/fn");
    process.exit(1);
}

async function customFetch(url, options = {}) {
    const u = new URL(url);
    const headers = { ...options.headers };
    if (u.hostname.endsWith(".localhost")) {
        const originalHost = u.hostname + (u.port ? `:${u.port}` : "");
        headers["X-Forwarded-Host"] = originalHost;
        u.hostname = "127.0.0.1";
    }

    return fetch(u.toString(), { ...options, headers });
}

async function verify() {
    console.log(`\n🔍 Verifying Agentic Payment Flow for: ${targetUrl}\n`);

    process.stdout.write("1️⃣  Requesting WITHOUT Payment... ");
    try {
        const res1 = await customFetch(targetUrl);

        if (res1.status === 402) {
            console.log("✅ Passed (Received 402)");
            const data = await res1.json();
            console.log("   could not execute, payment required:");
            console.log(`   💰 Price: ${data.details?.amount} ${data.details?.currency}`);
            console.log(`   🔗 Facilitator: ${data.details?.facilitator}`);
        } else {
            console.log("❌ Failed!");
            console.log(`   Expected 402, got ${res1.status}`);
            console.log(await res1.text());
        }
    } catch (err) {
        console.log("❌ Network Error:", err.message);
        console.log("   (Ensure Gateway is running on port 3001)");
        return;
    }

    // ---------------------------------------------------------
    // Step 2: Attempt Request WITH Payment
    // ---------------------------------------------------------
    console.log("\n---------------------------------------------------------");
    process.stdout.write("2️⃣  Requesting WITH Payment Proof... ");

    try {
        const res2 = await customFetch(targetUrl, {
            headers: {
                // This is the mock proof accepted by our router logic
                "X-Payment": "valid-proof-simulated-signature-xyz"
            }
        });

        if (res2.status === 200) {
            console.log("✅ Passed (Received 200)");
            const text = await res2.text();
            console.log("   🎉 Execution Successful!");
            console.log("   Output:", text);
        } else {
            console.log("❌ Failed!");
            console.log(`   Expected 200, got ${res2.status}`);
            console.log(await res2.text());
        }
    } catch (err) {
        console.log("❌ Network Error:", err.message);
    }
    console.log("\n---------------------------------------------------------\n");
}

verify();
