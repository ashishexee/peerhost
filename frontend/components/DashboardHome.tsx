
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Circle, MoreHorizontal, ExternalLink, Loader2, Copy, Server } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabase';
import { useWallet } from '../context/WalletContext';

interface ProjectGroup {
    name: string;
    wallet: string;
    endpoints: string[];
    latestUpdate: string;
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const { address } = useWallet();
  const [recentProjects, setRecentProjects] = useState<ProjectGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (address) {
        fetchServices();
    }
  }, [address]);

  const fetchServices = async () => {
    try {
        setLoading(true);
        // Fetch more items to ensure we get unique projects
        const { data, error } = await supabase
            .from('functions')
            .select('*')
            .eq('wallet', address.toLowerCase())
            .order('created_at', { ascending: false })
            .limit(20);

        if (error) throw error;

        // Group by project name
        const groups: { [key: string]: ProjectGroup } = {};
        const groupOrder: string[] = []; // To maintain recency order

        (data || []).forEach((fn: any) => {
            if (!groups[fn.project]) {
                groups[fn.project] = {
                    name: fn.project,
                    wallet: fn.wallet,
                    endpoints: [],
                    latestUpdate: fn.created_at
                };
                groupOrder.push(fn.project);
            }
            groups[fn.project].endpoints.push(fn.function_name);
        });

        // Map order to groups and slice top 5
        const topProjects = groupOrder.slice(0, 5).map(name => groups[name]);
        setRecentProjects(topProjects);

    } catch (err) {
        console.error('Error fetching dashboard services:', err);
    } finally {
        setLoading(false);
    }
  };

  const copyProjectUrl = (subdomain: string, project: string) => {
    const url = `https://peerhost-jl8u.vercel.app/run/${subdomain}/${project}`;
    navigator.clipboard.writeText(url);
    toast.success('Project URL copied to clipboard');
  };

  return (
     <div>
        <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
             {/* Hero Card / Upsell */}
             <div className="lg:col-span-2 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 rounded-xl p-8 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-white mb-2">Get organized with Projects</h3>
                <p className="text-gray-400 mb-6 max-w-md">An easier way to organize your decentralized resources and collaborate with team members.</p>
                <div className="flex gap-3">
                    <button onClick={() => navigate('/deploy/new')} className="bg-white text-black px-4 py-2 rounded-md font-bold text-sm hover:bg-gray-200">Create Project</button>
                    <button onClick={() => navigate('/learn-more')} className="text-gray-400 hover:text-white text-sm font-medium">Learn about serverless functions</button>
                </div>
             </div>
             
             {/* Stats / Health */}
             <div className="bg-black border border-white/10 rounded-xl p-6">
                <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">System Health</h3>
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-white font-medium">All systems operational</span>
                </div>
                <div className="text-xs text-gray-500">PeerHost Network v1.0</div>
             </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Recent Projects</h3>
            <div className="flex gap-2 text-sm bg-white/5 p-1 rounded-md border border-white/10">
                <button className="px-3 py-1 rounded bg-white/10 text-white">Active ({recentProjects.length})</button>
            </div>
        </div>
        
        {/* Service List */}
        <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 bg-white/5 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10">
                <div className="col-span-4">Project Name</div>
                <div className="col-span-4">Endpoints</div>
                <div className="col-span-2">Last Updated</div>
                <div className="col-span-2 text-right">Actions</div>
            </div>
            
            {loading ? (
                 <div className="p-8 flex justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-accents-5" />
                 </div>
            ) : recentProjects.length > 0 ? recentProjects.map(proj => (
                <div key={proj.name} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                            {proj.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-white font-bold flex items-center gap-2">
                                {proj.name}
                                <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                            </div>
                        </div>
                    </div>
                    
                    <div className="col-span-4">
                        <div className="flex flex-wrap gap-2">
                            {proj.endpoints.slice(0, 3).map(ep => (
                                <div key={ep} className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-[10px] text-gray-300">
                                    <Server size={8} className="text-accents-5" />
                                    {ep}
                                </div>
                            ))}
                            {proj.endpoints.length > 3 && (
                                <span className="text-xs text-gray-500 self-center">+{proj.endpoints.length - 3} more</span>
                            )}
                        </div>
                    </div>
                    
                    <div className="col-span-2">
                         <span className="text-sm text-gray-500">{new Date(proj.latestUpdate).toLocaleDateString()}</span>
                    </div>
                    
                    <div className="col-span-2 text-right flex items-center justify-end gap-3">
                        <button 
                            onClick={() => copyProjectUrl(proj.wallet, proj.name)}
                            className="text-gray-500 hover:text-white transition-colors flex items-center gap-2"
                            title="Copy Project URL"
                        >
                            <span className="text-xs font-medium">Copy URL</span>
                            <Copy className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )) : (
                 <div className="p-8 text-center text-gray-500">No active projects found. Deploy one now!</div>
            )}
        </div>
     </div>
  );
}
