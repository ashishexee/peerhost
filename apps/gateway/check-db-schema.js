import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

(async () => {
    console.log("Checking schema...");
    const { data, error } = await supabase
        .from('functions')
        .select('cid, env_vars')
        .limit(1);

    if (error) {
        console.error("Error:", error.message);
    } else {
        console.log("Success! Columns exist.");
        console.log(data);
    }
})();