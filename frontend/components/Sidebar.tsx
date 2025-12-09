
import React from 'react';
import { LayoutGrid, Box, Settings, CreditCard, Users, FolderOpen, FlaskConical } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Overview', icon: LayoutGrid, path: '/deploy' },
    { label: 'Projects', icon: FolderOpen, path: '/deploy/projects' },
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
      </div>
    </div>
  );
}
