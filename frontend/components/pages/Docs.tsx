import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Book, Server, Cpu,
    Shield, Terminal, Zap,
    Menu, X, ExternalLink, CreditCard, Bot,
    Activity, Lock, Smartphone, Database,
    Network, Coins, AlertTriangle,  
    CheckCircle, XCircle, ArrowRight, 
} from 'lucide-react';
import Navbar from '../layout/Navbar';

export const Docs = () => {
    const [activeSection, setActiveSection] = useState('welcome');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const sections = [
        {
            title: 'INTRODUCTION',
            items: [
                { id: 'welcome', label: 'Welcome', icon: Book },
                { id: 'architecture', label: 'Architecture', icon: Network },
            ]
        },
        {
            title: 'CORE PROTOCOL',
            items: [
                { id: 'consensus', label: 'Consensus & Voting', icon: Shield },
                { id: 'execution', label: 'Execution Pipeline', icon: Activity },
                { id: 'slashing', label: 'Slashing & Security', icon: AlertTriangle },
            ]
        },
        {
            title: 'ECOSYSTEM',
            items: [
                { id: 'mobile', label: 'Mobile App', icon: Smartphone },
                { id: 'mcp', label: 'AI Agents (MCP)', icon: Bot },
            ]
        },
        {
            title: 'ECONOMICS',
            items: [
                { id: 'x402', label: 'x402 Payments', icon: CreditCard },
                { id: 'rewards', label: 'Worker Rewards', icon: Coins },
                { id: 'billing', label: 'Billing & Credits', icon: Database },
            ]
        }
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'welcome':
                return (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="border-b border-white/10 pb-8">
                            <h1 className="text-5xl font-bold text-white mb-6 tracking-tight">PeerHost Technical Documentation</h1>
                            <p className="text-xl text-gray-300 leading-relaxed max-w-3xl">
                                A <span className="text-purple-400 font-semibold">Decentralized & Monetizable</span> serverless execution network.
                                Run code on a permissionless global grid of workers (including mobile phones) and monetize purely via crypto.
                            </p>
                        </div>
                        <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-2xl p-8">
                            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
                                <Zap className="text-yellow-400" />
                                Quick Start (3 Minutes)
                            </h2>
                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center shrink-0 text-lg font-bold">1</div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Connect Your Wallet</h4>
                                        <p className="text-gray-400 text-sm mt-1">Visit <code className="bg-white/10 px-2 py-0.5 rounded">app.peerhost.io</code> and connect MetaMask (Polygon Amoy network)</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center shrink-0 text-lg font-bold">2</div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Deploy from GitHub</h4>
                                        <p className="text-gray-400 text-sm mt-1">Paste your repo URL, select functions to deploy. We handle bundling, IPFS pinning, and contract registration.</p>
                                        <div className="mt-2 bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-green-400">
                                            https://github.com/yourname/functions<br />
                                            → Deploy: hello.js, weather-api.js
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center shrink-0 text-lg font-bold">3</div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">Call Your Function</h4>
                                        <p className="text-gray-400 text-sm mt-1">Your function is now live at <code className="bg-white/10 px-2 py-0.5 rounded">gateway.peerhost.io/run/:wallet/:project/:function</code></p>
                                        <div className="mt-2 bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-blue-400">
                                            curl -X POST https://gateway.peerhost.io/run/0xYOU/my-project/hello \<br />
                                            &nbsp;&nbsp;-H "Content-Type: application/json" \<br />
                                            &nbsp;&nbsp;-d '{'{"name":"World"}'}'
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">PeerHost vs Traditional Platforms</h2>
                            <div className="overflow-x-auto">
                                <table className="w-full border border-white/10 rounded-lg overflow-hidden">
                                    <thead className="bg-white/5">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-sm font-bold text-white">Feature</th>
                                            <th className="px-6 py-3 text-center text-sm font-bold text-purple-400">PeerHost</th>
                                            <th className="px-6 py-3 text-center text-sm font-bold text-gray-400">AWS Lambda</th>
                                            <th className="px-6 py-3 text-center text-sm font-bold text-gray-400">Vercel</th>
                                            <th className="px-6 py-3 text-center text-sm font-bold text-gray-400">Cloudflare</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        <tr>
                                            <td className="px-6 py-4 text-sm text-gray-300">Decentralized</td>
                                            <td className="px-6 py-4 text-center"><CheckCircle className="inline text-green-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-sm text-gray-300">Built-in Monetization</td>
                                            <td className="px-6 py-4 text-center"><CheckCircle className="inline text-green-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-sm text-gray-300">Mobile Workers</td>
                                            <td className="px-6 py-4 text-center"><CheckCircle className="inline text-green-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                        </tr>
                                        <tr>
                                            <td className="px-6 py-4 text-sm text-gray-300">Censorship Resistant</td>
                                            <td className="px-6 py-4 text-center"><CheckCircle className="inline text-green-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                            <td className="px-6 py-4 text-center"><XCircle className="inline text-red-400" size={20} /></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/20 hover:border-purple-500/40 transition-all group">
                                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2 group-hover:text-purple-400 transition-colors">
                                    <Zap className="w-5 h-5" /> For Builders
                                </h3>
                                <p className="text-gray-400 mb-4">Deploy serverless functions directly from GitHub. No servers to manage. Built-in crypto monetization.</p>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> NodeJS v18 Runtime</li>
                                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> HTTP & Agentic Interfaces</li>
                                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Zero DevOps</li>
                                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Universal Bundling (Browser + Node APIs)</li>
                                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Instant Deployment from GitHub</li>
                                </ul>
                            </div>

                            <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/20 to-black border border-blue-500/20 hover:border-blue-500/40 transition-all group">
                                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2 group-hover:text-blue-400 transition-colors">
                                    <Cpu className="w-5 h-5" /> For Workers
                                </h3>
                                <p className="text-gray-400 mb-4">Turn your idle Laptop, Server, or <span className="text-white font-semibold">Android Phone</span> into a revenue-generating node.</p>
                                <ul className="space-y-2 text-sm text-gray-400">
                                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Earn 0.05 POL per execution</li>
                                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Run on native mobile app (Flutter/QuickJS)</li>
                                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Non-custodial instant payouts</li>
                                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> 24/7 background execution</li>
                                    <li className="flex items-center gap-2"><Check className="w-3 h-3 text-green-400" /> Stake-based trust system</li>
                                </ul>
                            </div>
                        </div>
                        <div className="bg-gradient-to-br from-green-900/10 to-black border border-green-500/20 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Network className="text-green-400" />
                                Network Overview
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-purple-400">Node v18</div>
                                    <div className="text-sm text-gray-500 mt-1">Runtime</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-400">5000ms</div>
                                    <div className="text-sm text-gray-500 mt-1">Max Timeout</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-yellow-400">30s</div>
                                    <div className="text-sm text-gray-500 mt-1">Consensus Window</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-400">66%</div>
                                    <div className="text-sm text-gray-500 mt-1">Majority Threshold</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'architecture':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-4xl font-bold text-white">System Architecture</h1>
                        <p className="text-lg text-gray-300">PeerHost is a hybrid orchestration layer connecting Web2 HTTP clients with Web3 execution markets.</p>
                        <div className="bg-black/40 border border-white/10 rounded-xl p-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Network className="w-48 h-48" />
                            </div>

                            <div className="relative z-10 space-y-8">
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center shrink-0 font-bold">1</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">The Gateway (Web2 Bridge)</h3>
                                        <p className="text-gray-400 mt-1">Fastify HTTP server handling ingress, authentication, billing, and IPFS pinning. Acts as the Oracle triggering blockchain events.</p>
                                        <div className="mt-3 bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-blue-300">
                                            // apps/gateway/src/server.js<br />
                                            // Fastify: HTTP server (v4.x)<br />
                                            // Supabase: PostgreSQL database<br />
                                            // Ethers.js: RPC provider<br />
                                            // IPFS: Pinata gateway
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center shrink-0 font-bold">2</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Execution Coordinator (Smart Contract)</h3>
                                        <p className="text-gray-400 mt-1">
                                            The source of truth. Located at <code className="text-xs bg-white/10 px-1 py-0.5 rounded">0x087a...fb8</code> on Polygon Amoy.
                                            Manages Worker Registry, Stakes, Request Events, and Consensus Finalization.
                                        </p>
                                        <div className="mt-3 bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-purple-300">
                                            // packages/contracts/src/ExecutionCoordinator.sol<br />
                                            // Solidity 0.8.20<br />
                                            // OpenZeppelin: ECDSA signature verification<br />
                                            // 319 lines | Deployed via Foundry
                                        </div>
                                    </div>
                                </div>
                                <div className="flex gap-4 items-start">
                                    <div className="w-8 h-8 rounded-full bg-pink-500 flex items-center justify-center shrink-0 font-bold">3</div>
                                    <div>
                                        <h3 className="text-xl font-bold text-white">Worker Grid (P2P Network)</h3>
                                        <p className="text-gray-400 mt-1">
                                            Independent nodes (Node.js + QuickJS) listening to blockchain via WebSocket.
                                            They race to fetch code from IPFS, execute in sandbox, and submit signed results.
                                        </p>
                                        <div className="mt-3 bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-pink-300">
                                            // apps/worker/src/listener.js (Node.js)<br />
                                            // peerhost_app/lib/services/background_services.dart (Mobile)<br />
                                            // VM Sandbox: vm.runInContext + QuickJS FFI<br />
                                            // IPFS Cache: gateway.pinata.cloud
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Technology Stack</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h4 className="text-lg font-bold text-blue-400 mb-4 flex items-center gap-2">
                                        <Server size={20} /> Gateway Stack
                                    </h4>
                                    <ul className="space-y-2 text-sm text-gray-400">
                                        <li><strong className="text-white">Runtime:</strong> Node.js v18+</li>
                                        <li><strong className="text-white">HTTP Server:</strong> Fastify (v4.x)</li>
                                        <li><strong className="text-white">Database:</strong> Supabase (PostgreSQL)</li>
                                        <li><strong className="text-white">Blockchain:</strong> Ethers.js v6</li>
                                        <li><strong className="text-white">Bundler:</strong> esbuild + polyfill-node plugin</li>
                                        <li><strong className="text-white">Storage:</strong> IPFS (Pinata)</li>
                                    </ul>
                                </div>
                                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h4 className="text-lg font-bold text-purple-400 mb-4 flex items-center gap-2">
                                        <Lock size={20} /> Contract Stack
                                    </h4>
                                    <ul className="space-y-2 text-sm text-gray-400">
                                        <li><strong className="text-white">Language:</strong> Solidity 0.8.20</li>
                                        <li><strong className="text-white">Framework:</strong> Foundry</li>
                                        <li><strong className="text-white">Libraries:</strong> OpenZeppelin Contracts</li>
                                        <li><strong className="text-white">Network:</strong> Polygon Amoy (Testnet)</li>
                                        <li><strong className="text-white">Gas Optimization:</strong> Custom assembly</li>
                                        <li><strong className="text-white">LOC:</strong> 319 lines</li>
                                    </ul>
                                </div>

                                {/* Worker (Node) */}
                                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h4 className="text-lg font-bold text-green-400 mb-4 flex items-center gap-2">
                                        <Terminal size={20} /> Worker Stack (Node.js)
                                    </h4>
                                    <ul className="space-y-2 text-sm text-gray-400">
                                        <li><strong className="text-white">Runtime:</strong> Node.js v18+</li>
                                        <li><strong className="text-white">Blockchain:</strong> Ethers.js (WebSocket)</li>
                                        <li><strong className="text-white">Sandbox:</strong> vm.runInContext()</li>
                                        <li><strong className="text-white">Crypto:</strong> Native Node.js crypto polyfills</li>
                                        <li><strong className="text-white">HTTP Client:</strong> fetch API</li>
                                        <li><strong className="text-white">File:</strong> apps/worker/src/listener.js (77 lines)</li>
                                    </ul>
                                </div>

                                {/* Mobile Worker */}
                                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h4 className="text-lg font-bold text-yellow-400 mb-4 flex items-center gap-2">
                                        <Smartphone size={20} /> Mobile Worker Stack
                                    </h4>
                                    <ul className="space-y-2 text-sm text-gray-400">
                                        <li><strong className="text-white">Framework:</strong> Flutter 3.x (Dart)</li>
                                        <li><strong className="text-white">Blockchain:</strong> web3dart package</li>
                                        <li><strong className="text-white">JS Engine:</strong> QuickJS (via FFI)</li>
                                        <li><strong className="text-white">Background:</strong> Dart Isolates</li>
                                        <li><strong className="text-white">Wallet:</strong> WalletConnect v2</li>
                                        <li><strong className="text-white">File:</strong> peerhost_app/lib/services/ (500+ lines)</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Data Flow */}
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Request Data Flow</h2>
                            <div className="bg-gradient-to-br from-blue-900/10 to-purple-900/10 border border-blue-500/20 rounded-xl p-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 text-sm font-mono text-blue-400">User</div>
                                        <ArrowRight className="text-gray-600" size={20} />
                                        <div className="flex-1 bg-black/30 p-3 rounded border border-white/5 text-xs">
                                            <strong>POST</strong> gateway.peerhost.io/run/:wallet/:project/:function
                                            <br />
                                            Body: {"{\"input\":\"data\"}"}
                                        </div>

                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 text-sm font-mono text-purple-400">Gateway</div>
                                        <ArrowRight className="text-gray-600" size={20} />
                                        <div className="flex-1 bg-black/30 p-3 rounded border border-white/5 text-xs">
                                            1. Hash inputs (SHA256)<br />
                                            2. Store in Supabase (requests table)<br />
                                            3. Call contract.triggerRequest(wallet, project, fn, cid, inputHash)
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 text-sm font-mono text-pink-400">Contract</div>
                                        <ArrowRight className="text-gray-600" size={20} />
                                        <div className="flex-1 bg-black/30 p-3 rounded border border-white/5 text-xs">
                                            emit ExecutionRequested(wallet, project, fn, cid, requestId)
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 text-sm font-mono text-green-400">Workers</div>
                                        <ArrowRight className="text-gray-600" size={20} />
                                        <div className="flex-1 bg-black/30 p-3 rounded border border-white/5 text-xs">
                                            1. Fetch code from IPFS (CID)<br />
                                            2. Fetch inputs from Gateway API<br />
                                            3. Execute in VM sandbox<br />
                                            4. Sign result with private key<br />
                                            5. Submit to Gateway (/submit-signature)
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="w-24 text-sm font-mono text-yellow-400">Consensus</div>
                                        <ArrowRight className="text-gray-600" size={20} />
                                        <div className="flex-1 bg-black/30 p-3 rounded border border-white/5 text-xs">
                                            Wait 30s → Aggregate signatures → Verify 66% majority → Finalize on-chain
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* File Structure Reference */}
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Key Files Reference</h2>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                <div className="bg-black/40 p-4 rounded border border-white/5 font-mono text-xs">
                                    <div className="text-blue-400 mb-2">📁 apps/gateway/src/</div>
                                    <div className="ml-4 text-gray-400 space-y-1">
                                        <div>├─ server.js (278 lines)</div>
                                        <div>├─ routes/router.js (213 lines)</div>
                                        <div>├─ controllers/trigger.js (79 lines)</div>
                                        <div>├─ services/consensus-manager.js (190 lines)</div>
                                        <div>├─ services/billing-service.js (129 lines)</div>
                                        <div>└─ services/github-deployer.js (209 lines)</div>
                                    </div>
                                </div>
                                <div className="bg-black/40 p-4 rounded border border-white/5 font-mono text-xs">
                                    <div className="text-green-400 mb-2">📁 apps/worker/src/</div>
                                    <div className="ml-4 text-gray-400 space-y-1">
                                        <div>├─ listener.js (77 lines)</div>
                                        <div>├─ executor.js (62 lines)</div>
                                        <div>├─ result-sender.js</div>
                                        <div>└─ ipfs-cache.js</div>
                                    </div>
                                </div>
                                <div className="bg-black/40 p-4 rounded border border-white/5 font-mono text-xs">
                                    <div className="text-purple-400 mb-2">📁 packages/contracts/src/</div>
                                    <div className="ml-4 text-gray-400 space-y-1">
                                        <div>└─ ExecutionCoordinator.sol (319 lines)</div>
                                    </div>
                                </div>
                                <div className="bg-black/40 p-4 rounded border border-white/5 font-mono text-xs">
                                    <div className="text-yellow-400 mb-2">📁 peerhost_app/lib/services/</div>
                                    <div className="ml-4 text-gray-400 space-y-1">
                                        <div>├─ background_services.dart (245 lines)</div>
                                        <div>├─ blockchain_service.dart (237 lines)</div>
                                        <div>├─ execution_engine.dart</div>
                                        <div>└─ wallet_connect_service.dart</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'consensus':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-4xl font-bold text-white">Consensus & Majority Voting</h1>
                        <p className="text-lg text-gray-300">
                            How do we trust the result if the computer is untrusted? PeerHost uses a <span className="text-purple-400 font-bold">Probabilistic Consensus Mechanism</span> with economic slashing.
                        </p>
                        <div className="bg-gradient-to-br from-purple-900/20 to-black border border-purple-500/30 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                                <Activity className="text-purple-400" />
                                Mathematical Model
                            </h2>
                            <div className="space-y-4 font-mono text-sm">
                                <div className="bg-black/40 p-4 rounded border border-white/5">
                                    <div className="text-yellow-400 mb-2">Majority Threshold = 66% (2/3rds)</div>
                                    <div className="text-gray-400 text-xs">If <span className="text-white">honestVotes / totalVotes ≥ 0.66</span>, finalize consensus</div>
                                </div>
                                <div className="bg-black/40 p-4 rounded border border-white/5">
                                    <div className="text-red-400 mb-2">Slashing Condition</div>
                                    <div className="text-gray-400 text-xs">If <span className="text-white">dishonestVotes / totalVotes &lt; 0.34</span>, slash minority workers</div>
                                </div>
                                <div className="bg-black/40 p-4 rounded border border-white/5">
                                    <div className="text-green-400 mb-2">Reward Distribution</div>
                                    <div className="text-gray-400 text-xs">
                                        Fastest: <span className="text-white">0.03 POL</span> | Others: <span className="text-white">0.02 POL / (n-1)</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Consensus Algorithm Implementation</h2>
                            <div className="space-y-6">
                                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold text-blue-400 mb-4">Session Lifecycle (30-second window)</h3>
                                    <div className="bg-black/50 p-4 rounded border border-white/5 font-mono text-xs">
                                        <div className="text-gray-500">// apps/gateway/src/services/consensus-manager.js:21-32</div>
                                        <div className="text-green-300 mt-2">
                                            startSession(requestId) {'{'}<br />
                                            &nbsp;&nbsp;this.sessions.set(requestId, {'{'}<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;startTime: Date.now(),<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;submissions: [],<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;hasRespondedToUser: false,<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;timer: setTimeout(() =&gt; this.finalizeSession(requestId), 30_000)<br />
                                            &nbsp;&nbsp;{'}'});<br />
                                            {'}'}
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-3">
                                        When a request is triggered, the consensus manager starts a 30-second window.
                                        After this period, it aggregates all signatures and determines the majority result.
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold text-purple-400 mb-4">Signature Verification (ECDSA.recover)</h3>
                                    <div className="bg-black/50 p-4 rounded border border-white/5 font-mono text-xs">
                                        <div className="text-gray-500">// consensus-manager.js:46-61</div>
                                        <div className="text-purple-300 mt-2">
                                            const messageHash = ethers.solidityPackedKeccak256(<br />
                                            &nbsp;&nbsp;["uint256", "bytes32"],<br />
                                            &nbsp;&nbsp;[requestId, resultHash]<br />
                                            );<br /><br />
                                            const recoveredAddress = ethers.verifyMessage(<br />
                                            &nbsp;&nbsp;ethers.getBytes(messageHash), signature<br />
                                            );<br /><br />
                                            if (recoveredAddress !== workerAddress) {'{'}<br />
                                            &nbsp;&nbsp;return false; // Invalid signature<br />
                                            {'}'}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold text-yellow-400 mb-4">Instant Response Mechanism</h3>
                                    <div className="bg-black/50 p-4 rounded border border-white/5 font-mono text-xs">
                                        <div className="text-gray-500">// consensus-manager.js:73-88</div>
                                        <div className="text-yellow-300 mt-2">
                                            if (!session.hasRespondedToUser) {'{'}<br />
                                            &nbsp;&nbsp;session.hasRespondedToUser = true;<br />
                                            &nbsp;&nbsp;supabase.from('requests').update({'{'}<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;status: 'COMPLETED',<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;result: resultPayload<br />
                                            &nbsp;&nbsp;{'}'}).eq('request_id', requestId);<br />
                                            {'}'}
                                        </div>
                                    </div>
                                    <p className="text-gray-400 text-sm mt-3">
                                        <strong>First-come-first-served</strong>: The first valid worker submission immediately updates the user-facing result.
                                        Consensus finalization happens asynchronously after 30s for on-chain settlement.
                                    </p>
                                </div>

                                <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                                    <h3 className="text-xl font-bold text-green-400 mb-4">Hash Counting Logic</h3>
                                    <div className="bg-black/50 p-4 rounded border border-white/5 font-mono text-xs">
                                        <div className="text-gray-500">// consensus-manager.js:106-119</div>
                                        <div className="text-green-300 mt-2">
                                            const hashCounts = {'{}'};<br />
                                            session.submissions.forEach(sub =&gt; {'{'}<br />
                                            &nbsp;&nbsp;hashCounts[sub.resultHash] = (hashCounts[sub.resultHash] || 0) + 1;<br />
                                            {'}'});<br /><br />
                                            let majorityHash = null;<br />
                                            let maxVotes = -1;<br />
                                            for (const [hash, count] of Object.entries(hashCounts)) {'{'}<br />
                                            &nbsp;&nbsp;if (count &gt; maxVotes) {'{'}<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;majorityHash = hash;<br />
                                            &nbsp;&nbsp;&nbsp;&nbsp;maxVotes = count;<br />
                                            &nbsp;&nbsp;{'}'}<br />
                                            {'}'}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Attack Vectors & Mitigation Strategies</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl">
                                    <h4 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                                        <AlertTriangle size={20} /> Sybil Attacks
                                    </h4>
                                    <p className="text-sm text-gray-400 mb-3">
                                        <strong>Attack:</strong> Attacker spins up 1000 fake workers to control majority.
                                    </p>
                                    <p className="text-sm text-green-400">
                                        <strong>Defense:</strong> 2 POL minimum stake per worker (≈ $1.20). Economic barrier makes Sybil attacks expensive.
                                    </p>
                                </div>

                                <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl">
                                    <h4 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                                        <AlertTriangle size={20} /> Eclipse Attacks
                                    </h4>
                                    <p className="text-sm text-gray-400 mb-3">
                                        <strong>Attack:</strong> Isolate the gateway to only see malicious workers.
                                    </p>
                                    <p className="text-sm text-green-400">
                                        <strong>Defense:</strong> Multiple redundant gateways. Users can run their own gateway (open source).
                                    </p>
                                </div>

                                <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl">
                                    <h4 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                                        <AlertTriangle size={20} /> Result Forgery
                                    </h4>
                                    <p className="text-sm text-gray-400 mb-3">
                                        <strong>Attack:</strong> Worker submits fake signed result.
                                    </p>
                                    <p className="text-sm text-green-400">
                                        <strong>Defense:</strong> ECDSA signature verification. Smart contract validates worker signatures on-chain.
                                    </p>
                                </div>

                                <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl">
                                    <h4 className="text-lg font-bold text-red-400 mb-3 flex items-center gap-2">
                                        <AlertTriangle size={20} /> Non-Deterministic Code
                                    </h4>
                                    <p className="text-sm text-gray-400 mb-3">
                                        <strong>Issue:</strong> Function uses `Math.random()` or `Date.now()` → Different results.
                                    </p>
                                    <p className="text-sm text-yellow-400">
                                        <strong>Mitigation:</strong> No slashing if majority &lt; 66%. Indicates non-deterministic execution.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-white mb-6">Probation & Recovery System</h2>
                            <div className="bg-gradient-to-br from-orange-900/20 to-black border border-orange-500/30 rounded-2xl p-8">
                                <div className="space-y-6">
                                    <div>
                                        <h3 className="text-xl font-bold text-orange-400 mb-4">Slashing → Blacklist</h3>
                                        <div className="bg-black/50 p-4 rounded border border-white/5 font-mono text-xs">
                                            <div className="text-gray-500">// ExecutionCoordinator.sol:277-289</div>
                                            <div className="text-orange-300 mt-2">
                                                for (uint256 i = 0; i &lt; slashees.length; i++) {'{'}<br />
                                                &nbsp;&nbsp;StakerInfo storage info = workerStakes[slashees[i]];<br />
                                                &nbsp;&nbsp;if (!info.isBlacklisted) {'{'}<br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;info.isBlacklisted = true;<br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;info.probationCount = 0;<br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;emit WorkerSlashed(slashees[i]);<br />
                                                &nbsp;&nbsp;{'}'}<br />
                                                {'}'}
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-xl font-bold text-blue-400 mb-4">Recovery: Pay Penalty + 30 Tasks</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="bg-black/30 p-4 rounded border border-white/5">
                                                <div className="text-yellow-400 font-bold mb-2">Step 1: Pay 1 POL</div>
                                                <div className="text-gray-400 text-xs font-mono">
                                                    contract.requestUnban(workerAddress) {'{'} value: 1 POL {'}'}
                                                </div>
                                            </div>
                                            <div className="bg-black/30 p-4 rounded border border-white/5">
                                                <div className="text-green-400 font-bold mb-2">Step 2: Execute 30 Honest Tasks</div>
                                                <div className="text-gray-400 text-xs">
                                                    Worker participates in 30 tasks (no rewards). After 30, auto-unban.
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-black/50 p-4 rounded border border-white/5 font-mono text-xs mt-4">
                                            <div className="text-gray-500">// ExecutionCoordinator.sol:256-267</div>
                                            <div className="text-green-300 mt-2">
                                                if (info.isBlacklisted && info.penaltyDeposited &gt;= UNBAN_PENALTY) {'{'}<br />
                                                &nbsp;&nbsp;info.probationCount++;<br />
                                                &nbsp;&nbsp;if (info.probationCount &gt;= PROBATION_TARGET) {'{'} // 30<br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;info.isBlacklisted = false;<br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;info.penaltyDeposited = 0;<br />
                                                &nbsp;&nbsp;&nbsp;&nbsp;emit WorkerUnbanned(worker);<br />
                                                &nbsp;&nbsp;{'}'}<br />
                                                {'}'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Shield className="text-green-400" /> Security Thresholds
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-400">66.6%</div>
                                    <div className="text-xs text-gray-500 mt-1">Majority Threshold</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-blue-400">2 POL</div>
                                    <div className="text-xs text-gray-500 mt-1">Min. Stake</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-yellow-400">1 POL</div>
                                    <div className="text-xs text-gray-500 mt-1">Unban Penalty</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-purple-400">30</div>
                                    <div className="text-xs text-gray-500 mt-1">Probation Tasks</div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'execution':
                return (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-4xl font-bold text-white">Execution Pipeline</h1>
                        <p className="text-gray-300">The complete lifecycle of a serverless function execution from HTTP request to blockchain settlement. PeerHost uses a hybrid off-chain/on-chain architecture for speed and decentralization.</p>

                        {/* 12-Step Process */}
                        <div className="bg-gradient-to-br from-blue-900/10 to-black border border-blue-500/20 rounded-2xl p-8">
                            <h2 className="text-2xl font-bold text-white mb-6">12-Step Execution Flow</h2>
                            <div className="relative border-l-2 border-dashed border-white/20 ml-6 space-y-8">
                                {/* Step 1 */}
                                <div className="pl-8 relative">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500 ring-4 ring-black"></div>
                                    <h3 className="font-bold text-white text-lg">1. HTTP Request → Gateway</h3>
                                    <p className="text-gray-400 text-sm mb-2">
                                        User sends POST to <code className="bg-white/10 px-1 py-0.5 rounded text-xs">gateway.peerhost.io/run/:wallet/:project/:function</code>
                                    </p>
                                    <div className="bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-blue-300">
                                        // router.js:85-102 (request-builder.js:15-30)<br />
                                        POST /run/0xABC/my-api/weather {'{'} city: "NYC" {'}'}
                                    </div>
                                </div>
                                <div className="pl-8 relative">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-purple-500 ring-4 ring-black"></div>
                                    <h3 className="font-bold text-white text-lg">2. Request Canonicalization</h3>
                                    <p className="text-gray-400 text-sm mb-2">
                                        Gateway builds standardized request object with SHA256 input hash
                                    </p>
                                    <div className="bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-purple-300">
                                        inputHash = SHA256(JSON.stringify(body))<br />
                                        executionRequest = {'{'} wallet, project, fn, inputs, timestamp {'}'}
                                    </div>
                                </div>
                                <div className="pl-8 relative">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-pink-500 ring-4 ring-black"></div>
                                    <h3 className="font-bold text-white text-lg">3. Billing Check</h3>
                                    <p className="text-gray-400 text-sm mb-2">
                                        billing-service.js: Check free tier (20) or deduct credits
                                    </p>
                                    <div className="bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-pink-300">
  // billing-service.js:45–70<br />
                                        if (usageCount ≥ 20 && credits &lt; 1) return 402;
                                    </div>

                                </div>

                                {/* Step 4 */}
                                <div className="pl-8 relative">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-yellow-500 ring-4 ring-black"></div>
                                    <h3 className="font-bold text-white text-lg">4. Blockchain Trigger</h3>
                                    <p className="text-gray-400 text-sm mb-2">
                                        trigger.js calls ExecutionCoordinator.triggerRequest() → emits event
                                    </p>
                                    <div className="bg-black/50 p-3 rounded border border-white/5 font-mono text-xs text-yellow-300">
                                        // trigger.js:45-55<br />
                                        contract.triggerRequest(wallet, project, fn, cid, inputHash)
                                    </div>
                                </div>

                                {/* Step 5-12 abbreviated for space */}
                                <div className="pl-8 relative">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500 ring-4 ring-black"></div>
                                    <h3 className="font-bold text-white text-lg">5-7. Worker Execution</h3>
                                    <p className="text-gray-400 text-sm">
                                        Workers listen (WebSocket) → Fetch code (IPFS) → Fetch inputs (Gateway API) → Execute in VM
                                    </p>
                                </div>

                                <div className="pl-8 relative">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-orange-500 ring-4 ring-black"></div>
                                    <h3 className="font-bold text-white text-lg">8-9. Result Submission</h3>
                                    <p className="text-gray-400 text-sm">
                                        Sign result (ECDSA) → Submit to Gateway (/submit-signature)
                                    </p>
                                </div>

                                <div className="pl-8 relative">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-black"></div>
                                    <h3 className="font-bold text-white text-lg">10-11. Consensus</h3>
                                    <p className="text-gray-400 text-sm">
                                        30s window → Aggregate signatures → Verify 66% majority
                                    </p>
                                </div>

                                <div className="pl-8 relative">
                                    <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-teal-500 ring-4 ring-black"></div>
                                    <h3 className="font-bold text-white text-lg">12. Finalization</h3>
                                    <p className="text-gray-400 text-sm">
                                        Gateway calls finalizeRequests() → Distribute rewards → Slash dishonest
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
                            <h2 className="text-2xl font-bold text-white mb-4">Sandboxed Execution Environment</h2>
                            <div className="space-y-4">
                                <div>
                                    <h4 className="text-lg font-bold text-green-400 mb-2">Exposed APIs</h4>
                                    <div className="font-mono text-xs text-gray-400">
                                        <code>fetch, crypto, Buffer, console, setTimeout</code>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-red-400 mb-2">Blocked APIs</h4>
                                    <div className="font-mono text-xs text-gray-400">
                                        <code>fs, child_process, net, require ('fs')</code>
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-blue-400 mb-2">Timeout</h4>
                                    <div className="font-mono text-xs text-gray-400">
                                        Maximum execution time: <strong>5000ms</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'slashing':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-4xl font-bold text-white text-red-500">Slashing Conditions</h1>
                        <p className="text-xl text-gray-300">
                            Malicious behavior is expensive on PeerHost.
                        </p>

                        <div className="bg-red-900/10 border border-red-500/30 p-6 rounded-xl">
                            <h3 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
                                <AlertTriangle /> The Penalty Box
                            </h3>
                            <p className="text-gray-300 mb-4">
                                If a worker submits a result that disagrees with the super-majority (&gt;66%), they are immediately <strong>Blacklisted</strong>.
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-red-200">
                                <li>Stake is frozen (cannot withdraw).</li>
                                <li>Cannot participate in future rounds.</li>
                                <li>Must pay a fine to unlock.</li>
                            </ul>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white mb-2">Unbanning Cost</h4>
                                <div className="text-3xl font-mono text-yellow-400">1.0 POL</div>
                                <p className="text-xs text-gray-500 mt-1">Paid to the Treasury.</p>
                            </div>
                            <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
                                <h4 className="font-bold text-white mb-2">Probation Period</h4>
                                <div className="text-3xl font-mono text-blue-400">30 Requests</div>
                                <p className="text-xs text-gray-500 mt-1">Must perform honestly to regain full status.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'mobile':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-4xl font-bold text-white">Mobile Application</h1>
                        <p className="text-gray-300">
                            The PeerHost mobile app allows anyone with a smartphone to become a compute provider. We've optimized the Node.js runtime to function efficiently in a mobile environment.
                        </p>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-8">
                            <div className="space-y-8">
                                <h3 className="text-2xl font-bold text-white">How It Works</h3>

                                <div className="relative border-l-2 border-green-500/30 pl-8 space-y-10">
                                    <div className="relative">
                                        <div className="absolute -left-[39px] top-1 w-6 h-6 rounded-full bg-black border-2 border-green-500 flex items-center justify-center text-[10px] font-bold text-green-500">1</div>
                                        <h4 className="text-lg font-bold text-white mb-2">Connect Wallet</h4>
                                        <p className="text-gray-400 text-sm">
                                            Upon launching the app, you connect your Web3 wallet (e.g., MetaMask, Rabby). This identity is used to sign execution results and receive POL rewards.
                                        </p>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute -left-[39px] top-1 w-6 h-6 rounded-full bg-black border-2 border-green-500 flex items-center justify-center text-[10px] font-bold text-green-500">2</div>
                                        <h4 className="text-lg font-bold text-white mb-2">Fetch Worker Profile</h4>
                                        <p className="text-gray-400 text-sm">
                                            The app automatically queries the smart contract registry to find any worker nodes associated with your address. If none exist, you can register a new one with a single tap.
                                        </p>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute -left-[39px] top-1 w-6 h-6 rounded-full bg-black border-2 border-green-500 flex items-center justify-center text-[10px] font-bold text-green-500">3</div>
                                        <h4 className="text-lg font-bold text-white mb-2">Activate Node</h4>
                                        <p className="text-gray-400 text-sm">
                                            Toggle the "Run Node" switch. The app initializes the <strong>Execution Engine</strong>. You can now minimize the app; it will continue running.
                                        </p>
                                    </div>

                                    <div className="relative">
                                        <div className="absolute -left-[39px] top-1 w-6 h-6 rounded-full bg-black border-2 border-green-500 flex items-center justify-center text-[10px] font-bold text-green-500">4</div>
                                        <h4 className="text-lg font-bold text-white mb-2">Earn in Background</h4>
                                        <p className="text-gray-400 text-sm">
                                            When a request matches your node, the app wakes up, executes the code, and submits the proof. Earnings are deposited directly to your wallet.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                    <Cpu className="text-purple-400" /> Technical Architecture
                                </h3>

                                <div className="space-y-6">
                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                        <h5 className="font-bold text-blue-400 text-sm mb-1">Dart Isolates (Background Service)</h5>
                                        <p className="text-xs text-gray-400">
                                            We use Flutter's background isolates to maintain a persistent WebSocket connection to the execution coordinator, ensuring the UI thread remains smooth while the node listens for events 24/7.
                                        </p>
                                    </div>

                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                        <h5 className="font-bold text-yellow-400 text-sm mb-1">QuickJS Engine</h5>
                                        <p className="text-xs text-gray-400">
                                            Instead of a heavy Node.js instance, we embed the lightweight <strong>QuickJS</strong> engine via FFI. This allows us to execute untrusted JavaScript code securely and performantly within the mobile environment.
                                        </p>
                                    </div>

                                    <div className="bg-black/40 p-4 rounded-xl border border-white/5">
                                        <h5 className="font-bold text-green-400 text-sm mb-1">Battery Optimization</h5>
                                        <p className="text-xs text-gray-400">
                                            The node only "wakes up" fully when an <code>ExecutionRequested</code> event triggers.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'rewards':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-4xl font-bold text-white">Incentive Structure</h1>
                        <p className="text-gray-300">
                            Breakdown of the <strong>0.05 ETH/MATIC</strong> reward per execution.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-yellow-900/10 border border-yellow-500/20 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><Zap size={64} /></div>
                                <h3 className="text-lg font-bold text-yellow-400">Fastest Worker</h3>
                                <div className="text-4xl font-bold text-white my-3">0.03 ETH</div>
                                <p className="text-xs text-yellow-200/60">60% of the pot goes to the node that submits the first valid result.</p>
                            </div>
                            <div className="p-6 bg-blue-900/10 border border-blue-500/20 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><Network size={64} /></div>
                                <h3 className="text-lg font-bold text-blue-400">Validators</h3>
                                <div className="text-4xl font-bold text-white my-3">0.02 ETH</div>
                                <p className="text-xs text-blue-200/60">Shared amongst all other honest workers who verified the result.</p>
                            </div>
                            <div className="p-6 bg-red-900/10 border border-red-500/20 rounded-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 opacity-10"><AlertTriangle size={64} /></div>
                                <h3 className="text-lg font-bold text-red-400">Malicious</h3>
                                <div className="text-4xl font-bold text-white my-3">HASHED</div>
                                <p className="text-xs text-red-200/60">0 Rewards. Stake slashed. Immediate ban.</p>
                            </div>
                        </div>
                    </div>
                );
            case 'billing':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-4xl font-bold text-white">Billing & Credits</h1>
                        <div className="space-y-6">
                            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
                                <h3 className="text-xl font-bold text-white mb-4">Unitary Credit System</h3>
                                <p className="text-gray-300 mb-4">
                                    We use a simplified credit model mapping native tokens to execution credits.
                                </p>
                                <div className="flex items-center justify-center p-8 bg-black/50 rounded-lg gap-8">
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-purple-400">1 POL</div>
                                        <div className="text-xs text-gray-500">Native Token</div>
                                    </div>
                                    <div className="text-2xl text-gray-600">=</div>
                                    <div className="text-center">
                                        <div className="text-3xl font-bold text-white">50 Credits</div>
                                        <div className="text-xs text-gray-500">Execution Units</div>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-6 border border-white/10 rounded-xl">
                                    <h4 className="font-bold text-white">Free Tier</h4>
                                    <p className="text-gray-400 mt-2">Every function gets <strong>20 free executions</strong> before payment is required. Great for testing.</p>
                                </div>
                                <div className="p-6 border border-white/10 rounded-xl">
                                    <h4 className="font-bold text-white">402 Payment Required</h4>
                                    <p className="text-gray-400 mt-2">When credits run out, the Gateway returns `402`. Clients must `depositCredits()` on-chain to continue.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'mcp':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-4xl font-bold text-white">AI Agents (MCP)</h1>
                        <p className="text-gray-300">
                            PeerHost natively implements the <a href="https://modelcontextprotocol.io" target="_blank" className="text-blue-400 hover:underline">Model Context Protocol</a>.
                            This means Claude, ChatGPT, and other agents can "read" and "execute" your functions automatically.
                        </p>

                        <div className="bg-[#1e1e1e] p-6 rounded-xl border border-white/10 font-mono text-sm overflow-x-auto">
                            <h4 className="text-gray-500 mb-2">/mcp.json</h4>
                            <pre className="text-green-400">
                                {`{
  "name": "My PeerHost Project",
  "tools": [
    {
      "name": "generate_image",
      "description": "Generates AI image...",
      "price": "0.02 POL",
      "inputSchema": { ... }
    }
  ]
}`}
                            </pre>
                        </div>
                    </div>
                );

            case 'x402':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-4xl font-bold text-white">x402 Protocol</h1>
                        <p className="text-gray-300">
                            The missing economic layer for the web. x402 (based on HTTP 402 Payment Required) is an open standard for <strong>Payment-Gated APIs</strong>.
                        </p>

                        <div className="bg-gradient-to-r from-purple-900/20 to-blue-900/20 p-6 rounded-xl border border-purple-500/20">
                            <h3 className="text-lg font-semibold text-purple-300 mb-2">Why 402?</h3>
                            <p className="text-sm text-gray-400">
                                HTTP Error Code 402 was reserved for "Payment Required" in the original internet specs but was never standardized—until now.
                                We use it to signal to clients (Humans or Agents) that a resource has a price.
                            </p>
                        </div>

                        <h3 className="text-xl font-bold text-white mt-6">How It Works</h3>
                        <div className="space-y-4">
                            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                                <h4 className="font-mono text-yellow-400 mb-2">1. The Challenge</h4>
                                <p className="text-sm text-gray-400">Client requests a resource. Server responds with <code>402 Payment Required</code> and includes metadata: Price, Currency (USDC), and Beneficiary.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                                <h4 className="font-mono text-green-400 mb-2">2. The Payment</h4>
                                <p className="text-sm text-gray-400">Client pays on-chain (Polygon Amoy). This can be an instant wallet signature or an automated agent transaction.</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                                <h4 className="font-mono text-blue-400 mb-2">3. The Proof</h4>
                                <p className="text-sm text-gray-400">Client retries the request with <code>X-Payment</code> header containing the proof of payment. Server validates and executes.</p>
                            </div>
                        </div>
                    </div>
                );

            default:
                return <div>Select a section</div>;
        }
    };

    const ChevronRightIcon = ({ className }: { className?: string }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="9 18 15 12 9 6" />
        </svg>
    );

    const checkIcon = <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="text-green-400"><polyline points="20 6 9 17 4 12" /></svg>;

    const Check = ({ className }: { className?: string }) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <polyline points="20 6 9 17 4 12" />
        </svg>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
            <Navbar />

            <div className="flex max-w-[1600px] mx-auto pt-16 min-h-[calc(100vh-64px)]">

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    className="lg:hidden fixed bottom-6 right-6 z-50 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center shadow-lg"
                >
                    {mobileMenuOpen ? <X /> : <Menu />}
                </button>

                {/* Sidebar */}
                <aside className={`
                fixed lg:sticky top-16 left-0 h-[calc(100vh-64px)] w-72 bg-black border-r border-white/10 
                overflow-y-auto z-40 transition-transform duration-300 ease-in-out
                ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                    <div className="p-6 space-y-8">
                        {sections.map(section => (
                            <div key={section.title}>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 font-mono">
                                    {section.title}
                                </h3>
                                <div className="space-y-1">
                                    {section.items.map(item => (
                                        <button
                                            key={item.id}
                                            onClick={() => {
                                                setActiveSection(item.id);
                                                setMobileMenuOpen(false);
                                                window.scrollTo({ top: 0, behavior: 'smooth' });
                                            }}
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${activeSection === item.id
                                                ? 'bg-white/10 text-white border border-white/10'
                                                : 'text-gray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <item.icon size={16} className={activeSection === item.id ? 'text-blue-400' : 'opacity-70'} />
                                            {item.label}
                                            {activeSection === item.id && <ChevronRightIcon className="w-4 h-4 ml-auto opacity-50" />}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 p-6 lg:p-12 max-w-5xl mx-auto w-full">
                    {renderContent()}

                    {/* Footer Navigation Hints */}
                    <div className="mt-20 pt-8 border-t border-white/10 flex justify-between text-sm text-gray-500">
                        <div>
                            Polygon Amoy Setup
                        </div>
                        <div>
                            <a href="https://github.com/ashishexee/peerhost" target="_blank" className="ml-1 text-white hover:underline flex items-center gap-2">
                                <ExternalLink size={14} /> Edit on GitHub
                            </a>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};
