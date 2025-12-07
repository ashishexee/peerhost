
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import Architecture from './components/Architecture';
import PreFooter from './components/PreFooter';
import Footer from './components/Footer';
import { useWallet } from './context/WalletContext';

import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';
import NewDeployment from './components/NewDeployment';
import Projects from './components/Projects';
import AuthCallback from './components/AuthCallback';
import WorkerRegistration from './components/WorkerRegistration';
import LearnMore from './components/LearnMore';
import { Toaster } from 'sonner';

function App() {
  const { isConnected } = useWallet();

  return (
    <Router>
        <Toaster position="top-center" theme="dark" />
        <Routes>
            <Route path="/" element={
                 <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20">
                     <Navbar />
                     <main>
                        <Hero />
                        <Architecture />
                        <Features />
                     </main>
                 </div>
            } />

            <Route path="/workers" element={
                 <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20">
                     <Navbar />
                     <WorkerRegistration />
                 </div>
            } />

            <Route path="/learn-more" element={<LearnMore />} />

            {/* Auth Callback - Unprotected */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected Dashboard Routes */}
            <Route path="/deploy" element={
                isConnected ? <DashboardLayout /> : <Navigate to="/" replace />
            }>
                <Route index element={<DashboardHome />} />
                <Route path="projects" element={<Projects />} />
                <Route path="new" element={<NewDeployment />} />
                <Route path="*" element={<Navigate to="/deploy" replace />} />
            </Route>
        </Routes>
    </Router>
  );
}

export default App;