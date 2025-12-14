
import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, HelpCircle, Bell, LogOut, User, Copy, Check } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { useNavigate } from 'react-router-dom';

export default function TopBar() {
  const { address, disconnect } = useWallet();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const copyAddress = () => {
    if (address) {
        navigator.clipboard.writeText(address);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDisconnect = () => {
      disconnect();
      navigate('/');
  };

  return (
    <div className="h-16 border-b border-white/10 bg-black flex items-center justify-between px-6 ml-64 sticky top-0 z-40">
        {/* Left: Breadcrumbs or Title */}
        <div className="flex items-center text-sm font-medium text-gray-400">
            <span className="text-white">Personal</span>
            <span className="mx-2">/</span>
            <span>Dashboard</span>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
            </div>
            <button 
                onClick={() => navigate('/deploy/new')}
                className="bg-white text-black px-4 py-1.5 rounded-full text-sm font-bold hover:bg-gray-200 transition-colors flex items-center gap-2"
            >
                <Plus className="w-4 h-4" />
                New
            </button>

            <div className="h-6 w-px bg-white/10 mx-2"></div>

            <div className="flex items-center gap-3">
                <button onClick={() => navigate('/learn-more')} className="text-gray-400 hover:text-white"><HelpCircle className="w-5 h-5" /></button>
                <button className="text-gray-400 hover:text-white"><Bell className="w-5 h-5" /></button>
                
                {/* Wallet Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button 
                        onClick={() => setIsOpen(!isOpen)}
                        className="flex items-center gap-2 hover:bg-white/5 p-1 rounded-full transition-colors"
                    >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white border border-white/20">
                            {address ? address.substring(2, 4).toUpperCase() : "?"}
                        </div>
                    </button>

                    {isOpen && (
                        <div className="absolute right-0 top-full mt-2 w-64 bg-[#111] border border-white/10 rounded-xl shadow-2xl p-2 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                             <div className="px-3 py-2 border-b border-white/5 mb-1">
                                <p className="text-xs text-gray-500 font-medium mb-1">SIGNED IN AS</p>
                                <div className="flex items-center justify-between group">
                                    <p className="text-sm text-white font-mono truncate mr-2">
                                        {address}
                                    </p>
                                    <button onClick={copyAddress} className="text-gray-500 hover:text-white transition-colors">
                                        {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                </div>
                             </div>
                             <button 
                                onClick={handleDisconnect}
                                className="w-full text-left flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <LogOut className="w-4 h-4" />
                                Disconnect Wallet
                             </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}
