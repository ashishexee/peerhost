import { ethers } from "ethers";
import { getFunctionCID } from "./registry.js";
import { supabase } from "../db/supabase.js";
import { consensusManager } from "./consensus-manager.js";

export class AuditService {
    constructor(contract, wallet) {
        this.contract = contract;
        this.wallet = wallet;
        this.isRunning = false;
        this.interval = null;
        this.MIN_INTERVAL_MS = 2 * 60 * 1000;
        this.MAX_INTERVAL_MS = 5 * 60 * 1000;
        this.stealthMap = this.loadStealthConfig();
    }

    loadStealthConfig() {
        try {
            const configStr = process.env.STEALTH_AUDIT_MAP;
            if (!configStr) {
                console.warn("[Audit] STEALTH_AUDIT_MAP env var missing. Auditing disabled.");
                return [];
            }
            const map = JSON.parse(configStr);
            if (!Array.isArray(map) || map.length === 0) {
                console.warn("[Audit] STEALTH_AUDIT_MAP must be a non-empty JSON Array.");
                return [];
            }
            console.log(`[Audit] Loaded ${map.length} stealth verification profiles.`);
            return map;
        } catch (e) {
            console.error("[Audit] Failed to parse STEALTH_AUDIT_MAP:", e.message);
            return [];
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        console.log("[Audit] Stealth Service started. Monitoring network health...");
        this.scheduleNextRun();
    }

    stop() {
        this.isRunning = false;
        if (this.interval) clearTimeout(this.interval);
    }

    scheduleNextRun() {
        if (!this.isRunning) return;
        const delay = Math.floor(Math.random() * (this.MAX_INTERVAL_MS - this.MIN_INTERVAL_MS)) + this.MIN_INTERVAL_MS;

        console.log(`[Audit] Next random check in ${(delay / 1000).toFixed(1)}s`);

        this.interval = setTimeout(async () => {
            try {
                await this.injectAudit();
            } catch (err) {
                console.error("[Audit] Check failed:", err);
            }
            this.scheduleNextRun();
        }, delay);
    }

    generateStealthCase() {
        if (!this.stealthMap || this.stealthMap.length === 0) {
            return null;
        }

        const config = this.stealthMap[Math.floor(Math.random() * this.stealthMap.length)];
        const inputHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(config.inputs)));

        return {
            name: `Stealth Check (${config.fn})`,
            wallet: this.wallet.address,
            project: config.project,
            fn: config.fn,
            inputHash: inputHash,
            inputs: config.inputs
        };
    }

    async injectAudit() {
        const testCase = this.generateStealthCase();
        console.log(`[Audit] 🕵️ Injecting: ${testCase.project}/${testCase.fn}`);

        try {
            const cid = await getFunctionCID(
                testCase.wallet,
                testCase.project,
                testCase.fn
            );

            if (!cid) {
                console.warn(`[Audit] ⚠️ CID not found for ${testCase.project}/${testCase.fn}. Ensure it is registered in Contract/Supabase.`);
                return;
            }
            const tx = await this.contract.triggerRequest(
                testCase.wallet,
                testCase.project,
                testCase.fn,
                cid,
                testCase.inputHash
            );

            const receipt = await tx.wait(1);
            const event = receipt.logs.find(l => l.fragment?.name === "ExecutionRequested");
            const requestId = BigInt(event?.args?.requestId).toString();
            console.log(`[Audit] Check Launched. Request ID: ${requestId}`);

            const requestPayload = {
                http: { body: testCase.inputs },
                meta: {
                    wallet: testCase.wallet,
                    project: testCase.project,
                    function: testCase.fn
                }
            };

            const { error } = await supabase
                .from('requests')
                .insert({
                    request_id: requestId,
                    status: 'PENDING',
                    result: requestPayload,
                    created_at: new Date().toISOString()
                });

            if (error) console.error(`[Audit] DB Insert Failed: ${error.message}`);
            consensusManager.startSession(requestId);

        } catch (err) {
            console.error(`[Audit] Injection Failed:`, err.message);
        }
    }
}
