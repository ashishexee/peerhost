
import React from 'react';
import { LayoutGrid, Box, Settings, CreditCard, Users, FolderOpen } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { label: 'Overview', icon: LayoutGrid, path: '/deploy' },
    { label: 'Projects', icon: FolderOpen, path: '/deploy/projects' },
    { label: 'Settings', icon: Settings, path: '/deploy/settings' },
  ];

  return (
    <div className="w-64 border-r border-white/10 h-screen fixed left-0 top-0 bg-black flex flex-col">
      {/* Brand */}
      <div className="h-16 flex items-center px-6 border-b border-white/10">
        <div className="w-6 h-6 bg-white rounded-full mr-3"></div>
        <span className="font-bold text-lg tracking-tight">PeerHost</span>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-6 px-3 space-y-1">
        {navItems.map((item) => {
           const isActive = location.pathname === item.path;
           return (
            <button
                key={item.label}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive 
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
        <div className="flex items-center gap-3 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500"></div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">My Workspace</p>
            </div>
        </div>
      </div>
    </div>
  );
}
