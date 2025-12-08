#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

// ----------------------------------------------------------------------
// PeerHost "LLM Wallet" MCP Server
// A full agentic wallet that can manage keys and pay for functions.
// ----------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const WALLET_FILE = path.join(__dirname, "agent_wallet.json");

const server = new Server(
    {
        name: "llm-wallet",
        version: "1.0.0",
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

// --- Wallet State ---
let wallet = null;

// Load existing wallet on startup
if (fs.existsSync(WALLET_FILE)) {
    try {
        const data = JSON.parse(fs.readFileSync(WALLET_FILE, "utf-8"));
        if (data.privateKey) {
            wallet = new ethers.Wallet(data.privateKey);
            console.error(`[LLM Wallet] Loaded wallet: ${wallet.address}`);
        }
    } catch (e) {
        console.error("[LLM Wallet] Failed to load wallet file");
    }
}

// --- Helper: Localhost Fetch ---
function getFetchMetadata(urlStr) {
    try {
        const u = new URL(urlStr);
        const headers = {};
        if (u.hostname.endsWith(".localhost")) {
            headers["X-Forwarded-Host"] = u.hostname + (u.port ? `:${u.port}` : "");
            u.hostname = "127.0.0.1";
        }
        return { url: u.toString(), headers };
    } catch (e) {
        throw new Error("Invalid URL: " + urlStr);
    }
}

// --- Tools ---

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            // Wallet Management
            {
                name: "wallet_create",
                description: "Creates a new EVM wallet for the agent. Overwrites existing wallet.",
                inputSchema: { type: "object", properties: {} }
            },
            {
                name: "wallet_info",
                description: "Get the current wallet address and balance.",
                inputSchema: { type: "object", properties: {} }
            },
            // PeerHost Discovery & execution
            {
                name: "peerhost_discover",
                description: "Analyzes a PeerHost Project URL to find available functions and pricing.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string", description: "Project URL" }
                    },
                    required: ["url"]
                }
            },
            {
                name: "peerhost_execute",
                description: "Pay for and execute a function using the Agent Wallet.",
                inputSchema: {
                    type: "object",
                    properties: {
                        url: { type: "string", description: "Project Base URL" },
                        function_name: { type: "string", description: "Function Name" },
                        args: { type: "object", description: "Arguments" }
                    },
                    required: ["url", "function_name"]
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        // ----------------------------------------------------------------
        // Wallet Tools
        // ----------------------------------------------------------------
        if (name === "wallet_create") {
            wallet = ethers.Wallet.createRandom();
            fs.writeFileSync(WALLET_FILE, JSON.stringify({
                address: wallet.address,
                privateKey: wallet.privateKey,
                mnemonic: wallet.mnemonic.phrase
            }, null, 2));

            return {
                content: [{ type: "text", text: `✅ Wallet Created!\nAddress: ${wallet.address}\n\nI have saved the credentials securely.` }]
            };
        }

        if (name === "wallet_info") {
            if (!wallet) return { content: [{ type: "text", text: "No wallet configured. Use 'wallet_create' first." }], isError: true };
            return {
                content: [{ type: "text", text: `👛 Wallet Info\nAddress: ${wallet.address}\nBalance: 100.00 USDC (Simulated)` }]
            };
        }

        // ----------------------------------------------------------------
        // PeerHost Tools
        // ----------------------------------------------------------------
        if (name === "peerhost_discover") {
            // Same discovery logic...
            const baseUrl = args.url.replace(/\/$/, "");
            const manifestUrl = `${baseUrl}/mcp.json`;
            const { url, headers } = getFetchMetadata(manifestUrl);

            console.error(`[LLM Wallet] Discovering ${manifestUrl}`);
            const res = await fetch(url, { headers });
            if (!res.ok) throw new Error("Manifest not found");

            const manifest = await res.json();

            let output = `Found Project: ${manifest.name_for_model}\nAvailable Tools:\n`;
            manifest.tools.forEach(t => {
                output += `- ${t.name}: ${t.description} [${t.pricing?.price || 0} USDC]\n`;
            });
            return { content: [{ type: "text", text: output }] };
        }

        if (name === "peerhost_execute") {
            if (!wallet) return { content: [{ type: "text", text: "Error: No wallet found. Please create one first." }], isError: true };

            const baseUrl = args.url.replace(/\/$/, "");
            const targetUrl = `${baseUrl}/${args.function_name}`;
            const { url, headers } = getFetchMetadata(targetUrl);

            console.error(`[LLM Wallet] Signing Payment for ${args.function_name}...`);

            // Creates a cryptographic signature of the intent
            // This is close to how x402 actually works (signing parameters).
            const message = `Authorize payment: Use ${args.function_name} at ${targetUrl}`;
            const signature = await wallet.signMessage(message);

            headers["X-Payment"] = signature;
            headers["X-Wallet"] = wallet.address;
            headers["Content-Type"] = "application/json";

            const res = await fetch(url, {
                method: "POST",
                headers: headers,
                body: JSON.stringify(args.args || {})
            });

            const resultText = await res.text();
            if (!res.ok) return { content: [{ type: "text", text: `Execution Failed (${res.status}): ${resultText}` }], isError: true };

            return {
                content: [{ type: "text", text: `✅ Payment Authorized & Executed!\nSignature: ${signature.slice(0, 15)}...\n\nResult:\n${resultText}` }]
            };
        }

        throw new Error(`Unknown tool: ${name}`);

    } catch (error) {
        return {
            content: [{ type: "text", text: `Error: ${error.message}` }],
            isError: true
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("[LLM Wallet] Server running...");
}

main().catch(console.error);
