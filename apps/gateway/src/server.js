import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import dotenv from "dotenv";
import router from "./router.js";
import { parseWalletFromHost } from "./utils/wallet-parser.js";
import { receiveWorkerResult } from "./worker-results.js";

dotenv.config();

const app = Fastify({
  logger: true,                // Structured logs
  trustProxy: true,           // Required for real IPs behind proxies
  bodyLimit: 1 * 1024 * 1024  // 1 MB body limit
});
await app.register(helmet);

await app.register(cors, {
  origin: true,
  credentials: true
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute"
});


app.get("/health", async () => {
  return { status: "ok", service: "peerhost-gateway" };
});


app.all("/:project/:fn", async (req, reply) => {
  try {
    const host = req.headers.host;
    const wallet = parseWalletFromHost(host);

    if (!wallet) {
      return reply.status(400).send({
        error: "Invalid wallet subdomain"
      });
    }

    req.peerhost = {
      wallet,
      project: req.params.project,
      fn: req.params.fn
    };

    return await router(req, reply);

  } catch (err) {
    req.log.error(err);

    return reply.status(500).send({
      error: "Gateway internal error"
    });
  }
});

app.post("/_internal/worker-result", receiveWorkerResult);



app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  reply.status(500).send({
    error: "Unhandled gateway exception"
  });
});


const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  app.log.warn("⚠️  SUPABASE_URL or SUPABASE_KEY missing! Gateway will not function correctly.");
}

app.listen({ port: PORT, host: HOST })
  .then(() => {
    console.log(`PeerHost Gateway running on ${HOST}:${PORT}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
