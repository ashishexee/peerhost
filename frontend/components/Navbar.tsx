import React from 'react';
import { ChevronDown } from 'lucide-react';

const NavItem = ({ label }: { label: string }) => (
  <button className="text-sm text-accents-5 hover:text-white transition-colors flex items-center gap-1 px-2 py-1 whitespace-nowrap">
    {label}
    {['Protocol', 'Learn', 'Community', 'Tools'].includes(label) && (
      <ChevronDown className="w-3 h-3 opacity-50" />
    )}
  </button>
);

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="#" className="text-white font-bold text-xl tracking-tighter flex items-center gap-2">
             <div className="w-6 h-6 bg-white rounded-full"></div>
             PeerHost
          </a>
          <div className="hidden lg:flex items-center gap-1">
            <NavItem label="Protocol" />
            <NavItem label="Network" />
            <NavItem label="Security" />
            <NavItem label="Learn" />
            <NavItem label="Company" />
            <NavItem label="Open Source" />
            <NavItem label="Docs" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="hidden md:block text-sm text-accents-5 hover:text-white border border-accents-2 bg-black px-3 py-1.5 rounded-md transition-colors hover:border-white">
            Connect Wallet
          </button>
          <button className="text-sm text-black bg-white font-medium px-3.5 py-1.5 rounded-md hover:bg-gray-200 transition-colors">
            Start Building
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;