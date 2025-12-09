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
        // x402 Commerce Layer Check 
        // ---------------------------------------------------------

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
                // Return Standard x402 Header
                const x402Params = `token="${Buffer.from(JSON.stringify({
                    amount: price,
                    currency: "USDC",
                    receiver: beneficiary,
                    network: "polygon-amoy"
                })).toString('base64')}", access_type="bearer"`;

                reply.header("WWW-Authenticate", `x402 ${x402Params}`);
                reply.type('application/json');

                const atomicPrice = Math.floor(price * 1_000_000).toString(); // USDC 6 decimals

                return reply.status(402).send({
                    x402Version: 1,
                    error: "X-PAYMENT header is required",
                    accepts: [
                        {
                            scheme: "exact",
                            network: "polygon-amoy",
                            maxAmountRequired: atomicPrice,
                            resource: `https://${req.headers.host}${req.url}`,
                            description: `Execution of ${project}/${fn}`,
                            mimeType: "application/json",
                            payTo: beneficiary,
                            maxTimeoutSeconds: 60,
                            asset: "0x41E94Eb019C0762f9Bfcf9Fb1E58725BfB0e7582"
                        }
                    ]
                });
            }

            // B. Payment Header Present -> Verification (Mock for v1)
            const isValid = paymentHeader.length > 10; // Mock verification

            if (!isValid) {
                return reply.status(403).send({
                    error: "Invalid Payment Proof"
                });
            }

            // Payment Verified! Log the transaction for Earnings Dashboard
            // Fire-and-forget (don't block execution)
            (async () => {
                try {
                    const payerHeader = req.headers['x-payment'];
                    if (!payerHeader) {
                        return reply.status(403).send({
                            error: "Invalid Payment Proof"
                        });
                    }
                    const paymentData = JSON.parse(Buffer.from(payerHeader, 'base64').toString());
                    const payerWallet = paymentData.payer
                        || paymentData.from
                        || paymentData.buyer
                        || paymentData.wallet
                        || paymentData.address
                        || '0x0000000000000000000000000000000000000000';
                    req.log.info(`[x402] Logging transaction... Payer: ${payerWallet}, Amount: ${price}`);

                    const { error: insertError } = await supabase.from('transactions').insert({
                        beneficiary: beneficiary,
                        payer: payerWallet,
                        amount: price,
                        project: project,
                        function_name: fn,
                        signature: typeof paymentHeader === 'string' ? paymentHeader : JSON.stringify(paymentHeader),
                        resource_id: `${wallet}/${project}/${fn}`
                    });

                    if (insertError) req.log.error(`[x402] DB Error: ${insertError.message}`);
                    else req.log.info(`[x402] Transaction logged!`);
                } catch (logErr) {
                    req.log.error(`[x402] Logging Failed: ${logErr.message}`);
                }
            })();
        }
        // ---------------------------------------------------------

        // 3. Trigger Execution (Only if paid or free)
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

    } catch (err) {
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