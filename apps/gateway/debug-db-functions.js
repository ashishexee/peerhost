
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

if (!process.env.SUPABASE_URL) {
    dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL) {
    console.error("❌ SUPABASE_URL not found in env");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const TARGET_WALLET = "0xda684a91a506f3e303834c97784dee2b31bbc6bc";

async function list() {
    console.log(`\n🔍 Checking Database for Wallet: ${TARGET_WALLET}\n`);

    const { data, error } = await supabase
        .from('functions')
        .select('*')
        .eq('wallet', TARGET_WALLET);

    if (error) {
        console.error("❌ DB Error:", error.message);
        return;
    }

    if (data.length === 0) {
        console.log("⚠️  No functions found for this wallet.");
        console.log("   (Are you sure the deployment succeeded?)");
    } else {
        console.table(data.map(f => ({
            Project: f.project,
            Function: f.function_name,
            Price: f.price,
            Beneficiary: f.beneficiary?.slice(0, 10) + "..."
        })));
    }
}

list();
