
import React from 'react';
import { ChevronDown, Wallet as WalletIcon, LogOut } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

const NavItem = ({ label }: { label: string }) => (
  <button className="text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 whitespace-nowrap">
    {label}
    {['Protocol', 'Learn', 'Community', 'Tools'].includes(label) && (
      <ChevronDown className="w-3 h-3 opacity-50" />
    )}
  </button>
);

import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const { address, connect, disconnect, isConnected } = useWallet();
  const navigate = useNavigate();
  const location = useLocation();

  const handleConnect = async () => {
    await connect();
    // After connection, navigate to deploy dashboard
    navigate('/deploy');
  };

  const handleDisconnect = () => {
    disconnect();
    navigate('/');
  };

  const formatAddress = (addr: string) => 
    `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;

  return (
    <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="text-white font-bold text-xl tracking-tighter flex items-center gap-2 cursor-pointer">
             <div className="w-6 h-6 bg-white rounded-full"></div>
             PeerHost
          </a>
          <div className="hidden lg:flex items-center gap-1">
            <NavItem label="Protocol" />
            <NavItem label="Docs" />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {isConnected && location.pathname !== '/deploy' && (
              <button 
                onClick={() => navigate('/deploy')}
                className="text-sm text-gray-300 hover:text-white px-3 py-1.5 transition-colors"
              >
                Go to Console
              </button>
          )}

          {isConnected && address ? (
            <div className="flex items-center gap-2">
                 <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/20 bg-white/5 text-sm text-white">
                    <WalletIcon className="w-4 h-4" />
                    <span className="font-mono">{formatAddress(address)}</span>
                 </div>
                 <button 
                    onClick={handleDisconnect}
                    className="p-2 text-gray-400 hover:text-white"
                    title="Disconnect"
                 >
                    <LogOut className="w-4 h-4" />
                 </button>
            </div>
          ) : (
            <button 
                onClick={handleConnect}
                className="text-sm text-black bg-white font-medium px-4 py-2 rounded-md hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
                <WalletIcon className="w-4 h-4" />
                Connect Wallet
            </button>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;