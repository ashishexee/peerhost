
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function main() {
    const wallet = "0xda684a91a506f3e303834c97784dee2b31bbc6bc";
    const project = "peerhostuwfgf";
    const fn = "hello";
    const newPrice = 0.1;

    console.log(`Updating price for ${wallet}/${project}/${fn} to ${newPrice}...`);

    const { data, error } = await supabase
        .from('functions')
        .update({
            price: newPrice,
            beneficiary: wallet // Ensure beneficiary is set
        })
        .eq('wallet', wallet)
        .eq('project', project)
        .eq('function_name', fn)
        .select();

    if (error) {
        console.error("Error updating price:", error);
    } else {
        console.log("Success! Updated rows:", data);
    }
}

main();
