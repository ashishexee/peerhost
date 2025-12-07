
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code, Server, Zap, Rocket } from 'lucide-react';
import Navbar from './Navbar';

const LearnMore = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20">
      <Navbar />
      
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-16">
        <button 
          onClick={() => navigate('/deploy')}
          className="flex items-center gap-2 text-accents-5 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-accents-4 mb-6">
          Understanding PeerHost Function Deployment
        </h1>
        <p className="text-xl text-accents-5 mb-12 leading-relaxed">
            Learn how to build, structure, and deploy unstoppable serverless functions on the PeerHost network.
        </p>

        <div className="space-y-16">
            
            {/* Section 1: Concept */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400"><Server size={24} /></div>
                    <h2 className="text-2xl font-bold text-white">What are Serverless Functions?</h2>
                </div>
                <div className="prose prose-invert max-w-none text-accents-4">
                    <p className="mb-4">
                        Traditional backends require you to provision, manage, and scale servers (like EC2 instances or Droplets). 
                        If your traffic spikes, your server crashes. If you forget to patch it, you get hacked.
                    </p>
                    <p>
                        <strong>Serverless Functions</strong> allow you to write backend logic (e.g., a Javascript function) and deploy it without thinking about the underlying infrastructure. 
                        PeerHost takes your code, distributes it across a global network of workers, and executes it on-demand when a user visits your URL.
                    </p>
                </div>
            </section>

            {/* Section 2: Structure */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400"><Code size={24} /></div>
                    <h2 className="text-2xl font-bold text-white">Project Structure</h2>
                </div>
                <div className="prose prose-invert max-w-none text-accents-4 mb-6">
                    <p>
                        To deploy on PeerHost, your GitHub repository must follow a simple structure. 
                        We look for a special folder named <code className="text-white bg-white/10 px-1 py-0.5 rounded">functions</code>.
                    </p>
                </div>

                <div className="bg-[#111] border border-white/10 rounded-xl p-6 font-mono text-sm">
                    <div className="text-accents-5">my-awesome-project/</div>
                    <div className="ml-4 text-accents-5">├── package.json <span className="text-green-500/50">// Dependencies</span></div>
                    <div className="ml-4 text-accents-5">├── README.md</div>
                    <div className="ml-4 text-white">└── functions/ <span className="text-blue-400">// REQUIRED FOLDER</span></div>
                    <div className="ml-8 text-white">├── hello.js <span className="text-purple-400">// Becomes /hello</span></div>
                    <div className="ml-8 text-white">├── payment.js <span className="text-purple-400">// Becomes /payment</span></div>
                    <div className="ml-8 text-white">└── auth/</div>
                    <div className="ml-12 text-white">└── login.js <span className="text-purple-400">// Becomes /auth/login</span></div>
                </div>
            </section>

            {/* Section 3: Writing Code */}
            <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-yellow-500/10 rounded-lg text-yellow-400"><Zap size={24} /></div>
                    <h2 className="text-2xl font-bold text-white">Writing Your Function</h2>
                </div>
                <div className="prose prose-invert max-w-none text-accents-4 mb-6">
                    <p>
                        A PeerHost function is just a standard JavaScript file. It doesn't need to export anything special. 
                        The last expression evaluated in the file is returned as the response. 
                        You have access to <code className="text-white bg-white/10 px-1 py-0.5 rounded">args.http</code> to read the request.
                    </p>
                </div>
                
                <div className="bg-[#111] border border-white/10 rounded-xl p-6 relative overflow-hidden group">
                    <div className="absolute top-4 right-4 text-xs text-accents-5 font-mono">functions/greet.js</div>
                    <pre className="font-mono text-sm text-accents-3 overflow-x-auto">
{`// 1. You can import modules installed in package.json
import { ethers } from "ethers";

// 2. Read input from args.http (query, body, headers)
const name = args.http.query.name || "World";

// 3. Return a JSON response
return {
    status: 200,
    headers: { "Content-Type": "application/json" },
    body: {
        message: \`Hello, \${name}! from PeerHost\`,
        timestamp: Date.now()
    }
};`}
                    </pre>
                </div>
            </section>

             {/* Section 4: Deployment */}
             <section>
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-500/10 rounded-lg text-green-400"><Rocket size={24} /></div>
                    <h2 className="text-2xl font-bold text-white">How to Deploy</h2>
                </div>
                <div className="prose prose-invert max-w-none text-accents-4">
                    <ol className="list-decimal list-inside space-y-4">
                        <li>
                            <strong className="text-white">Push your code to GitHub.</strong> Ensure you have the <code className="text-white bg-white/10 px-1 py-0.5 rounded">functions</code> folder.
                        </li>
                        <li>
                            <strong className="text-white">Go to the Dashboard.</strong> Click "Create Project" or "New Deployment".
                        </li>
                        <li>
                            <strong className="text-white">Link your Repository.</strong> Paste the HTTP URL of your GitHub repo.
                        </li>
                        <li>
                            <strong className="text-white">Configure Environment.</strong> Add any secret API keys (e.g., <code className="text-white bg-white/10 px-1 py-0.5 rounded">STRIPE_KEY</code>) in the environment variables section.
                        </li>
                        <li>
                            <strong className="text-white">Deploy!</strong> formatting PeerHost will bundle your code, upload it to IPFS, and register it on the blockchain.
                        </li>
                    </ol>
                </div>
            </section>

        </div>
        
        <div className="mt-20 p-8 border border-white/10 rounded-2xl bg-gradient-to-br from-accents-1 to-black text-center">
            <h3 className="text-2xl font-bold text-white mb-4">Ready to ship?</h3>
            <p className="text-accents-5 mb-8">Deploy your first function to the decentralized web in seconds.</p>
            <button 
                onClick={() => navigate('/deploy/new')}
                className="bg-white text-black px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-200 transition-colors"
            >
                Start Deployment
            </button>
        </div>

      </div>
    </div>
  );
};

export default LearnMore;
