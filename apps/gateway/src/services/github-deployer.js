
import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import * as esbuild from "esbuild";
import { createClient } from "@supabase/supabase-js";
import util from "util";
import os from "os";

const execAsync = util.promisify(exec);

// Config
const PINATA_API_URL = "https://api.pinata.cloud/pinning/pinFileToIPFS";
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const PINATA_JWT = process.env.PINATA_JWT;

if (!SUPABASE_URL || !SUPABASE_KEY || !PINATA_JWT) {
    console.error("Missing Env Vars for Deployment Service");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export async function deployRepo(wallet, repoUrl, functionNames, baseDir = "functions", envVars = {}, gitToken = null, projectNameOverride = null, monetization = null) {
    const deployId = uuidv4();
    const workDir = path.resolve(os.tmpdir(), "peerhost", deployId);


    // Normalize input to array
    const fns = Array.isArray(functionNames) ? functionNames : [functionNames];
    const results = [];
    const repoName = projectNameOverride || repoUrl.split("/").pop().replace(".git", "");

    console.log(`[Batch Deploy ${deployId}] Starting for ${repoUrl} -> ${fns.length} functions (Project: ${repoName})`);
    if (monetization) {
        console.log(`[Batch Deploy ${deployId}] Monetization Request:`, monetization);
    } else {
        console.log(`[Batch Deploy ${deployId}] No Monetization Request`);
    }

    try {
        // 1. Clone (Once)
        console.log(`[Deploy ${deployId}] Cloning...`);
        await fs.ensureDir(workDir);

        let cloneCommand = `git clone ${repoUrl} .`;
        if (gitToken) {
            // Insert token into URL: https://TOKEN@github.com/...
            const authedUrl = repoUrl.replace("https://", `https://${gitToken}@`);
            cloneCommand = `git clone ${authedUrl} .`;
        }

        await execAsync(cloneCommand, { cwd: workDir });

        // 2. Install Deps (if package.json exists)
        if (await fs.pathExists(path.join(workDir, "package.json"))) {
            console.log(`[Deploy ${deployId}] Installing dependencies...`);
            await execAsync("npm install --production", { cwd: workDir });
        }

        // 3. Process Each Function
        for (const fnFile of fns) {
            try {
                const entryFile = path.join(workDir, baseDir, fnFile);
                console.log(`[Deploy ${deployId}] Processing ${fnFile}...`);

                if (!await fs.pathExists(entryFile)) {
                    console.error(`❌ Entry not found: ${entryFile}`);
                    results.push({ function: fnFile, success: false, error: "Entry file not found" });
                    continue;
                }

                // 4. Bundle
                const cleanFnName = path.basename(fnFile, path.extname(fnFile)); // "hello" from "hello.js"
                const outDir = path.join(workDir, "dist", cleanFnName);
                await fs.ensureDir(outDir);
                const outFile = path.join(outDir, "index.js");

                // Prepare Env Vars
                const define = {};
                if (envVars) {
                    console.log(`[Deploy ${deployId}] Env Vars received:`, envVars);
                    for (const [key, val] of Object.entries(envVars)) {
                        define[`process.env.${key}`] = JSON.stringify(val);
                    }
                    console.log(`[Deploy ${deployId}] Define keys:`, define);
                } else {
                    console.log(`[Deploy ${deployId}] No Env Vars received.`);
                }

                await esbuild.build({
                    entryPoints: [entryFile],
                    bundle: true,
                    outfile: outFile,
                    format: "esm", // ESM for compatibility
                    platform: "node",
                    target: "node18",
                    define: define
                });

                // 5. Upload to Pinata
                const blob = new Blob([fs.readFileSync(outFile)]);
                const formData = new FormData();
                formData.append("file", blob, "index.js");

                const pinRes = await fetch(PINATA_API_URL, {
                    method: "POST",
                    headers: { Authorization: `Bearer ${PINATA_JWT}` },
                    body: formData
                });

                if (!pinRes.ok) throw new Error(`Pinata Upload Failed: ${await pinRes.text()}`);

                const pinData = await pinRes.json();
                const cid = pinData.IpfsHash;
                console.log(`[Deploy ${deployId}] ${fnFile} CID: ${cid}`);

                // 6. Register
                // 6. Register
                const registerPayload = {
                    wallet: wallet.toLowerCase(),
                    project: repoName,
                    function_name: cleanFnName,
                    cid: cid
                };

                if (monetization) {
                    registerPayload.price = monetization.price || 0;
                    registerPayload.beneficiary = monetization.beneficiary || wallet;
                    console.log(`[Deploy ${deployId}] Function is monetized: ${registerPayload.price} USDC`);
                }

                const { error } = await supabase.from('functions').upsert(registerPayload, { onConflict: 'wallet,project,function_name' });

                if (error) throw error;

                results.push({
                    function: fnFile,
                    success: true,
                    url: `http://${wallet}.localhost:3001/${repoName}/${cleanFnName}`,
                    cid: cid
                });

            } catch (innerErr) {
                console.error(`[Deploy ${deployId}] Error processing ${fnFile}:`, innerErr);
                results.push({ function: fnFile, success: false, error: innerErr.message });
            }
        }

        // Cleanup
        try { await fs.remove(workDir); } catch (e) { }

        // Return results wrapper
        return {
            success: results.some(r => r.success),
            results: results
        };

    } catch (err) {
        console.error(`[Deploy ${deployId}] Fatal Error:`, err);
        try { await fs.remove(workDir); } catch (e) { }
        throw err;
    }
}
