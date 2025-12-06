import Fastify from "fastify";
import cors from "@fastify/cors";
import helmet from "@fastify/helmet";
import rateLimit from "@fastify/rate-limit";
import dotenv from "dotenv";
import router from "./router.js";
import { parseWalletFromHost } from "./utils/wallet-parser.js";
import { receiveWorkerResult } from "./worker-results.js";
import { deployRepo } from "./services/github-deployer.js";
import path from "path";
import fs from "fs";

// Load Root .env
const rootEnv = path.resolve(process.cwd(), "../../.env");
console.log(`[Gateway] Loading .env from: ${rootEnv}`);

if (fs.existsSync(rootEnv)) {
  const result = dotenv.config({ path: rootEnv });
  // if (result.error) console.error("[Gateway] dotenv error:", result.error);
} else {
  // Fallback or just defaults (e.g. if running from root)
  dotenv.config();
}

const app = Fastify({
  logger: true,
  trustProxy: true,
  bodyLimit: 1 * 1024 * 1024
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


app.get("/health", async (req, reply) => {
  return { status: "ok", service: "peerhost-gateway" };
});

// GitHub OAuth Flow
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID;
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET;
const FRONTEND_URL = "http://localhost:3003/auth/callback";

app.get('/auth/github/login', async (req, reply) => {
  if (!GITHUB_CLIENT_ID) {
    return reply.status(500).send("Missing GITHUB_CLIENT_ID env var");
  }
  const scope = "repo user";
  const redirectUri = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${scope}`;
  return reply.redirect(redirectUri);
});

app.get('/auth/github/callback', async (req, reply) => {
  const { code } = req.query;
  if (!code) {
    return reply.status(400).send("No code provided");
  }

  try {
    const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({
        client_id: GITHUB_CLIENT_ID,
        client_secret: GITHUB_CLIENT_SECRET,
        code: code
      })
    });

    const tokenData = await tokenRes.json();
    if (tokenData.error) {
      throw new Error(tokenData.error_description || "GitHub Auth Failed");
    }

    const accessToken = tokenData.access_token;
    return reply.redirect(`${FRONTEND_URL}?token=${accessToken}`);

  } catch (err) {
    req.log.error(err);
    return reply.status(500).send("Authentication failed");
  }
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

// Deployment Endpoint
app.post('/deploy', async (request, reply) => {
  const { wallet, repoUrl, projectName, functionName, baseDir, envVars, gitToken } = request.body || {};

  if (!wallet || !repoUrl || (!functionName && !Array.isArray(functionName))) {
    return reply.status(400).send({ error: "Missing required fields: wallet, repoUrl, functionName(s)" });
  }

  try {
    const result = await deployRepo(wallet, repoUrl, functionName, baseDir, envVars, gitToken, projectName);
    return reply.send(result);
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: "Deployment Failed", details: err.message });
  }
});

app.post("/_internal/worker-result", receiveWorkerResult);


app.setErrorHandler((error, request, reply) => {
  request.log.error(error);

  reply.status(500).send({
    error: "Unhandled gateway exception"
  });
});


const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || "0.0.0.0";

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  app.log.warn("⚠️  SUPABASE_URL or SUPABASE_KEY missing! Gateway will not function correctly.");
}

app.listen({ port: PORT, host: HOST })
  .then(() => {
    console.log(`PeerHost Gateway running on ${HOST}:${PORT}`);
    console.log(`RPC_URL configured: ${process.env.RPC_URL ? 'YES' : 'NO'}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
