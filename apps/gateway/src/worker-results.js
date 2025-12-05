import { supabase } from "./db/supabase.js";


export function waitForWorkerResult(requestId, { timeoutMs = 20000 } = {}) {
    return new Promise((resolve, reject) => {
        let isSettled = false;

        const timer = setTimeout(() => {
            if (isSettled) return;
            isSettled = true;
            cleanup();

            const err = new Error("Worker timeout");
            err.code = "EXECUTION_TIMEOUT";
            reject(err);
        }, timeoutMs);

        // 2. Setup Cleanup
        const cleanup = () => {
            clearTimeout(timer);
            if (channel) {
                supabase.removeChannel(channel);
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
                    const newRow = payload.new;

                    if (newRow.status === 'COMPLETED') {
                        isSettled = true;
                        cleanup();
                        resolve(newRow.result);
                    } else if (newRow.status === 'FAILED') {
                        isSettled = true;
                        cleanup();
                        const err = new Error("Worker reported failure");
                        err.code = "WORKER_FAILED";
                        reject(err);
                    }
                }
            )
            .subscribe();
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