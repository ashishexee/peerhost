
import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import * as esbuild from "esbuild";

// Configuration
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

const WALLET_ADDRESS = "0xda684a91a506f3e303834c97784dee2b31bbc6bc";
const PROJECT_NAME = "real-project";
const FUNCTION_NAME = "complex";
const PRICE = process.env.PRICE;
const BENEFICIARY = process.env.BENEFICIARY;

// Source file (Complex Project Entry)
const ENTRY_FILE = path.resolve(process.cwd(), "../../testing-repo/complex/index.js");
const OUT_FILE = path.resolve(process.cwd(), "bundle.js");

async function deploy() {
    if (!PINATA_JWT) {
        console.error("❌ PINATA_JWT missing");
        process.exit(1);
    }
    if (!SUPABASE_URL || !SUPABASE_KEY) {
        console.error("❌ SUPABASE credentials missing");
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

    try {
        console.log(`🔨 Bundling ${ENTRY_FILE}...`);

        // Bundle with esbuild
        await esbuild.build({
            entryPoints: [ENTRY_FILE],
            bundle: true,
            outfile: OUT_FILE,
            format: "iife", // Wrap in IIFE
            globalName: "Entry", // Expose as global var
            platform: "browser", // Bundle all non-native modules
            target: "es2020",
            footer: {
                // Return the execution result of the default export
                js: "if (typeof Entry.default === 'function') { Entry.default(); } else { Entry.default; }"
            }
        });

        console.log(`✅ Bundled to ${OUT_FILE}`);

        // 1. Upload to Pinata
        console.log("📤 Uploading Bundle to Pinata...");
        const blob = new Blob([fs.readFileSync(OUT_FILE)]);
        const formData = new FormData();
        formData.append("file", blob, "function.js");

        const pinRes = await fetch(PINATA_API_URL, {
            method: "POST",
            headers: { Authorization: `Bearer ${PINATA_JWT}` },
            body: formData
        });

        if (!pinRes.ok) {
            const text = await pinRes.text();
            console.error(`Pinata Error: ${text}`);
            throw new Error(`Upload Failed: ${pinRes.status}`);
        }

        const pinData = await pinRes.json();
        const cid = pinData.IpfsHash;
        console.log(`✅ Uploaded to IPFS: ${cid}`);

        // 2. Register
        console.log("📝 Registering...");
        const { error } = await supabase.from('functions').upsert({
            wallet: WALLET_ADDRESS,
            project: PROJECT_NAME,
            function_name: FUNCTION_NAME,
            cid: cid,
            price: process.env.PRICE || 0,
            beneficiary: process.env.BENEFICIARY || WALLET_ADDRESS
        }, { onConflict: 'wallet,project,function_name' });

        if (error) throw error;

        console.log("✅ Deployed Complex Function!");
        console.log(`🌍 URL: http://${WALLET_ADDRESS}.localhost:3000/${PROJECT_NAME}/${FUNCTION_NAME}`);

    } catch (err) {
        console.error("Deploy Failed:", err);
    }
}

deploy();
