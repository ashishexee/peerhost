
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Features from './components/Features';
import PreFooter from './components/PreFooter';
import Footer from './components/Footer';
import { useWallet } from './context/WalletContext';

import DashboardLayout from './components/DashboardLayout';
import DashboardHome from './components/DashboardHome';
import NewDeployment from './components/NewDeployment';
import AuthCallback from './components/AuthCallback';
import { Toaster } from 'sonner';

function App() {
  const { isConnected } = useWallet();

  return (
    <Router>
        <Toaster position="top-center" theme="dark" />
        <Routes>
            {/* Landing Page Route */}
            <Route path="/" element={
                 <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20">
                     <Navbar />
                     <main>
                        <Hero />
                        <Features />
                        <PreFooter />
                     </main>
                     <Footer />
                 </div>
            } />

            {/* Auth Callback - Unprotected */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Protected Dashboard Routes */}
            <Route path="/deploy" element={
                isConnected ? <DashboardLayout /> : <Navigate to="/" replace />
            }>
                <Route index element={<DashboardHome />} />
                <Route path="new" element={<NewDeployment />} />
                <Route path="*" element={<Navigate to="/deploy" replace />} />
            </Route>
        </Routes>
    </Router>
  );
}

export default App;