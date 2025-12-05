import dotenv from "dotenv";
import path from "path";
import { startListener } from "./listener.js";

// Load env from root
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

console.log("Starting PeerHost Worker Node...");

startListener().catch(err => {
    console.error("Fatal worker error:", err);
    process.exit(1);
});
