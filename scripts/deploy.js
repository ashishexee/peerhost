
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

// Configuration
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

const WALLET_ADDRESS = "0xda684a91a506f3e303834c97784dee2b31bbc6bc"; // Deployer
const PROJECT_NAME = "real-project";
const FUNCTION_NAME = "hello";

// Assume we run this from project root or scripts folder?
// Let's make it robust by using an env var or arg, or defaulting relative to THIS script
// Start from current work dir.
const FILE_PATH = path.resolve(process.cwd(), "testing-repo/functions/hello.js");

async function deploy() {
    if (!PINATA_JWT) {
        console.error("❌ PINATA_JWT is missing from environment variables.");
        process.exit(1);
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error("❌ SUPABASE credentials missing.");
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log(`🚀 Deploying ${PROJECT_NAME}/${FUNCTION_NAME}...`);

    try {
        console.log(`📂 Reading file from: ${FILE_PATH}`);

        // 1. Upload to Pinata
        console.log("📤 Uploading to Pinata...");
        const blob = new Blob([fs.readFileSync(FILE_PATH)]);
        const formData = new FormData();
        formData.append("file", blob, "function.js");

        const pinRes = await fetch(PINATA_API_URL, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${PINATA_JWT}`
            },
            body: formData
        });

        if (!pinRes.ok) {
            throw new Error(`Pinata Upload Failed: ${pinRes.status} ${await pinRes.text()}`);
        }

        const pinData = await pinRes.json();
        const cid = pinData.IpfsHash;
        console.log(`✅ Uploaded to IPFS: ${cid}`);

        // 2. Register in Supabase
        console.log("📝 Registering in Supabase...");
        const { error } = await supabase
            .from('functions')
            .upsert({
                wallet: WALLET_ADDRESS,
                project: PROJECT_NAME,
                function_name: FUNCTION_NAME,
                cid: cid
            }, { onConflict: 'wallet,project,function_name' });

        if (error) {
            throw new Error(`Supabase Registration Failed: ${error.message}`);
        }

        console.log("✅ Deployment Complete!");
        console.log(`🌍 URL: http://localhost:3000/${PROJECT_NAME}/${FUNCTION_NAME}`);

    } catch (err) {
        console.error("❌ Deployment Failed:", err);
    }
}

deploy();
