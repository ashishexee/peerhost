
import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import * as esbuild from "esbuild";
import { createClient } from "@supabase/supabase-js";
import util from "util";
import os from "os";
import AdmZip from "adm-zip";

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
        // 1. Download & Extract Zip (Git-free)
        console.log(`[Deploy ${deployId}] Downloading Zip...`);
        await fs.ensureDir(workDir);

        // Parse owner/repo from URL
        // Expected format: https://github.com/OWNER/REPO.git or https://github.com/OWNER/REPO
        const urlParts = repoUrl.replace(".git", "").split("/");
        const repoOwner = urlParts[urlParts.length - 2];
        const repoNameClean = urlParts[urlParts.length - 1];

        // Construct Zip URL from API (supports private repos with token)
        const zipUrl = `https://api.github.com/repos/${repoOwner}/${repoNameClean}/zipball/main`; // Default to main
        // Note: In a robust app, we should fetch default branch first. For now, we try 'main'. 
        // If 'main' fails, one could try 'master', but let's stick to 'main' for MVP or rely on the redirect?
        // Actually, /zipball without ref downloads default branch.
        const zipDownloadUrl = `https://api.github.com/repos/${repoOwner}/${repoNameClean}/zipball`;

        const headers = {
            "User-Agent": "PeerHost-Deployer",
            "Accept": "application/vnd.github+json"
        };
        if (gitToken) {
            headers["Authorization"] = `token ${gitToken}`;
        }

        const response = await fetch(zipDownloadUrl, { headers });
        if (!response.ok) {
            throw new Error(`Failed to download repo: ${response.statusText} (Ensure 'main' branch exists or token is valid)`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const zip = new AdmZip(buffer);
        zip.extractAllTo(workDir, true);

        // GitHub zip extracts to a subfolder like 'user-repo-sha'
        // We need to move contents up to workDir
        const files = await fs.readdir(workDir);
        const extractDir = files.find(f => fs.statSync(path.join(workDir, f)).isDirectory());

        if (extractDir) {
            const extractPath = path.join(workDir, extractDir);
            const contentFiles = await fs.readdir(extractPath);
            for (const file of contentFiles) {
                await fs.move(path.join(extractPath, file), path.join(workDir, file), { overwrite: true });
            }
            await fs.remove(extractPath);
        }

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
                    url: `https://peerhost-jl8u.vercel.app/run/${wallet}/${repoName}/${cleanFnName}`,
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
