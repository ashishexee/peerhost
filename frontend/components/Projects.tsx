
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useWallet } from '../context/WalletContext';
import { Copy, Folder, ExternalLink, Loader2, Server } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectGroup {
    name: string;
    wallet: string;
    endpoints: string[];
    latestUpdate: string;
}

export default function Projects() {
    const { address } = useWallet();
    const [projectGroups, setProjectGroups] = useState<ProjectGroup[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (address) {
            fetchProjects();
        }
    }, [address]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('functions')
                .select('*')
                .eq('wallet', address.toLowerCase())
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by project name
            const groups: { [key: string]: ProjectGroup } = {};

            (data || []).forEach((fn: any) => {
                if (!groups[fn.project]) {
                    groups[fn.project] = {
                        name: fn.project,
                        wallet: fn.wallet,
                        endpoints: [],
                        latestUpdate: fn.created_at
                    };
                }
                groups[fn.project].endpoints.push(fn.function_name);
            });

            setProjectGroups(Object.values(groups));

        } catch (err: any) {
            console.error('Error fetching projects:', err);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const copyProjectUrl = (subdomain: string, project: string) => {
        const url = `https://peerhost-jl8u.vercel.app/run/${subdomain}/${project}`;
        navigator.clipboard.writeText(url);
        toast.success('Project URL copied to clipboard');
    };

    if (loading) {
        return (
            <div className="flex h-64 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-accents-5" />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-bold text-white">Your Projects</h2>
                <span className="text-accents-5 text-sm">{projectGroups.length} Projects Found</span>
            </div>

            {projectGroups.length === 0 ? (
                <div className="text-center py-20 border border-dashed border-white/10 rounded-xl bg-white/5">
                    <p className="text-gray-400 mb-4">No projects found.</p>
                    <a href="/deploy/new" className="bg-white text-black px-4 py-2 rounded-md font-bold text-sm hover:bg-gray-200">
                        Deploy your first function
                    </a>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projectGroups.map((group) => (
                        <div key={group.name} className="bg-gradient-to-br from-white/5 to-white/0 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-all group flex flex-col h-full">

                            <div className="flex justify-between items-start mb-4">
                                <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
                                    <Folder size={20} />
                                </div>
                                <div className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs font-bold uppercase tracking-wider">
                                    Active
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 truncate" title={group.name}>
                                {group.name}
                            </h3>

                            <div className="flex-1 mb-6">
                                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Deployed Endpoints</h4>
                                <div className="flex flex-wrap gap-2">
                                    {group.endpoints.map(ep => (
                                        <div key={ep} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/5 border border-white/5 text-xs text-gray-300">
                                            <Server size={10} className="text-accents-5" />
                                            {ep}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => copyProjectUrl(group.wallet, group.name)}
                                    className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg py-2 text-sm font-medium transition-colors text-white"
                                >
                                    <Copy size={14} />
                                    Copy Project URL
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
