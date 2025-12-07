
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <TopBar />
        <main className="ml-64 flex-1 p-8 overflow-y-auto">
            {location.pathname !== '/deploy' && (
                <button 
                  onClick={() => navigate('/deploy')}
                  className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-6 group"
                >
                  <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                  Home
                </button>
            )}
            <Outlet />
        </main>
      </div>
    </div>
  );
}
