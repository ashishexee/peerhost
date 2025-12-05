import { supabase } from "./db/supabase.js";

export async function registerFunction(wallet, project, fn, cid) {
    const { error } = await supabase
        .from('functions')
        .upsert(
            {
                wallet,
                project,
                function_name: fn,
                cid
            },
            { onConflict: 'wallet,project,function_name' }
        );

    if (error) {
        console.error("Failed to register function:", error);
        throw new Error("Registry update failed");
    }
}

export async function getFunctionCID(wallet, project, fn) {
    const { data, error } = await supabase
        .from('functions')
        .select('cid')
        .eq('wallet', wallet)
        .eq('project', project)
        .eq('function_name', fn)
        .single();

    if (error) {
        if (error.code !== 'PGRST116') {
            console.error("Registry lookup error:", error);
        }
        return null;
    }

    return data?.cid || null;
}
