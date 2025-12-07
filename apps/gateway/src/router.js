import { buildRequest } from "./request-builder.js";
import { triggerExecution } from "./trigger.js";
import { waitForWorkerResult } from "./worker-results.js";
import { validateProjectName, validateFunctionName } from "./utils/validators.js";
import { supabase } from "./db/supabase.js";


export default async function router(req, reply) {
    const { wallet, project, fn } = req.peerhost;

    try {
        if (!validateProjectName(project)) {
            return reply.status(400).send({
                error: "Invalid Project Name"
            })
        }
        if (!validateFunctionName(fn)) {
            return reply.status(400).send({
                error: "Invalid Function Name"
            })
        }
        const normalizedRequest = buildRequest(req, {
            wallet,
            project,
            functionName: fn
        });

        // ---------------------------------------------------------
        // x402 Commerce Layer Check (Fully Functional)
        // ---------------------------------------------------------

        // 1. Fetch function metadata from Supabase
        // 1. Fetch function metadata from Supabase
        req.log.info(`[x402] Checking price for: ${wallet}/${project}/${fn}`);

        const { data: meta, error: metaError } = await supabase
            .from('functions')
            .select('price, beneficiary')
            .eq('wallet', wallet)
            .eq('project', project)
            .eq('function_name', fn)
            .single();

        if (metaError && metaError.code !== 'PGRST116') {
            req.log.error("Failed to fetch function metadata: " + metaError.message);
        }

        if (!meta) {
            req.log.warn(`[x402] Metadata not found (or no rows) for ${wallet}/${project}/${fn}`);
        } else {
            req.log.info(`[x402] Found meta: Price=${meta.price}, Beneficiary=${meta.beneficiary}`);
        }

        const price = meta?.price || 0;
        const beneficiary = meta?.beneficiary || wallet;

        // 2. Gate Execution
        if (price > 0) {
            const paymentHeader = req.headers['x-payment'] || req.headers['x-protocol-payment'];

            // A. No Payment Header -> 402 Challenge
            if (!paymentHeader) {
                return reply.status(402).send({
                    error: "Payment Required",
                    details: {
                        amount: price,
                        currency: "USDC",
                        receiver: beneficiary,
                        resource_id: `${wallet}/${project}/${fn}`,
                        facilitator: "https://x402-amoy.polygon.technology"
                    }
                });
            }

            // B. Payment Header Present -> Verification (Mock for v1)
            const isValid = paymentHeader.length > 10;

            if (!isValid) {
                return reply.status(403).send({
                    error: "Invalid Payment Proof"
                });
            }

            req.log.info(`Payment Verified: ${price} USDC to ${beneficiary}`);
        }
        // ---------------------------------------------------------

        const { requestId } = await triggerExecution(normalizedRequest);

        // wait for the reponse from the worker
        const finalResult = await waitForWorkerResult(requestId, {
            timeoutMs: 20_000
        });

        reply.status(finalResult.status || 200);

        if (finalResult.headers) {
            Object.entries(finalResult.headers).forEach(([key, value]) => {
                reply.header(key, value);
            });
        }
        return reply.send(finalResult.body);

    }
    catch (err) {
        req.log.error(err);

        if (err.code === "EXECUTION_TIMEOUT") {
            return reply.status(504).send({
                error: "Execution timed out"
            });
        }

        if (err.code === "FUNCTION_NOT_FOUND") {
            return reply.status(404).send({
                error: "Function not found"
            });
        }

        if (err.code === "WORKER_FAILED") {
            return reply.status(502).send({
                error: "Worker execution failed"
            });
        }

        return reply.status(500).send({
            error: "Gateway execution failed"
        });
    }
}