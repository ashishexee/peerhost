import { supabase } from "../db/supabase.js";
import { ethers } from "ethers";
import dotenv from "dotenv";

dotenv.config();

const FREE_TIER_LIMIT = 20;
const CREDITS_PER_POL = 50;
const RPC_URL = process.env.RPC_URL || "https://rpc-amoy.polygon.technology";
const CONTRACT_ADDRESS = process.env.EXECUTION_CONTRACT_ADDRESS;

const ERC20_ABI = [
    "function depositedForCredits(address) view returns (uint256)"
];

const provider = new ethers.JsonRpcProvider(RPC_URL);

let contract = null;
if (CONTRACT_ADDRESS) {
    contract = new ethers.Contract(CONTRACT_ADDRESS, ERC20_ABI, provider);
}

export async function checkAndRecordUsage(wallet, project, fn) {
    if (!wallet || !project || !fn) return { allowed: true, type: 'skip' };
    const { data: funcData } = await supabase
        .from('functions')
        .select('is_paused')
        .eq('wallet', wallet)
        .eq('project', project)
        .eq('function_name', fn)
        .single();

    if (funcData?.is_paused) {
        return { allowed: false, code: 403, error: "Endpoint execution paused by owner." };
    }

    const { data: usageData } = await supabase
        .from('user_usage')
        .select('request_count')
        .eq('wallet', wallet)
        .eq('project', project)
        .eq('function_name', fn)
        .single();

    const currentUsage = usageData?.request_count || 0;

    if (currentUsage < FREE_TIER_LIMIT) {
        await supabase.from('user_usage').upsert({
            wallet,
            project,
            function_name: fn,
            request_count: currentUsage + 1,
            last_request_at: new Date()
        }, { onConflict: 'wallet, project, function_name' });

        return { allowed: true, type: 'free' };
    }

    let { data: creditData } = await supabase
        .from('user_credits')
        .select('*')
        .eq('wallet', wallet.toLowerCase())
        .single();

    let credits = creditData?.credits_remaining || 0;
    if (credits <= 1 || true) {
        credits = await syncCreditsFromBlockchain(wallet, creditData);
    }

    if (credits > 0) {
        await supabase
            .from('user_credits')
            .update({ credits_remaining: credits - 1 })
            .eq('wallet', wallet.toLowerCase());

        return { allowed: true, type: 'paid' };
    }


    return {
        allowed: false,
        code: 402,
        error: "Free tier exhausted and no global credits available. Please deposit funds."
    };
}

export async function syncCreditsFromBlockchain(wallet, dbRecord) {
    if (!contract) {
        console.warn("[Billing] Contract not initialized. Check EXECUTION_CONTRACT_ADDRESS.");
        return 0;
    }

    try {
        console.log(`[Billing Debug] Syncing for wallet: ${wallet}`);
        console.log(`[Billing Debug] Contract Address: ${contract.target}`);

        const rawDeposit = await contract.depositedForCredits(wallet); // Returns BigInt (Wei)
        console.log(`[Billing Debug] Raw Deposit from Chain: ${rawDeposit.toString()} wei`);

        const currentDbDeposit = BigInt(dbRecord?.total_deposited_wei || "0");
        console.log(`[Billing Debug] DB Stored Deposit: ${currentDbDeposit} wei`);

        if (rawDeposit > currentDbDeposit) {
            const newDepositAmt = rawDeposit - currentDbDeposit;

            const newCredits = Number((newDepositAmt * BigInt(CREDITS_PER_POL)) / BigInt(1e18));
            console.log(`[Billing Debug] New Credits Calculated: ${newCredits}`);

            if (newCredits > 0) {
                const currentCredits = dbRecord?.credits_remaining || 0;

                await supabase.from('user_credits').upsert({
                    wallet: wallet.toLowerCase(),
                    total_deposited_wei: rawDeposit.toString(),
                    credits_remaining: currentCredits + newCredits,
                    updated_at: new Date()
                });

                console.log(`[Billing Debug] Credits Updated. Total: ${currentCredits + newCredits}`);
                return currentCredits + newCredits;
            }
        }
        return dbRecord?.credits_remaining || 0;
    } catch (e) {
        console.error("Credit Sync Error:", e);
        return dbRecord?.credits_remaining || 0;
    }
}