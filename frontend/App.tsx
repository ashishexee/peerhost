import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Hero from './components/landing/Hero';
import Features from './components/landing/Features';
import Architecture from './components/landing/Architecture';
import { useWallet } from './utils/WalletContext';
import DashboardLayout from './components/layout/DashboardLayout';
import DashboardHome from './components/dashboard/DashboardHome';
import NewDeployment from './components/dashboard/NewDeployment';
import Projects from './components/dashboard/Projects';
import AuthCallback from './components/auth/AuthCallback';
import WorkerWallet from './components/workers/WorkerWallet';
import WorkerRegistration from './components/workers/WorkerRegistration';
import ApiUsage from './components/dashboard/ApiUsage';
import ProjectUsageDetails from './components/dashboard/ProjectUsageDetails';
import LearnMore from './components/pages/LearnMore';
import {Docs} from './components/pages/Docs';
import ExecutionFlow from './components/landing/ExecutionFlow';
import { Earnings } from './components/dashboard/Earnings';
import ApiTester from './components/dashboard/ApiTester';
import FuturePlans from './components/landing/FuturePlans';
import { Toaster } from 'sonner';

function App() {
    const { isConnected } = useWallet();

    return (
        <Router>
            <Toaster position="top-center" theme="dark" />
            <Routes>
                <Route path="/future-plans" element={<FuturePlans />} />
                <Route path="/" element={
                    <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20">
                        <Navbar />
                        <main>
                            <Hero />
                            <Architecture />
                            <ExecutionFlow />
                            <Features />
                        </main>
                    </div>
                } />

                <Route path="/workers" element={
                    <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20">
                        <Navbar />
                        <WorkerWallet />
                    </div>
                } />

                <Route path="/workers/setup" element={
                    <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20">
                        <Navbar />
                        <WorkerRegistration />
                    </div>
                } />

                <Route path="/learn-more" element={<LearnMore />} />

                <Route path="/docs" element={<Docs />} />

                {/* Auth Callback - Unprotected */}
                <Route path="/auth/callback" element={<AuthCallback />} />
                {/* Protected Dashboard Routes */}
                <Route path="/deploy" element={
                    isConnected ? <DashboardLayout /> : <Navigate to="/" replace />
                }>
                    <Route index element={<DashboardHome />} />
                    <Route path="projects" element={<Projects />} />
                    <Route path="api-usage" element={<ApiUsage />} />
                    <Route path="api-usage/:projectName" element={<ProjectUsageDetails />} />
                    <Route path="earnings" element={<Earnings />} />
                    <Route path="test-api" element={<ApiTester />} />
                    <Route path="new" element={<NewDeployment />} />
                    <Route path="*" element={<Navigate to="/deploy" replace />} />
                </Route>
            </Routes>
        </Router>
    );
}

export default App;