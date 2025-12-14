
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Book, Server, Cpu, Globe,
    Shield, Code, Terminal, Zap,
    ChevronRight, Menu, X, ExternalLink,
    Layers, Box, CreditCard, Bot
} from 'lucide-react';
import Navbar from './Navbar';

const Docs = () => {
    const [activeSection, setActiveSection] = useState('welcome');
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Navigation Structure
    const sections = [
        {
            title: 'GETTING STARTED',
            items: [
                { id: 'welcome', label: 'Welcome', icon: Book },
                { id: 'start', label: 'Where do I start?', icon: Zap },
                { id: 'concepts', label: 'Core Concepts', icon: Layers },
                { id: 'how-it-works', label: 'How it works', icon: Terminal },
            ]
        },
        {
            title: 'BASICS',
            items: [
                { id: 'serverless', label: 'Serverless Functions', icon: Code },
                { id: 'workers', label: 'About Workers', icon: Cpu },
                { id: 'coordinator', label: 'Execution Coordinator', icon: Shield },
                { id: 'gateway', label: 'API Gateway', icon: Server },
                { id: 'x402', label: 'x402 Protocol', icon: CreditCard },
                { id: 'agentic', label: 'Agentic Payments', icon: Bot },
            ]
        }
    ];

    const renderContent = () => {
        switch (activeSection) {
            case 'welcome':
                return (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-4xl font-bold text-white mb-6">Welcome to PeerHost Docs</h1>
                        <p className="text-lg text-gray-300 leading-relaxed">
                            PeerHost is the world's first **Decentralized & Monetizable** serverless execution network.
                            We enable developers to deploy backend logic as individual functions without provisioning a single server,
                            while guaranteeing that code executes on a permissionless global grid.
                            <br /><br />
                            Crucially, PeerHost implements the <strong>x402 Protocol</strong>, allowing any function to potentially earn revenue from both humans and AI agents.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-blue-500/50 transition-colors">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Zap className="text-yellow-400" /> For Builders
                                </h3>
                                <p className="text-gray-400">Deploy your first function in seconds using your existing GitHub repos.</p>
                            </div>
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-pink-500/50 transition-colors">
                                <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                                    <Cpu className="text-pink-400" /> For Workers
                                </h3>
                                <p className="text-gray-400">Run a node, contribute compute power, and earn crypto rewards.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'start':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold text-white">Where do I start?</h1>
                        <div className="prose prose-invert max-w-none">
                            <p>Everything in PeerHost revolves around <strong>Functions</strong>. A function is a single piece of JavaScript code that performs a task.</p>

                            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Prerequisites</h3>
                            <ul className="list-disc pl-6 space-y-2 text-gray-300">
                                <li>A standard Web2 GitHub account (to store your code)</li>
                                <li>A Web3 Wallet (like MetaMask) to sign deployments</li>
                                <li>Some JavaScript/Node.js knowledge</li>
                            </ul>

                            <h3 className="text-xl font-semibold text-white mt-6 mb-4">Your First Deployment</h3>
                            <ol className="list-decimal pl-6 space-y-4 text-gray-300">
                                <li><strong>Log in</strong>: Connect your wallet at the top right.</li>
                                <li><strong>Go to Console</strong>: Click "Go to Console" or "Start Building".</li>
                                <li><strong>Connect GitHub</strong>: Link your GitHub account so PeerHost can read your repositories.</li>
                                <li><strong>Select a Repo</strong>: Choose a repository containing a <code>functions/</code> folder.</li>
                                <li><strong>Deploy</strong>: PeerHost handles the bundling, IPFS upload, and blockchain registration automatically.</li>
                            </ol>
                        </div>
                    </div>
                );

            case 'concepts':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold text-white">Core Concepts</h1>

                        <div className="space-y-6">
                            <section>
                                <h2 className="text-2xl font-semibold text-green-400 mb-2">Native Monetization</h2>
                                <p className="text-gray-300">
                                    PeerHost allows you to attach a price to any function. We use the <strong>x402 Protocol</strong> (Payment Required) to ensure that users (or AI Agents) pay your specified fee before the code is executed.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-blue-400 mb-2">Decentralized Execution</h2>
                                <p className="text-gray-300">
                                    Unlike AWS Lambda or Vercel, which run on proprietary servers owned by one company, PeerHost runs on a <strong>Network of Independent Workers</strong>.
                                    Anyone can run a PeerHost worker node. This means your backend is immune to single-provider outages or censorship.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-indigo-400 mb-2">Trust-Minimization</h2>
                                <p className="text-gray-300">
                                    We don't ask you to trust a central server to route your requests correctly. We use a <strong>Smart Contract</strong> as the source of truth.
                                    Every request and its result result involves cryptographic signatures, ensuring that the response you get actually came from a worker executing your specific code.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-semibold text-purple-400 mb-2">Immutable Code</h2>
                                <p className="text-gray-300">
                                    Once you deploy, your code is hashed and stored on <strong>IPFS</strong>. This Content ID (CID) is immutable.
                                    This guarantees that the version of code being executed is exactly what you audited and deployed, with zero chance of silent "hot-swaps" or tampering by the platform.
                                </p>
                            </section>
                        </div>
                    </div>
                );

            case 'how-it-works':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold text-white">How It Works</h1>
                        <p className="text-gray-300">The lifecycle of a PeerHost Request:</p>

                        <div className="relative border-l-2 border-white/20 ml-4 space-y-12 py-4">
                            <div className="relative pl-8">
                                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-blue-500"></span>
                                <h3 className="font-bold text-white text-lg">1. User Request</h3>
                                <p className="text-sm text-gray-400">User hits <code>https://wallet.peerhost.net/project/fn</code></p>
                            </div>
                            <div className="relative pl-8">
                                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-cyan-500"></span>
                                <h3 className="font-bold text-white text-lg">2. Gateway Processing</h3>
                                <p className="text-sm text-gray-400">Gateway validates request, uploads inputs to IPFS/Cache, and triggers the Smart Contract.</p>
                            </div>
                            <div className="relative pl-8">
                                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-purple-500"></span>
                                <h3 className="font-bold text-white text-lg">3. On-Chain Coordination</h3>
                                <p className="text-sm text-gray-400"><code>ExecutionCoordinator.sol</code> emits an <code>ExecutionRequested</code> event to the blockchain.</p>
                            </div>
                            <div className="relative pl-8">
                                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-pink-500"></span>
                                <h3 className="font-bold text-white text-lg">4. Worker Execution</h3>
                                <p className="text-sm text-gray-400">Workers listening to the chain pick up the job, fetch code from IPFS, execute in Sandbox, and submit result.</p>
                            </div>
                            <div className="relative pl-8">
                                <span className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-green-500"></span>
                                <h3 className="font-bold text-white text-lg">5. Response</h3>
                                <p className="text-sm text-gray-400">Gateway sees the result on-chain (or via p2p signal) and returns the HTTP response to the user.</p>
                            </div>
                        </div>
                    </div>
                );

            case 'serverless':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold text-white">Serverless Functions</h1>
                        <p className="text-gray-300">
                            Detailed technical breakdown of how PeerHost handles your code.
                        </p>

                        <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2">Bundling Strategy</h3>
                        <p className="text-gray-300">
                            When you deploy, our build system (using <code>esbuild</code>) traverses your entry file (e.g., <code>hello.js</code>).
                            It bundles all imports, dependencies (node_modules), and utility files into a single, self-contained ESM JavaScript module.
                            This ensures that the worker does not need to run <code>npm install</code> at runtime, drastically reducing Cold Starts.
                        </p>

                        <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 mt-8">IPFS Storage Layer</h3>
                        <div className="bg-black/40 p-4 rounded-lg border border-white/10">
                            <p className="text-gray-300 mb-2">Your code isn't stored on our servers. It's pinned to the InterPlanetary File System (IPFS).</p>
                            <ul className="list-disc pl-5 space-y-1 text-sm text-gray-400">
                                <li><strong>Resilience:</strong> Even if our gateway goes down, your code exists on the IPFS network tailored by multiple peers.</li>
                                <li><strong>Addressability:</strong> Code is referenced by Content Hash (CID), ensuring data integrity.</li>
                            </ul>
                        </div>

                        <h3 className="text-xl font-bold text-white border-b border-white/10 pb-2 mt-8">Runtime Environment</h3>
                        <p className="text-gray-300">
                            Functions run in a restricted **Node.js 18** environment.
                        </p>
                        <pre className="bg-black/50 p-4 rounded-lg mt-4 text-xs font-mono text-gray-300 overflow-x-auto">
                            {`export default async function(args) {
    // args includes:
    // - body: The HTTP body
    // - query: URL query params
    // - secrets: Decrypted env vars
    
    return { 
        status: 200, 
        body: { message: "Hello World" } 
    };
}`}
                        </pre>
                    </div>
                );

            case 'workers':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold text-white">About Workers</h1>
                        <div className="flex items-start gap-4 p-4 bg-pink-900/10 border border-pink-500/20 rounded-xl">
                            <Cpu className="w-6 h-6 text-pink-500 mt-1" />
                            <div>
                                <h4 className="font-bold text-pink-400">The Powerhouse of the Network</h4>
                                <p className="text-sm text-pink-200/80">Workers are the physical machines that actually run user code.</p>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mt-6">How Workers Operate</h3>
                        <p className="text-gray-300">
                            A Worker is a lightweight Node.js daemon that anyone can run. It connects to the Polygon RPC and listens for specific events.
                        </p>
                        <ol className="list-decimal pl-6 space-y-3 text-gray-300">
                            <li><strong>The Listener:</strong> Constantly polls the blockchain for <code>ExecutionRequested(requestId, cid, ...)</code>.</li>
                            <li><strong>The Fetcher:</strong> When a job is seen, it immediately downloads the code bundle from IPFS using the CID.</li>
                            <li><strong>The Sandbox:</strong> It spins up an isolated VM (using <code>vm2</code> or Docker). This sandbox has no network access (unless whitelisted) and strict memory limits.</li>
                            <li><strong>The Executor:</strong> It injects the input data and runs the function.</li>
                            <li><strong>The Submitter:</strong> It signs the result with its private key and sends a <code>submitResult()</code> transaction back to the contract.</li>
                        </ol>

                        <h3 className="text-xl font-bold text-white mt-6">Economic Incentives</h3>
                        <p className="text-gray-300">
                            Workers are motivated by **Rewards**. The Execution Coordinator contract holds a Treasury of funds.
                            When a worker successfully submits a valid result, the contract atomically transfers a fee (e.g., 0.001 ETH/MATIC) to the worker's wallet.
                        </p>
                    </div>
                );

            case 'coordinator':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold text-white">Execution Coordinator</h1>
                        <p className="text-gray-300">
                            The heart of trust-minimization. This Smart Contract acts as the decentralized "Load Balancer" and "Payroll Department".
                        </p>

                        <div className="bg-[#1a1a1a] p-6 rounded-xl border border-white/10">
                            <h3 className="text-sm font-mono text-gray-500 uppercase tracking-widest mb-2">Contract Address (Amoy Testnet)</h3>
                            <div className="flex items-center gap-3">
                                <code className="text-green-400 font-mono text-lg break-all">0x087a2d886fc8eadf5d03f6ea5acd0b1430c13fb8</code>
                                <a
                                    href="https://amoy.polygonscan.com/address/0x087a2d886fc8eadf5d03f6ea5acd0b1430c13fb8"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <ExternalLink size={20} />
                                </a>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mt-6">Responsibilities</h3>
                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <li className="bg-white/5 p-4 rounded-lg border border-white/5">
                                <h4 className="font-bold text-purple-400 mb-1">Request Logging</h4>
                                <p className="text-xs text-gray-400">Emits immutable events for every job, creating a permanent audit trail of all execution requests.</p>
                            </li>
                            <li className="bg-white/5 p-4 rounded-lg border border-white/5">
                                <h4 className="font-bold text-purple-400 mb-1">Result Verification</h4>
                                <p className="text-xs text-gray-400">Ensures that result submissions match the request ID and originate from valid workers.</p>
                            </li>
                            <li className="bg-white/5 p-4 rounded-lg border border-white/5">
                                <h4 className="font-bold text-purple-400 mb-1">Treasury Management</h4>
                                <p className="text-xs text-gray-400">Holds the token balance used to pay workers. Ensures solvency of the network.</p>
                            </li>
                        </ul>
                    </div>
                );

            case 'gateway':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold text-white">API Gateway</h1>
                        <p className="text-gray-300">
                            The bridge between Web2 HTTP clients and the Web3 execution network.
                        </p>

                        <h3 className="text-xl font-bold text-white mt-6">Role in the Stack</h3>
                        <p className="text-gray-300">
                            While the blockchain coordinates execution, it cannot natively handle HTTP requests or high-bandwidth data (like JSON bodies) efficiently.
                            The Gateway solves this.
                        </p>

                        <h3 className="text-xl font-bold text-white mt-6">Key Functions</h3>
                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-cyan-900/30 flex items-center justify-center border border-cyan-500/20 shrink-0">
                                    <Shield className="text-cyan-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Authentication & Validation</h4>
                                    <p className="text-sm text-gray-400">Verifies that the incoming request targets a valid project and function. Handles Cross-Origin Resource Sharing (CORS).</p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <div className="w-12 h-12 rounded-lg bg-cyan-900/30 flex items-center justify-center border border-cyan-500/20 shrink-0">
                                    <Layers className="text-cyan-400" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white">Off-Chain Data Availability</h4>
                                    <p className="text-sm text-gray-400">
                                        Stores the request payload (Body/Query) temporarily and provides it to the Worker upon request.
                                        This keeps the blockchain lean and fast.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'x402':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold text-white">x402 Protocol</h1>
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

            case 'agentic':
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h1 className="text-3xl font-bold text-white">Agentic Payments</h1>
                        <p className="text-gray-300">
                            PeerHost is the <strong>Native Execution Layer for AI Agents</strong>.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                                <Bot className="w-8 h-8 text-pink-400 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">For AI Agents</h3>
                                <p className="text-sm text-gray-400">
                                    Agents using frameworks like LangChain or our <code>llm-wallet-mcp</code> can automatically discover your tool's price regarding the <code>mcp.json</code> manifest standard and handle the negotiation autonomously.
                                </p>
                            </div>
                            <div className="p-6 bg-white/5 rounded-xl border border-white/10">
                                <Globe className="w-8 h-8 text-blue-400 mb-4" />
                                <h3 className="text-xl font-bold text-white mb-2">For Humans</h3>
                                <p className="text-sm text-gray-400">
                                    It's not just for bots. Developers can build premium APIs, paid content gateways, or dApps that charge per interaction without setting up Stripe or user accounts.
                                </p>
                            </div>
                        </div>

                        <h3 className="text-xl font-bold text-white mt-8">MCP Integration</h3>
                        <p className="text-gray-300">
                            Every PeerHost project automatically generates a <code>mcp.json</code> (Model Context Protocol).
                            When you paste your project URL into compatible AI tools (like Claude Desktop or specialized Agent Browsers), the AI instantly knows:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4 text-gray-400 font-mono text-sm">
                            <li>What functions are available</li>
                            <li>Input schema (arguments)</li>
                            <li><strong>Price per execution</strong></li>
                        </ul>
                    </div>
                );

            default:
                return <div>Select a section</div>;
        }
    };

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
                                                    ? 'bite/10 text-white border border-white/10'
                                                    : 'tgray-400 hover:text-white hover:bg-white/5'
                                                }`}
                                        >
                                            <item.icon size={16} className={activeSection === item.id ? 'text-blue-400' : 'opacity-70'} />
                                            {item.label}
                                            {activeSection === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
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
                            Is something missing?
                            <a href="https://github.com/ashishexee/peerhost" target="_blank" className="ml-1 text-white hover:underline">Edit this page on GitHub</a>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Docs;
