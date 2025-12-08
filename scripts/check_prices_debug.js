
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function main() {
    console.log("Checking Project Metadata...");

    // 1. Check the project from the LOGS
    const logsProject = 'peerhostuwfgf';
    const { data: logsData } = await supabase.from('functions').select('project, price').eq('project', logsProject).maybeSingle();
    console.log(`[Logs Project] ${logsProject}: Price = ${logsData?.price}`);

    // 2. Check the project from the SCREENSHOT
    const screenProject = 'peerheforwfWEJFHVE'; // Typo in screenshot? extracting carefully
    // Screenshot: peerheforwfWEJFHVE
    const { data: screenData } = await supabase.from('functions').select('project, price').eq('project', screenProject).maybeSingle();
    console.log(`[Screenshot Project] ${screenProject}: Price = ${screenData?.price}`);
}

main();
