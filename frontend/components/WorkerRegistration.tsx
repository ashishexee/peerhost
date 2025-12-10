import React, { useState } from 'react';
import { Terminal, Copy, Check, Server, Shield, Cpu, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const CodeBlock = ({ code }: { code: string }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group bg-black/50 border border-white/10 rounded-lg p-4 font-mono text-sm text-gray-300 overflow-x-auto">
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={copyToClipboard}
          className="p-1.5 hover:bg-white/10 rounded-md transition-colors"
        >
          {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4 text-gray-400" />}
        </button>
      </div>
      <pre>{code}</pre>
    </div>
  );
};

const Step = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-6 relative pb-12 last:pb-0">
    <div className="flex flex-col items-center">
      <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 font-bold shrink-0 z-10">
        {number}
      </div>
      <div className="w-px h-full bg-white/10 absolute top-10 left-5 -z-0" />
    </div>
    <div className="flex-1 pt-2">
      <h3 className="text-xl font-bold text-white mb-4">{title}</h3>
      <div className="text-gray-400 space-y-4">{children}</div>
    </div>
  </div>
);

export default function WorkerRegistration() {
  return (
    <div className="min-h-screen bg-black pt-24 pb-20 px-4">
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-mono mb-6">
            <Server className="w-3 h-3" />
            WORKER NETWORK
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Run a Worker Node</h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Earn rewards by contributing compute power to the PeerHost network.
            Run serverless functions in a secure sandbox environment.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20">
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <Cpu className="w-8 h-8 text-purple-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Monetize Compute</h3>
            <p className="text-sm text-gray-400">Turn your idle CPU cycles into earnings. Workers get paid for every verified execution.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <Shield className="w-8 h-8 text-blue-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Secure Sandbox</h3>
            <p className="text-sm text-gray-400">Code runs in isolated VM2 sandboxes. Your host machine stays protected.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-6 rounded-xl">
            <Terminal className="w-8 h-8 text-green-400 mb-4" />
            <h3 className="text-lg font-bold text-white mb-2">Easy Setup</h3>
            <p className="text-sm text-gray-400">Simple CLI setup. Run on any machine with Node.js and an internet connection.</p>
          </div>
        </div>

        {/* Setup Steps */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">Setup Instructions</h2>

          <Step number={1} title="Prerequisites">
            <p>Ensure you have the following installed on your machine:</p>
            <ul className="list-disc list-inside space-y-2 ml-2">
              <li>Node.js v16+</li>
              <li>Git</li>
              <li>An EVM Wallet (Private Key required for signing results)</li>
            </ul>
          </Step>

          <Step number={2} title="Clone the Worker Repository">
            <p>Clone the official peerhost repository to get the worker software.</p>
            <CodeBlock code="git clone https://github.com/ashishexee/peerhost.git
cd peerhost/apps/worker
npm install" />
          </Step>

          <Step number={3} title="Configure Environment">
            <p>Create a <code className="text-blue-300">.env</code> file in the <code className="text-blue-300">/peerhost/</code> that is the root directory.</p>
            <CodeBlock code="GATEWAY_URL=https://gateway.peerhost.net
RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_wallet_private_key
IPFS_GATEWAY=https://ipfs.io/ipfs/" />
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-sm text-yellow-200 mt-4">
              ⚠️ <strong>Security Note:</strong> Your private key is used ONLY to sign execution results on-chain. Store it securely and never share it.
            </div>
          </Step>

          <Step number={4} title="Start the Worker">
            <p>Launch your node. It will automatically connect to the network and start listening for jobs.</p>
            <CodeBlock code="npm start" />
            <p className="text-sm text-gray-500 italic">You should see "Worker Listening for Events..." in your terminal.</p>
          </Step>

        </div>

        {/* Android Guide */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12 mt-8">
          <h2 className="text-2xl font-bold text-white mb-8 border-b border-white/10 pb-4">Run on Android</h2>

          <p className="text-gray-400 mb-8">
            You can also run PeerHost's Workers Node on Android devices using Termux.
            This allows you to contribute compute power directly from your mobile phone.
          </p>

          <Step number={1} title="Install Termux">
            <p>Download and install <strong>Termux</strong> from F-Droid (recommended over Play Store).</p>
            <p className="text-sm text-gray-500 mt-2">Termux provides a Linux-like environment on your Android device.</p>
          </Step>

          <Step number={2} title="Install Dependencies">
            <p>Update packages and install Node.js and Git.</p>
            <CodeBlock code="pkg update
pkg upgrade
pkg install git nodejs" />
          </Step>

          <Step number={3} title="Clone Repository">
            <p>Clone the worker repository.</p>
            <CodeBlock code="git clone https://github.com/ashishexee/peerhost.git
cd peerhost/apps/worker" />
          </Step>

          <Step number={4} title="Setup Environment">
            <p>Create your .env file.</p>
            <CodeBlock code="nano .env" />
            <p className="mt-2 mb-2">Paste your configuration:</p>
            <CodeBlock code="GATEWAY_URL=https://gateway.peerhost.net
RPC_URL=https://polygon-rpc.com
PRIVATE_KEY=your_wallet_private_key
IPFS_GATEWAY=https://ipfs.io/ipfs/" />
            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-sm text-blue-200 mt-4">
              <strong>Nano Tips:</strong><br />
              Save: <code className="bg-black/30 px-1 rounded">CTRL + O</code> then <code className="bg-black/30 px-1 rounded">ENTER</code><br />
              Exit: <code className="bg-black/30 px-1 rounded">CTRL + X</code>
            </div>
          </Step>

          <Step number={5} title="Run Worker">
            <p>Install dependencies and start the node.</p>
            <CodeBlock code="npm install
node src/index.js" />
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-lg text-sm text-yellow-200 mt-4">
              ⚠️ <strong>Limitations:</strong><br />
              • Process stops if Termux is closed (use Termux:Boot for background).<br />
              • Heavy native modules might fail to build.<br />
              • Battery drain will be higher than usual.
            </div>
          </Step>

        </div>
      </div>
    </div>
  );
}
