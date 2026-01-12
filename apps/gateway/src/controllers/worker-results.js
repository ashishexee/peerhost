import { supabase } from "../db/supabase.js";
import { consensusManager } from "../services/consensus-manager.js";

export function waitForWorkerResult(requestId, { timeoutMs = 40000 } = {}) {
    return new Promise((resolve, reject) => {
        let isSettled = false;
        let pollInterval;

        const cleanup = () => {
            clearTimeout(timer);
            clearInterval(pollInterval);
            if (channel) {
                supabase.removeChannel(channel);
            }
        };

        const timer = setTimeout(() => {
            if (isSettled) return;
            isSettled = true;
            cleanup();

            const err = new Error("Worker timeout");
            err.code = "EXECUTION_TIMEOUT";
            reject(err);
        }, timeoutMs);

        const checkStatus = async () => {
            if (isSettled) return;
            const { data, error } = await supabase
                .from('requests')
                .select('status, result')
                .eq('request_id', requestId)
                .single();

            if (data && !isSettled) {
                if (data.status === 'COMPLETED') {
                    isSettled = true;
                    cleanup();
                    resolve(data.result);
                } else if (data.status === 'FAILED') {
                    isSettled = true;
                    cleanup();
                    const err = new Error("Worker reported failure or consensus failed");
                    err.code = "WORKER_FAILED";
                    reject(err);
                }
            }
        };

        const channel = supabase
            .channel(`request-${requestId}`)
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'requests',
                    filter: `request_id=eq.${requestId}`
                },
                (payload) => {
                    if (isSettled) return;
                    checkStatus();
                }
            )
            .subscribe((status) => {
                checkStatus();
            });

        pollInterval = setInterval(() => {
            checkStatus();
        }, 2000);
    });
}

export async function submitSignatureEndpoint(req, reply) {
    const { requestId, workerAddress, signature, resultHash, result } = req.body;

    if (!requestId || !workerAddress || !signature || !resultHash) {
        return reply.status(400).send({ error: "Missing fields (requestId, workerAddress, signature, resultHash)" });
    }

    try {
        const added = await consensusManager.addSignature(requestId, workerAddress, signature, resultHash, result);

        if (added) {
            return reply.send({ success: true, status: "accepted" });
        } else {
            return reply.status(409).send({ error: "Duplicate or invalid session" });
        }
    } catch (err) {
        req.log.error(err);
        return reply.status(500).send({ error: "Internal Error" });
    }
}