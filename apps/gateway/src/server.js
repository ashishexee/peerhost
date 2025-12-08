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
import { supabase } from "./db/supabase.js";

const rootEnv = path.resolve(process.cwd(), "../../.env");
console.log(`[Gateway] Loading .env from: ${rootEnv}`);

if (fs.existsSync(rootEnv)) {
  const result = dotenv.config({ path: rootEnv });
} else {
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
  credentials: true,
  exposedHeaders: ["WWW-Authenticate", "x-payment", "x-protocol-payment"]
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
const FRONTEND_URL = "https://peerhost.vercel.app/auth/callback";

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

async function serveManifest(req, reply, wallet, project, host) {
  if (!wallet) return reply.status(400).send({ error: "Invalid wallet subdomain" });

  const { data: fns, error } = await supabase
    .from('functions')
    .select('function_name, price, beneficiary')
    .eq('wallet', wallet)
    .eq('project', project);

  if (error) {
    req.log.error("Supabase Error: " + error.message);
    throw error;
  }

  if (!fns || fns.length === 0) {
    return reply.status(404).send({ error: "Project not found or has no functions" });
  }

  const manifest = {
    schema_version: "v1",
    name_for_model: project,
    description_for_model: `Serverless tools provided by ${wallet}`,
    tools: fns.map(f => ({
      name: f.function_name,
      description: `Executes ${f.function_name}. Price: ${f.price || 0} USDC.`,
      parameters: {
        type: "object",
        properties: {
          body: { type: "object", description: "JSON payload" }
        }
      },
      url: `https://${host}/run/${wallet}/${project}/${f.function_name}`,
      pricing: {
        price: f.price || 0,
        currency: "USDC",
        beneficiary: f.beneficiary
      }
    }))
  };

  return reply.send(manifest);
}


// Path-based routing for Vercel (where wildcard subdomains are not supported)
app.all("/run/:wallet/:project/:fn", async (req, reply) => {
  try {
    const { wallet: rawWallet, project, fn } = req.params;
    const wallet = rawWallet?.toLowerCase();

    if (!wallet) {
      return reply.status(400).send({ error: "Invalid path parameters" });
    }

    if (fn === 'mcp.json') {
      return await serveManifest(req, reply, wallet, project, req.headers.host);
    }

    req.peerhost = {
      wallet,
      project,
      fn
    };

    return await router(req, reply);
  } catch (err) {
    req.log.error(err);
    return reply.status(500).send({ error: "Gateway internal error" });
  }
});

app.all("/:project/:fn", async (req, reply) => {
  try {
    const host = req.headers['x-forwarded-host'] || req.headers.host;
    const wallet = parseWalletFromHost(host);
    const { project, fn } = req.params;

    if (fn === 'mcp.json') {
      return await serveManifest(req, reply, wallet, project, host);
    }

    if (!wallet) {
      return reply.status(400).send({
        error: "Invalid wallet subdomain"
      });
    }

    req.peerhost = {
      wallet,
      project,
      fn
    };

    return await router(req, reply);

  } catch (err) {
    req.log.error(err);

    return reply.status(500).send({
      error: "Gateway internal error"
    });
  }
});

app.post('/deploy', async (request, reply) => {
  const { wallet, repoUrl, projectName, functionName, baseDir, envVars, gitToken, monetization } = request.body || {};

  if (!wallet || !repoUrl || (!functionName && !Array.isArray(functionName))) {
    return reply.status(400).send({ error: "Missing required fields: wallet, repoUrl, functionName(s)" });
  }

  try {
    const result = await deployRepo(wallet, repoUrl, functionName, baseDir, envVars, gitToken, projectName, monetization);
    return reply.send(result);
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: "Deployment Failed", details: err.message });
  }
});

app.post("/_internal/worker-result", receiveWorkerResult);

app.get("/_internal/requests/:requestId", async (req, reply) => {
  const { requestId } = req.params;
  console.log(`[Gateway] Internal req for ${requestId}`);

  const { data, error } = await supabase
    .from('requests')
    .select('result')
    .eq('request_id', requestId)
    .maybeSingle();

  if (error) {
    console.error(`[Gateway] Supabase error for ${requestId}:`, error);
  }

  if (error || !data) {
    console.warn(`[Gateway] Inputs not found for ${requestId}`);
    return reply.status(404).send({
      error: "Request inputs not found"
    });
  }

  console.log(`[Gateway] Sending inputs for ${requestId}`);
  return data.result;
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
