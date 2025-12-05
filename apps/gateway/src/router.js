import { buildRequest } from "./request-builder.js";
import { triggerExecution } from "./trigger.js";
import { waitForWorkerResult } from "./worker-results.js";
import { validateProjectName, validateFunctionName } from "./utils/validators.js";


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