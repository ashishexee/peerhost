
import React from 'react';
import { Circle, MoreHorizontal, ExternalLink } from 'lucide-react';

export default function DashboardHome() {
  // Mock data for now - in future fetch from Gateway
  const services = [
    { id: 1, name: 'hello-world-func', type: 'Function', status: 'Active', updated: '2m ago' },
    // { id: 2, name: 'payment-processor', type: 'Worker', status: 'Suspended', updated: '1d ago', region: 'peerhost-v1' },
  ];

  return (
     <div>
        <h2 className="text-2xl font-bold text-white mb-6">Overview</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
             {/* Hero Card / Upsell */}
             <div className="lg:col-span-2 bg-gradient-to-br from-purple-900/20 to-blue-900/20 border border-white/10 rounded-xl p-8 flex flex-col justify-center">
                <h3 className="text-xl font-bold text-white mb-2">Get organized with Projects</h3>
                <p className="text-gray-400 mb-6 max-w-md">An easier way to organize your decentralized resources and collaborate with team members.</p>
                <div className="flex gap-3">
                    <button className="bg-white text-black px-4 py-2 rounded-md font-bold text-sm hover:bg-gray-200">Create Project</button>
                    <button className="text-gray-400 hover:text-white text-sm font-medium">Learn more</button>
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
            <h3 className="text-lg font-bold text-white">Ungrouped Services</h3>
            <div className="flex gap-2 text-sm bg-white/5 p-1 rounded-md border border-white/10">
                <button className="px-3 py-1 rounded bg-white/10 text-white">Active (1)</button>
                <button className="px-3 py-1 rounded text-gray-400 hover:text-white">Suspended (0)</button>
            </div>
        </div>
        
        {/* Service List */}
        <div className="border border-white/10 rounded-xl overflow-hidden">
            <div className="grid grid-cols-12 gap-4 bg-white/5 px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-white/10">
                <div className="col-span-4">Service Name</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Runtime</div>
                <div className="col-span-2 text-right">Updated</div>
            </div>
            
            {services.length > 0 ? services.map(service => (
                <div key={service.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center border-b border-white/5 hover:bg-white/5 transition-colors group">
                    <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                            {service.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <div className="text-white font-bold flex items-center gap-2">
                                {service.name}
                                <ExternalLink className="w-3 h-3 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer" />
                            </div>
                            <div className="text-xs text-gray-500">https://{service.name}.peerhost.net</div>
                        </div>
                    </div>
                    <div className="col-span-2">
                        <div className="flex items-center gap-2">
                            <Circle className="w-2 h-2 fill-green-500 text-green-500" />
                            <span className="text-sm text-green-400 font-medium">{service.status}</span>
                        </div>
                    </div>
                    <div className="col-span-2 text-sm text-gray-300">{service.type}</div>
                    
                    <div className="col-span-2 text-right flex items-center justify-end gap-3">
                        <span className="text-sm text-gray-500">{service.updated}</span>
                        <button className="text-gray-500 hover:text-white"><MoreHorizontal className="w-4 h-4" /></button>
                    </div>
                </div>
            )) : (
                 <div className="p-8 text-center text-gray-500">No active services found. Deploy one now!</div>
            )}
        </div>
     </div>
  );
}
