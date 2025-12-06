
import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout() {
  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <Sidebar />
      <div className="flex flex-col min-h-screen">
        <TopBar />
        <main className="ml-64 flex-1 p-8 overflow-y-auto">
            <Outlet />
        </main>
      </div>
    </div>
  );
}
