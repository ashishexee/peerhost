import React, { useEffect, useState } from 'react';
import { supabase } from '../../utils/supabase';
import { useWallet } from '../../utils/WalletContext';
import { useNavigate } from 'react-router-dom';
import { BarChart3, ChevronRight, Loader2, Package, Search, Plus, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';

const COORDINATOR_ABI = ["function depositCredits() external payable"];
const COORDINATOR_ADDRESS = process.env.EXECUTION_CONTRACT_ADDRESS || "0x5DEbFCE5EaFc886f872fC3899ed3520133f5Bea4";

export default function ApiUsage() {
    const { address } = useWallet();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [creditAmount, setCreditAmount] = useState('50');
    const [depositing, setDepositing] = useState(false);

    useEffect(() => {
        if (address) fetchUsage();
    }, [address]);

    const fetchUsage = async () => {
        setLoading(true);
        const { data: functions } = await supabase
            .from('functions')
            .select('project, created_at')
            .eq('wallet', address.toLowerCase());
        const projectMeta: { [key: string]: string } = {};
        functions?.forEach((f: any) => {
            if (!projectMeta[f.project] || new Date(f.created_at) > new Date(projectMeta[f.project])) {
                projectMeta[f.project] = f.created_at;
            }
        });

        const projects = Object.keys(projectMeta);
        const { data: usage } = await supabase
            .from('user_usage')
            .select('*')
            .eq('wallet', address.toLowerCase());

        // Aggregate
        const aggregated = projects.map(proj => {
            const projUsage = usage?.filter((u: any) => u.project === proj) || [];
            const totalReqs = projUsage.reduce((acc: number, curr: any) => acc + curr.request_count, 0);

            // Find latest activity (max of usage.last_request_at or project.created_at)
            let lastActivity = new Date(projectMeta[proj]).getTime();
            projUsage.forEach((u: any) => {
                if (u.last_request_at) {
                    const t = new Date(u.last_request_at).getTime();
                    if (t > lastActivity) lastActivity = t;
                }
            });

            return {
                project: proj,
                requests: totalReqs,
                endpoints: projUsage.length,
                lastActivity
            };
        });

        // Initial Sort by Latest Activity
        aggregated.sort((a, b) => b.lastActivity - a.lastActivity);

        setStats(aggregated);
        setLoading(false);
    };

    const depositCredits = async () => {
        if (!window.ethereum) return toast.error("No wallet found");

        const credits = parseInt(creditAmount);
        if (isNaN(credits) || credits <= 0) return toast.error("Invalid credit amount");

        // 50 credits = 1 POL
        const costInPol = (credits / 50).toString();

        try {
            setDepositing(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(COORDINATOR_ADDRESS, COORDINATOR_ABI, signer);

            const tx = await contract.depositCredits({ value: ethers.parseEther(costInPol) });
            toast.info(`Depositing ${credits} credits for ${costInPol} POL...`);

            await tx.wait();

            try {
                toast.loading("Syncing credits with Gateway...");
                await fetch(`${import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3001'}/billing/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wallet: address })
                });
                toast.success("Credits added successfully!");
                setCreditAmount('50');
            } catch (e) {
                console.error(e);
                toast.success("Deposit confirmed! Please wait for sync.");
            }
        } catch (err: any) {
            console.error(err);
            toast.error("Deposit failed: " + err.message);
        } finally {
            setDepositing(false);
        }
    };

    const filteredStats = stats.filter(s =>
        s.project.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

    return (
        <div className="max-w-5xl mx-auto py-10 px-6">
            <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-6">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-2">API Usage</h1>
                    <p className="text-gray-400">Monitor usage across all your projects.</p>
                </div>

                <div className="flex items-end gap-3">

                    <div className="flex flex-col items-end gap-1">
                        <label className="text-[10px] text-gray-500 font-bold tracking-wider uppercase">Buy Credits</label>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-1 flex items-center h-[42px]">
                            <div className="relative h-full">
                                <input
                                    type="text"
                                    inputMode="numeric"
                                    pattern="[0-9]*"
                                    value={creditAmount}
                                    onChange={(e) => {
                                        const v = e.target.value.replace(/\D/g, '');
                                        setCreditAmount(v);
                                    }}
                                    className="bg-transparent text-white w-28 pl-3 pr-12 h-full outline-none font-mono font-bold text-sm"
                                    placeholder="Amount"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-500 font-bold pointer-events-none tracking-tight">CREDITS</span>
                            </div>
                            <div className="h-4 w-[1px] bg-white/10 mx-1"></div>
                            {/* Cost Display */}
                            <div className="px-3 text-xs font-mono text-gray-400">
                                {((parseFloat(creditAmount || '0') * 0.02).toFixed(2))} POL
                            </div>
                            <button
                                onClick={depositCredits}
                                disabled={depositing || !creditAmount}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 h-full rounded-lg font-bold text-xs flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ml-1"
                            >
                                {depositing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                                Buy
                            </button>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className="flex flex-col items-end gap-1">
                        <label className="text-[10px] text-gray-500 font-bold tracking-wider uppercase opacity-0">Search</label>
                        <div className="relative w-64 h-[42px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <input
                                type="text"
                                placeholder="Search projects..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full h-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 text-sm text-white focus:outline-none focus:border-white/20 transition-colors"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {filteredStats.length === 0 ? (
                    <div className="p-8 border border-white/10 rounded-xl text-center text-gray-500">
                        {searchTerm ? 'No projects match your search.' : 'No active projects found.'}
                    </div>
                ) : (
                    filteredStats.map(stat => (
                        <div
                            key={stat.project}
                            onClick={() => navigate(`/deploy/api-usage/${stat.project}`)}
                            className="bg-white/5 border border-white/10 p-6 rounded-xl flex items-center justify-between hover:bg-white/10 transition-all cursor-pointer group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                                    <Package size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">{stat.project}</h3>
                                    <div className="flex items-center gap-3 text-sm text-gray-400">
                                        <span>{stat.requests} Requests</span>
                                        <span className="w-1 h-1 bg-gray-600 rounded-full"></span>
                                        <span>{new Date(stat.lastActivity).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-600 group-hover:text-white transition-colors" />
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
