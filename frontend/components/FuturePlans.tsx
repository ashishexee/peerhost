import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Smartphone, Coins, Clock, Globe, BarChart3, Zap, Lock, ChevronRight, Server } from 'lucide-react';
import Navbar from './Navbar';

const PlanSection = ({ icon: Icon, title, children, delay }: { icon: any, title: string, children: React.ReactNode, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay }}
        className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-colors"
    >
        <div className="flex items-center gap-4 mb-6">
            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold text-white">{title}</h3>
        </div>
        <div className="space-y-4 text-gray-400 leading-relaxed">
            {children}
        </div>
    </motion.div>
);

const FuturePlans = () => {
    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20">
            <Navbar />

            <div className="max-w-7xl mx-auto px-6 pt-32">
                {/* Header */}
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-400 text-xs font-mono mb-6"
                    >
                        <Zap className="w-3 h-3" />
                        PROTOCOL ROADMAP
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-white via-white/80 to-white/40"
                    >
                        Future Plans
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl text-gray-400 max-w-2xl mx-auto"
                    >
                        PeerHost is evolving. We are transitioning from a subsidized beta to a fully decentralized, self-sustaining economy. Here is the technical roadmap.
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">

                    {/* 1. Secure Worker Wallet Model */}
                    <PlanSection icon={Lock} title="Secure Worker Wallet Model" delay={0.1}>
                        <p>
                            Currently, workers manage their own keys. We are introducing a <strong>Delegated Worker Wallet</strong> model.
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                            <li><strong>Disposable Wallets:</strong> Users generate a burner wallet specifically for their worker node.</li>
                            <li><strong>Delegation Registry:</strong> The main user wallet "approves" the worker wallet on-chain.</li>
                            <li><strong>Auto-Sweep:</strong> Rewards earned by the worker are automatically routed to the main user wallet.</li>
                            <li><strong>Security:</strong> If a worker node is compromised, only the burner key is lost; the main funds remain safe.</li>
                        </ul>
                    </PlanSection>

                    {/* 2. Worker Gas & Ownership */}
                    <PlanSection icon={Coins} title="Gas & Wallet Ownership" delay={0.2}>
                        <p>
                            Transitioning gas responsibility to the network participants to ensure economic alignment.
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                            <li><strong>Worker Pays Gas:</strong> Workers must fund their own operational transactions (submitting proofs).</li>
                            <li><strong>Protocol Discovery:</strong> The <code>ExecutionCoordinator</code> will automatically index newly registered workers.</li>
                            <li><strong>Sybil Resistance:</strong> A small stake is required to register a worker, preventing spam nodes.</li>
                        </ul>
                    </PlanSection>

                    {/* 3. Android Worker Nodes */}
                    <PlanSection icon={Smartphone} title="Android Worker Nodes" delay={0.3}>
                        <p>
                            Expanding the compute grid to mobile edge devices.
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                            <li><strong>Native App:</strong> A dedicated Android application (APK) that runs the worker logic in the background.</li>
                            <li><strong>Battery Optimized:</strong> Intelligent scheduling for when to execute.</li>
                            <li><strong>Termux Support:</strong> Continued support for power users running via Termux for full control.</li>
                        </ul>
                    </PlanSection>

                    {/* 4. Distributed Rewards */}
                    <PlanSection icon={BarChart3} title="Distributed Reward Proofs" delay={0.4}>
                        <p>
                            Moving from "Winner Takes All" to a more equitable distribution model.
                        </p>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10 my-4 text-sm font-mono">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-red-400">Current:</span>
                                <span>Fastest worker gets 100%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-green-400">Future:</span>
                                <span>Pro-rata distribution for correct proofs</span>
                            </div>
                        </div>
                        <p>
                            This encourages geographic diversity and redundancy rather than just raw speed proximity to the RPC.
                        </p>
                    </PlanSection>

                    {/* 5. Platform Economics */}
                    <PlanSection icon={Server} title="Platform Status & Treasury" delay={0.5}>
                        <p>
                            Evolution of the protocol's economic engine.
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                            <li><strong>Current (Beta):</strong> Platform is free ("Wala Point"). Execution is subsidized by the PeerHost treasury.</li>
                            <li><strong>Future:</strong> Users deposit funds into the <code>Treasury</code> contract. Workers are paid directly from this pool per millisecond of compute.</li>
                            <li><strong>Zero Middlemen:</strong> The protocol takes a minimal fee (burn/DAO), the rest goes to workers.</li>
                        </ul>
                    </PlanSection>

                    {/* 6. Worker Scheduling */}
                    <PlanSection icon={Clock} title="Time-Slot Scheduling" delay={0.6}>
                        <p>
                            Granular control for worker operators.
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                            <li><strong>Availability Windows:</strong> Workers can define specific hours they are active (e.g., "Only run at night").</li>
                            <li><strong>Predictable Uptime:</strong> The coordinator contract matches jobs to workers guaranteed to be online.</li>
                        </ul>
                    </PlanSection>

                    {/* 7. API Exposure & Marketplace */}
                    <PlanSection icon={Globe} title="API Marketplace" delay={0.7}>
                        <p>
                            Turning every deployment into a monetizable product.
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                            <li><strong>Public/Private Toggle:</strong> Users choose if their API is discoverable.</li>
                            <li><strong>Monetized Endpoints:</strong> Set a price (in USDC/MATIC) per API call.</li>
                            <li><strong>Agent Discovery:</strong> Auto-indexing by AI agents looking for paid tools (MCP compatible).</li>
                        </ul>
                    </PlanSection>

                    {/* 8. Optimization Constraints */}
                    <PlanSection icon={Shield} title="Optimization Strategy" delay={0.8}>
                        <p>
                            "Faster response, but not at the cost of decentralization."
                        </p>
                        <ul className="list-disc list-inside space-y-2 mt-4 ml-2">
                            <li><strong>Verifiable Caching:</strong> Workers cache hot function bundles securely via verified IPFS hashes.</li>
                            <li><strong>Edge Routing:</strong> Intelligent routing to the geographically closest worker without central coordination.</li>
                            <li><strong>Sandboxed Runtime:</strong> Maintaining strict VM2/Docker isolation despite performance improvements.</li>
                        </ul>
                    </PlanSection>

                </div>

                {/* Footer CTA */}
                <div className="mt-32 text-center pb-20">
                    <h2 className="text-3xl font-bold mb-6">Ready to join the future?</h2>
                    <div className="flex flex-wrap items-center justify-center gap-4">
                        <a href="/docs" className="group px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2">
                            Read the Docs <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </a>
                        <a href="https://github.com/ashishexee/peerhost" target="_blank" rel="noreferrer" className="px-6 py-3 bg-white/10 border border-white/20 text-white font-bold rounded-lg hover:bg-white/20 transition-colors">
                            Contribute on GitHub
                        </a>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FuturePlans;
