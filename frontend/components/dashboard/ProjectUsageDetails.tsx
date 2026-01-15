import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useWallet } from '../../utils/WalletContext';
import { ArrowLeft, Loader2, PauseCircle, PlayCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { ethers } from 'ethers';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const COORDINATOR_ABI = ["function depositCredits() external payable"];
const COORDINATOR_ADDRESS = process.env.EXECUTION_CONTRACT_ADDRESS || "0x5DEbFCE5EaFc886f872fC3899ed3520133f5Bea4"; // Deployed on Amoy

export default function ProjectUsageDetails() {
    const { projectName } = useParams();
    const { address, isConnected } = useWallet();
    const navigate = useNavigate();

    const [endpoints, setEndpoints] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [depositing, setDepositing] = useState(false);
    const [graphData, setGraphData] = useState<any[]>([]);

    useEffect(() => {
        if (address && projectName) fetchDetails();
    }, [address, projectName]);

    const fetchDetails = async () => {
        setLoading(true);
        const { data: funcs } = await supabase
            .from('functions')
            .select('*')
            .eq('wallet', address.toLowerCase())
            .eq('project', projectName);

        // Get usage
        const { data: usage } = await supabase
            .from('user_usage')
            .select('*')
            .eq('wallet', address.toLowerCase())
            .eq('project', projectName);

        const merged = funcs?.map(f => {
            const u = usage?.find((us: any) => us.function_name === f.function_name);
            return {
                ...f,
                request_count: u?.request_count || 0
            };
        });
        const { data: requestLogs } = await supabase
            .from('requests')
            .select('created_at, result')
            .contains('result', { meta: { project: projectName, wallet: address } })
            .order('created_at', { ascending: true });

        const agg: { [key: string]: number } = {};
        requestLogs?.forEach((log: any) => {
            const date = new Date(log.created_at).toLocaleDateString();
            agg[date] = (agg[date] || 0) + 1;
        });

        const formattedGraph = Object.keys(agg).map(date => ({
            date,
            requests: agg[date]
        }));

        setGraphData(formattedGraph);
        setEndpoints(merged || []);
        setLoading(false);
    };

    const togglePause = async (fnName: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('functions')
            .update({ is_paused: !currentStatus })
            .eq('wallet', address.toLowerCase())
            .eq('project', projectName)
            .eq('function_name', fnName);

        if (error) toast.error("Failed to update status");
        else {
            toast.success(currentStatus ? "Endpoint Resumed" : "Endpoint Paused");
            fetchDetails();
        }
    };

    const depositCredits = async () => {
        if (!window.ethereum) return toast.error("No wallet found");
        try {
            setDepositing(true);
            const provider = new ethers.BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();
            const contract = new ethers.Contract(COORDINATOR_ADDRESS, COORDINATOR_ABI, signer);
            const tx = await contract.depositCredits({ value: ethers.parseEther("1.0") });
            toast.info("Deposit transaction sent...");
            await tx.wait();
            try {
                toast.loading("Syncing credits with Gateway...");
                await fetch(`${import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3001'}/billing/sync`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ wallet: address })
                });
                toast.success("Credits deposited and synced!");
            } catch (e) {
                console.error(e);
                toast.success("Credits deposited! Refreshing...");
            }
        } catch (err: any) {
            console.error(err);
            toast.error("Deposit failed: " + err.message);
        } finally {
            setDepositing(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-white" /></div>;

    return (
        <div className="max-w-5xl mx-auto py-10 px-6">
            <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white flex items-center gap-2 mb-6">
                <ArrowLeft size={16} /> Back to Projects
            </button>

            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-white">{projectName}</h1>
                    <p className="text-gray-400">Manage endpoints and usage limits.</p>
                </div>
                <button
                    onClick={depositCredits}
                    disabled={depositing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"
                >
                    {depositing ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus size={16} />}
                    Buy 50 Credits (1 POL)
                </button>
            </div>
            <div className="space-y-4">
                {endpoints.map(ep => {
                    const usage = ep.request_count;
                    const freeLimit = 20;
                    const pct = Math.min((usage / freeLimit) * 100, 100);
                    const isExhausted = usage >= freeLimit;

                    return (
                        <div key={ep.id} className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-xl font-bold text-white font-mono">{ep.function_name}</h3>
                                    <p className="text-xs text-gray-500 truncate mt-1">ID: {ep.id}</p>
                                </div>
                                <button
                                    onClick={() => togglePause(ep.function_name, ep.is_paused)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${ep.is_paused
                                        ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                                        : 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                                        }`}
                                >
                                    {ep.is_paused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                                    {ep.is_paused ? "Resume Endpoint" : "Active"}
                                </button>
                            </div>

                            {/* Usage Bar */}
                            <div className="mb-2 flex justify-between text-sm">
                                <span className="text-gray-400">Free Tier Usage</span>
                                <span className={isExhausted ? "text-red-400" : "text-white"}>
                                    {usage} / {freeLimit} {isExhausted && "(Over Limit - Using Credits)"}
                                </span>
                            </div>
                            <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all ${isExhausted ? 'bg-red-500' : 'bg-blue-500'}`}
                                    style={{ width: `${pct}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
