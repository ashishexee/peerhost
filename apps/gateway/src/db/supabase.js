import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";

// Try loading from local, then fallback to root
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.warn("Missing SUPABASE_URL or SUPABASE_KEY. DB features will fail.");
}

export const supabase = createClient(SUPABASE_URL || "", SUPABASE_KEY || "");
