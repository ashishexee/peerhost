import { buildRequest } from "../utils/request-builder.js";
import { triggerExecution } from "../controllers/trigger.js";
import { waitForWorkerResult } from "../controllers/worker-results.js";
import { validateProjectName, validateFunctionName } from "../utils/validators.js";
import { supabase } from "../db/supabase.js";
import { checkAndRecordUsage } from "../services/billing-service.js";


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

        const usageCheck = await checkAndRecordUsage(wallet, project, fn);
        if (!usageCheck.allowed) {
            return reply.status(usageCheck.code).send({
                error: usageCheck.error
            });
        }

        const normalizedRequest = buildRequest(req, {
            wallet,
            project,
            functionName: fn
        });

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

        if (price > 0) {
            const paymentHeader = req.headers['x-payment'] || req.headers['x-protocol-payment'];

            if (!paymentHeader) {
                const x402Params = `token="${Buffer.from(JSON.stringify({
                    amount: price,
                    currency: "USDC",
                    receiver: beneficiary,
                    network: "polygon-amoy"
                })).toString('base64')}", access_type="bearer"`;

                reply.header("WWW-Authenticate", `x402 ${x402Params}`);
                reply.type('application/json');

                const atomicPrice = Math.floor(price * 1_000_000).toString();

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

            const isValid = paymentHeader.length > 10;

            if (!isValid) {
                return reply.status(403).send({
                    error: "Invalid Payment Proof"
                });
            }

            (async () => {
                try {
                    const paymentHeader = req.headers['x-payment'];

                    let payerWallet = '0x0000000000000000000000000000000000000000';
                    try {
                        if (paymentHeader.includes('.')) {
                            req.log.info(`[x402 DEBUG] Payment header looks like JWT format`);
                            const parts = paymentHeader.split('.');
                            if (parts.length === 3) {
                                const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
                                req.log.info(`[x402 DEBUG] JWT Payload: ${JSON.stringify(payload, null, 2)}`);
                                payerWallet = payload.payer || payload.from || payload.sub || payload.address || '0x0000000000000000000000000000000000000000';
                            }
                        } else {
                            const paymentData = JSON.parse(Buffer.from(paymentHeader, 'base64').toString());
                            req.log.info(`[x402 DEBUG] Full decoded object: ${JSON.stringify(paymentData, null, 2)}`);
                            req.log.info(`[x402 DEBUG] Available keys: ${Object.keys(paymentData).join(', ')}`);

                            payerWallet = paymentData?.payload?.authorization?.from
                                || paymentData.payer
                                || paymentData.from
                                || paymentData.buyer
                                || paymentData.wallet
                                || paymentData.address
                                || '0x0000000000000000000000000000000000000000';
                        }

                        req.log.info(`[x402 DEBUG] Final extracted wallet: ${payerWallet}`);
                    } catch (decodeErr) {
                        req.log.error(`[x402 DEBUG] Decode error: ${decodeErr.message}`);
                        req.log.error(`[x402 DEBUG] Payment header type: ${typeof paymentHeader}`);
                        req.log.error(`[x402 DEBUG] Payment header first 100 chars: ${paymentHeader.substring(0, 100)}`);
                    }

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

        const { requestId } = await triggerExecution(normalizedRequest);

        const finalResultRaw = await waitForWorkerResult(requestId, {
            timeoutMs: 100_000
        });

        req.log.info(`[Router Debug] Raw Worker Result: ${JSON.stringify(finalResultRaw)}`);

        let finalResult = finalResultRaw;
        if (typeof finalResult === 'string') {
            try {
                finalResult = JSON.parse(finalResult);
            } catch (e) {
                req.log.warn("Could not parse worker result as JSON, treating as raw string.");
                finalResult = {
                    status: 200,
                    body: finalResultRaw
                };
            }
        }
        if (finalResult && typeof finalResult === 'object' && !finalResult.body) {
            finalResult = {
                status: 200,
                body: finalResult
            };
        }

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