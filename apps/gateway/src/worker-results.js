import { supabase } from "./db/supabase.js";



export function waitForWorkerResult(requestId, { timeoutMs = 20000 } = {}) {
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

        // Check Logic
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
                    const err = new Error("Worker reported failure");
                    err.code = "WORKER_FAILED";
                    reject(err);
                }
            }
        };

        // 1. Realtime Subscription
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
                    console.log(`[Gateway] Realtime update received for ${requestId}`);
                    // Re-check full status to be safe
                    checkStatus();
                }
            )
            .subscribe((status) => {
                console.log(`[Gateway] Subscription status for ${requestId}:`, status);
                // Initial check once subscribed
                checkStatus();
            });

        // 2. Polling Fallback (every 2s)
        pollInterval = setInterval(() => {
            console.log(`[Gateway] Polling status for ${requestId}...`);
            checkStatus();
        }, 2000);
    });
}

/**
 * Called when a worker posts a result
 */
export async function receiveWorkerResult(req, reply) {
    const { requestId, result } = req.body;

    if (!requestId || !result) {
        return reply.status(400).send({ error: "Missing requestId or result" });
    }

    // Update Supabase. This will trigger the Realtime event for the waiting Gateway (could be this one or another).
    const { error } = await supabase
        .from('requests')
        .update({
            status: 'COMPLETED',
            result: result,
            updated_at: new Date().toISOString()
        })
        .eq('request_id', requestId);

    if (error) {
        req.log.error(error);
        return reply.status(500).send({
            error: "Failed to update result"
        });
    }

    return reply.send({ success: true });
}