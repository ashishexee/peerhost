import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useWallet } from '../context/WalletContext';

interface Transaction {
    id: string;
    created_at: string;
    payer: string;
    amount: number;
    project: string;
    function_name: string;
}

export function Earnings() {
    const { address } = useWallet();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!address) return;
        fetchEarnings();
    }, [address]);

    async function fetchEarnings() {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('beneficiary', address)
                .order('created_at', { ascending: false });

            if (error) throw error;

            setTransactions(data || []);
            const sum = (data || []).reduce((acc, tx) => acc + (Number(tx.amount) || 0), 0);
            setTotal(sum);
        } catch (err) {
            console.error("Error fetching earnings:", err);
        } finally {
            setLoading(false);
        }
    }

    if (!address) return <div className="p-8 text-center text-gray-400">Please connect wallet to view earnings.</div>;

    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                Earnings Dashboard
            </h1>

            {/* Stats Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1A1B23] border border-white/10 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Total Revenue</h3>
                    <div className="text-4xl font-bold text-white flex items-center gap-2">
                        {total.toFixed(2)} <span className="text-xl text-gray-500">USDC</span>
                    </div>
                </div>
                <div className="bg-[#1A1B23] border border-white/10 rounded-xl p-6">
                    <h3 className="text-gray-400 text-sm font-medium mb-2">Total Transactions</h3>
                    <div className="text-4xl font-bold text-white">
                        {transactions.length}
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-[#1A1B23] border border-white/10 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-white/10 flex justify-between items-center">
                    <h3 className="font-semibold text-white">Recent Payments</h3>
                    <button 
                        onClick={fetchEarnings}
                        className="text-xs px-3 py-1 bg-white/5 hover:bg-white/10 rounded-full transition-colors"
                    >
                        Refresh
                    </button>
                </div>
                
                {loading ? (
                    <div className="p-8 text-center text-gray-500 animate-pulse">Loading transaction history...</div>
                ) : transactions.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        No earnings yet. Build something agents love!
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-400">
                            <thead className="bg-white/5 text-gray-200 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">Time</th>
                                    <th className="px-6 py-3">Function</th>
                                    <th className="px-6 py-3">Payer</th>
                                    <th className="px-6 py-3 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {transactions.map((tx) => (
                                    <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {new Date(tx.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-white font-medium">
                                            {tx.project} / <span className="text-purple-400">{tx.function_name}</span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-gray-500">
                                            {tx.payer.slice(0, 6)}...{tx.payer.slice(-4)}
                                        </td>
                                        <td className="px-6 py-4 text-right text-green-400 font-bold">
                                            +{Number(tx.amount).toFixed(3)} USDC
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
