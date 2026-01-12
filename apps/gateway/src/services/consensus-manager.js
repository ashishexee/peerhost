import { ethers } from "ethers";
import { supabase } from "../db/supabase.js";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const ExecutionABI = require("../abi/ExecutionCoordinator.json");
class ConsensusManager {
    constructor() {
        this.sessions = new Map();

        const rpcUrl = process.env.RPC_URL;
        if (rpcUrl) {
            this.provider = new ethers.JsonRpcProvider(rpcUrl);
            this.wallet = new ethers.Wallet(process.env.GATEWAY_PRIVATE_KEY, this.provider);
            this.contract = new ethers.Contract(process.env.EXECUTION_CONTRACT_ADDRESS, ExecutionABI, this.wallet);
        } else {
            console.warn("[ConsensusManager] Missing RPC_URL. Contract interactions disabled.");
        }
    }

    startSession(requestId) {
        if (this.sessions.has(requestId)) return;

        console.log(`[Consensus] Starting session for ${requestId}`);

        this.sessions.set(requestId, {
            startTime: Date.now(),
            submissions: [],
            hasRespondedToUser: false,
            timer: setTimeout(() => this.finalizeSession(requestId), 30_000)
        });
    }

    async addSignature(requestId, workerAddress, signature, resultHash, resultPayload) {
        let session = this.sessions.get(requestId);

        if (!session) {
            console.warn(`[Consensus] Late or invalid submission for ${requestId} from ${workerAddress}`);
            return false;
        }

        if (session.submissions.find(s => s.worker === workerAddress)) {
            return false;
        }

        try {
            const messageHash = ethers.solidityPackedKeccak256(
                ["uint256", "bytes32"],
                [requestId, resultHash]
            );

            const recoveredAddress = ethers.verifyMessage(ethers.getBytes(messageHash), signature);

            if (recoveredAddress.toLowerCase() !== workerAddress.toLowerCase()) {
                console.warn(`[Consensus] Invalid signature from ${workerAddress}. Recovered: ${recoveredAddress}`);
                return false;
            }
        } catch (err) {
            console.error(`[Consensus] Sig verification error: ${err.message}`);
            return false;
        }

        console.log(`[Consensus] Valid submission received for ${requestId} from ${workerAddress}`);

        session.submissions.push({
            worker: workerAddress,
            signature,
            resultHash,
            resultPayload,
            timestamp: Date.now()
        });

        if (!session.hasRespondedToUser) {
            session.hasRespondedToUser = true;
            console.log(`[Consensus] Instant Response triggered for ${requestId}`);

            supabase
                .from('requests')
                .update({
                    status: 'COMPLETED',
                    result: resultPayload,
                    updated_at: new Date().toISOString()
                })
                .eq('request_id', requestId)
                .then(({ error }) => {
                    if (error) console.error(`[Consensus] Failed to send instant response: ${error.message}`);
                });
        }

        return true;
    }

    async finalizeSession(requestId) {
        const session = this.sessions.get(requestId);
        if (!session) return;

        this.sessions.delete(requestId);
        console.log(`[Consensus] Finalizing ${requestId}. Total subs: ${session.submissions.length}`);

        if (session.submissions.length === 0) {
            await this.markFailed(requestId, "No workers submitted results");
            return;
        }


        const hashCounts = {};
        session.submissions.forEach(sub => {
            hashCounts[sub.resultHash] = (hashCounts[sub.resultHash] || 0) + 1;
        });

        let majorityHash = null;
        let maxVotes = -1;

        for (const [hash, count] of Object.entries(hashCounts)) {
            if (count > maxVotes) {
                maxVotes = count;
                majorityHash = hash;
            }
        }

        console.log(`[Consensus] Majority Hash: ${majorityHash} (${maxVotes} votes)`);
        const SLASH_THRESHOLD = 0.66; 
        const totalVotes = session.submissions.length;
        const majorityPercentage = maxVotes / totalVotes;

        const honestSubs = session.submissions.filter(s => s.resultHash === majorityHash);
        const dishonestSubs = session.submissions.filter(s => s.resultHash !== majorityHash);

        console.log(`[Consensus] Majority: ${(majorityPercentage * 100).toFixed(1)}% (${maxVotes}/${totalVotes})`);
        const shouldSlash = majorityPercentage >= SLASH_THRESHOLD;

        if (!shouldSlash) {
            console.log(`[Consensus] ⚠️  No strong majority (${(majorityPercentage * 100).toFixed(1)}% < ${(SLASH_THRESHOLD * 100)}%). NOT slashing minority.`);
            console.log(`[Consensus] This likely indicates non-deterministic execution or tie.`);
        } else {
            console.log(`[Consensus] ✓ Strong majority detected (${(majorityPercentage * 100).toFixed(1)}% >= ${(SLASH_THRESHOLD * 100)}%). Will slash ${dishonestSubs.length} dishonest workers.`);
        }

        if (honestSubs.length === 0) {
            console.warn(`[Consensus] No honest subs found? Logic error.`);
            return;
        }

        honestSubs.sort((a, b) => a.timestamp - b.timestamp);
        const fastestWorker = honestSubs[0].worker;

        const LIMIT = 50;

        const workersArg = honestSubs.slice(0, LIMIT).map(s => s.worker);
        const sigsArg = honestSubs.slice(0, LIMIT).map(s => s.signature);
        const slasheesArg = shouldSlash ? dishonestSubs.map(s => s.worker) : [];

        try {
            console.log(`[Consensus] Submitting finalizeRequests to chain...`);

            const requestIdHex = ethers.toBeHex(BigInt(requestId), 32);
            console.log('This is the data i am sending,, this is the workersArg', workersArg);
            console.log('this is the fastestWorker that i am sending',fastestWorker);

            const tx = await this.contract.finalizeRequests(
                requestIdHex,
                majorityHash,
                workersArg,
                sigsArg,
                fastestWorker,
                slasheesArg
            );

            console.log(`[Consensus] Tx sent: ${tx.hash}`);

        } catch (err) {
            console.error(`[Consensus] Blockchain Finalization Failed:`, err);
        }
    }

    async markFailed(requestId, reason) {
        console.error(`[Consensus] Failed ${requestId}: ${reason}`);
        await supabase
            .from('requests')
            .update({
                status: 'FAILED',
                result: { error: reason },
                updated_at: new Date().toISOString()
            })
            .eq('request_id', requestId);
    }
}

export const consensusManager = new ConsensusManager();
