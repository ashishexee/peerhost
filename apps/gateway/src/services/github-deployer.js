import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import * as esbuild from "esbuild"; 
import { createClient } from "@supabase/supabase-js";
import util from "util";
import os from "os";
import AdmZip from "adm-zip";
import { polyfillNode } from "esbuild-plugin-polyfill-node"; 

const execAsync = util.promisify(exec);

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
        console.log(`[Deploy ${deployId}] Downloading Zip...`);
        await fs.ensureDir(workDir);

        const urlParts = repoUrl.replace(".git", "").split("/");
        const repoOwner = urlParts[urlParts.length - 2];
        const repoNameClean = urlParts[urlParts.length - 1];
        const zipUrl = `https://api.github.com/repos/${repoOwner}/${repoNameClean}/zipball/main`; // Default to main
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

        if (await fs.pathExists(path.join(workDir, "package.json"))) {
            console.log(`[Deploy ${deployId}] Installing dependencies...`);
            await execAsync("npm install --production", { cwd: workDir });
        }

        for (const fnFile of fns) {
            try {
                const entryFile = path.join(workDir, baseDir, fnFile);
                console.log(`[Deploy ${deployId}] Processing ${fnFile}...`);

                if (!await fs.pathExists(entryFile)) {
                    console.error(`❌ Entry not found: ${entryFile}`);
                    results.push({ function: fnFile, success: false, error: "Entry file not found" });
                    continue;
                }
                const cleanFnName = path.basename(fnFile, path.extname(fnFile));
                const outDir = path.join(workDir, "dist", cleanFnName);
                await fs.ensureDir(outDir);
                const outFile = path.join(outDir, "index.js");
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
                    format: "iife", 
                    globalName: "peerhost_bundle",
                    platform: "browser",
                    target: "es2020",
                    plugins: [
                        polyfillNode({
                            polyfills: {
                                crypto: true,
                                buffer: true,
                                util: true,
                                stream: true,
                                string_decoder: true,
                                path: true,
                                os: true,
                                events: true,
                                assert: true,
                            }
                        })
                    ],
                    define: define,
                    footer: {
                        js: "if(typeof peerhost_bundle !== 'undefined') { globalThis.peerhost_worker = peerhost_bundle; }"
                    }
                });

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
                    url: `${process.env.GATEWAY_URL}/run/${wallet}/${repoName}/${cleanFnName}`,
                    cid: cid
                });

            } catch (innerErr) {
                console.error(`[Deploy ${deployId}] Error processing ${fnFile}:`, innerErr);
                results.push({ function: fnFile, success: false, error: innerErr.message });
            }
        }

        try { await fs.remove(workDir); } catch (e) { }

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
