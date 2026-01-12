import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from 'url';
import { startListener } from "./listener.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

console.log("Starting PeerHost Worker Node...");

startListener().catch(err => {
    console.error("Fatal worker error:", err);
    process.exit(1);
});
