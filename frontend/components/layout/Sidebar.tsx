
import React from 'react';
import { LayoutGrid, Box, Settings, CreditCard, Users, FolderOpen, FlaskConical, BarChart3 } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../utils/supabase';
import { useWallet } from '../../utils/WalletContext';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { address } = useWallet();
  const [credits, setCredits] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (!address) return;
    const fetchCredits = async () => {
      try {
        await fetch(`${import.meta.env.VITE_GATEWAY_URL || 'http://localhost:3001'}/billing/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wallet: address })
        });
      } catch (e) {
        console.error("Failed to sync credits:", e);
      }
      const { data } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('wallet', address.toLowerCase())
        .single();
      setCredits(data?.credits_remaining || 0);
    };
    fetchCredits();
    const interval = setInterval(fetchCredits, 10000);
    return () => clearInterval(interval);
  }, [address]);

  const navItems = [
    { label: 'Overview', icon: LayoutGrid, path: '/deploy' },
    { label: 'Projects', icon: FolderOpen, path: '/deploy/projects' },
    { label: 'API Usage', icon: BarChart3, path: '/deploy/api-usage' },
    { label: 'Use API', icon: FlaskConical, path: '/deploy/test-api' },
    { label: 'Earnings', icon: CreditCard, path: '/deploy/earnings' },
  ];

  return (
    <div className="w-64 border-r border-white/10 h-screen fixed left-0 top-0 bg-black flex flex-col">
      {/* Brand */}
      <div
        onClick={() => navigate('/')}
        className="h-16 flex items-center px-6 border-b border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
      >
        <span className="font-lustra font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500">PeerHost</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive
                ? 'bg-white/10 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Footer / User */}
      <div className="p-4 border-t border-white/10">
        <div className="bg-white/5 rounded-lg p-3">
          <div className="text-xs text-gray-400 uppercase font-bold mb-1">Global Credits</div>
          <div className="text-xl font-mono text-white">
            {credits !== null ? credits.toLocaleString() : '...'}
          </div>
          <button
            onClick={() => navigate('/deploy/api-usage')}
            className="mt-2 w-full text-xs bg-white text-black font-bold py-1 rounded hover:bg-gray-200"
          >
            Add Credits
          </button>
        </div>
      </div>
    </div>
  );
}
