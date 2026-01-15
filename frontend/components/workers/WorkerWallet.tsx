import React, { useState, useEffect } from 'react';
import { Wallet, Shield, DollarSign, Download, Copy, Check, AlertTriangle, Loader2, ExternalLink, Server } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkerContract } from '../../hooks/useWorkerContract';
import { generateBurnerWallet, downloadCredentials, formatAddress, formatPOL, parsePOL, type BurnerWallet } from '../../utils/workerWallet';
import { ethers } from 'ethers';

interface WorkerInfo {
    address: string;
    stakedAmount: string;
    isBlacklisted: boolean;
    probationCount: string;
}

export default function WorkerWallet() {
    const [connectedAddress, setConnectedAddress] = useState<string | null>(null);
    const [burnerWallet, setBurnerWallet] = useState<BurnerWallet | null>(null);
    const [isRegistered, setIsRegistered] = useState(false);
    const [stakeAmount, setStakeAmount] = useState('2');
    const [userWorkers, setUserWorkers] = useState<WorkerInfo[]>([]);
    const [copied, setCopied] = useState<string | null>(null);
    const [showPrivateKey, setShowPrivateKey] = useState(false);

    const {
        registerWorker,
        stakeForWorker,
        getUserWorkers,
        getWorkerStakeInfo,
        withdrawStake,
        isLoading,
        error,
        clearError
    } = useWorkerContract();
    const handleWithdraw = (workerAddress: string, amount: string) => {
        toast.warning('Withdraw Stake?', {
            description: `This will withdraw ${amount} POL. If stake drops below 2 POL, the worker will be deactivated.`,
            action: {
                label: 'Confirm',
                onClick: async () => {
                    try {
                        const txHash = await withdrawStake(workerAddress, amount);
                        toast.success(`Withdrawal Initiated! Tx: ${txHash.slice(0, 10)}...`);
                        await loadWorkers();
                    } catch (err: any) {
                        toast.error(err.message || 'Failed to withdraw');
                    }
                }
            },
            cancel: {
                label: 'Cancel',
            },
            duration: 8000,
        });
    };
    const connectWallet = async () => {
        if (!window.ethereum) {
            toast.error('Please install MetaMask to continue');
            return;
        }

        try {
            const provider = new ethers.BrowserProvider(window.ethereum);
            const accounts = await provider.send('eth_requestAccounts', []);
            setConnectedAddress(accounts[0]);
            toast.success('Wallet connected!');
        } catch (err) {
            toast.error('Failed to connect wallet');
            console.error(err);
        }
    };

    const loadWorkers = async () => {
        if (!connectedAddress) return;

        try {
            const workers = await getUserWorkers(connectedAddress);
            const workersInfo = await Promise.all(
                workers.map(async (addr) => {
                    const info = await getWorkerStakeInfo(addr);
                    return {
                        address: addr,
                        stakedAmount: formatPOL(info.stakedAmount),
                        isBlacklisted: info.isBlacklisted,
                        probationCount: info.probationCount.toString()
                    };
                })
            );
            setUserWorkers(workersInfo);
        } catch (err) {
            console.error('Failed to load workers:', err);
        }
    };

    useEffect(() => {
        if (connectedAddress) {
            loadWorkers();
        }
    }, [connectedAddress]);

    // Generate burner wallet
    const handleGenerateWallet = () => {
        const wallet = generateBurnerWallet();
        setBurnerWallet(wallet);
        setIsRegistered(false);
        toast.success('Worker wallet generated!');
    };

    const handleRegisterWorker = async () => {
        if (!burnerWallet) return;

        try {
            const txHash = await registerWorker(burnerWallet.address);
            setIsRegistered(true);
            toast.success(`Worker registered! Tx: ${txHash.slice(0, 10)}...`);
        } catch (err) {
            toast.error(error || 'Failed to register worker');
        }
    };

    const handleStake = async () => {
        if (!burnerWallet) return;

        const amount = parseFloat(stakeAmount);
        if (amount < 2) {
            toast.error('Minimum stake is 2 POL');
            return;
        }

        try {
            const txHash = await stakeForWorker(burnerWallet.address, stakeAmount);
            toast.success(`Staked ${stakeAmount} POL! Tx: ${txHash.slice(0, 10)}...`);
            await loadWorkers();
            setBurnerWallet(null);
            setIsRegistered(false);
        } catch (err) {
            toast.error(error || 'Failed to stake');
        }
    };

    const copyToClipboard = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        setCopied(label);
        toast.success(`${label} copied!`);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleDownload = () => {
        if (burnerWallet) {
            downloadCredentials(burnerWallet);
            toast.success('Credentials downloaded!');
        }
    };

    if (!connectedAddress) {
        return (
            <div className="min-h-screen bg-black text-white relative overflow-hidden flex flex-col items-center justify-center">
                {/* Background Gradients */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none" />

                <div className="max-w-3xl mx-auto text-center relative z-10 px-6">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-300 text-xs font-medium tracking-wider mb-8 backdrop-blur-md">
                        <Shield className="w-3 h-3" />
                        WORKER REGISTRATION
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-tight">
                        Power the Network. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-400 via-white to-gray-400">
                            Earn Rewards.
                        </span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        Join the decentralized execution layer. Generate a burner wallet, stake POL, and start processing verified requests instantly.
                    </p>

                    <button
                        onClick={connectWallet}
                        className="group relative inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-b from-white to-gray-200 text-black rounded-xl font-bold text-lg tracking-wide shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300"
                    >
                        <Wallet className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                        Connect Wallet
                        <div className="absolute inset-0 rounded-xl ring-2 ring-white/50 group-hover:ring-white/80 transition-all opacity-0 group-hover:opacity-100" />
                    </button>
                    <div className="mt-16 grid grid-cols-3 gap-8 border-t border-white/10 pt-8 max-w-lg mx-auto">
                        <div>
                            <div className="text-2xl font-bold text-white">2.0 POL</div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Min Stake</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">~50ms</div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Latency</div>
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">100%</div>
                            <div className="text-xs text-gray-500 uppercase tracking-widest mt-1">Uptime</div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white relative overflow-hidden pt-24 pb-20 px-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-900/10 blur-[120px] rounded-full pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 blur-[100px] rounded-full pointer-events-none" />

            <div className="max-w-5xl mx-auto relative z-10">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-gray-300 text-xs font-medium tracking-wider mb-6 backdrop-blur-md">
                        <Shield className="w-3 h-3" />
                        WORKER DASHBOARD
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-4 tracking-tight">
                        Configure Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Node</span>
                    </h1>
                    <p className="text-gray-400 font-mono text-sm">
                        Connected: <span className="text-white bg-white/10 px-2 py-1 rounded">{formatAddress(connectedAddress)}</span>
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column: Actions (Steps) */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* Step 1: Generate Burner Wallet */}
                        <div className={`relative group transition-all duration-300 ${!burnerWallet ? 'opacity-100' : 'opacity-80 hover:opacity-100'}`}>
                            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm overflow-hidden">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/20">
                                        1
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Generate Identity</h2>
                                        <p className="text-sm text-gray-400">Create a secure signer for your node.</p>
                                    </div>
                                </div>

                                {!burnerWallet ? (
                                    <button
                                        onClick={handleGenerateWallet}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Wallet className="w-5 h-5" />
                                        Generate Burner Wallet
                                    </button>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                        <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-xl flex items-start gap-3">
                                            <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5 shrink-0" />
                                            <div className="text-sm text-yellow-200/90">
                                                <strong>Save Keys:</strong> You will only see these once.
                                            </div>
                                        </div>

                                        <div className="bg-black/40 border border-white/5 rounded-xl p-5 space-y-4">
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1.5">Address</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-white font-mono text-sm break-all">{burnerWallet.address}</code>
                                                    <button onClick={() => copyToClipboard(burnerWallet.address, 'Address')} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white shrink-0"><Copy className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="text-xs text-gray-500 uppercase font-bold tracking-wider block mb-1.5">Private Key</label>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-white font-mono text-sm break-all">{showPrivateKey ? burnerWallet.privateKey : '••••••••••••••••••••••••••••••'}</code>
                                                    <button onClick={() => setShowPrivateKey(!showPrivateKey)} className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors shrink-0">{showPrivateKey ? 'Hide' : 'Show'}</button>
                                                    <button onClick={() => copyToClipboard(burnerWallet.privateKey, 'Private Key')} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white shrink-0"><Copy className="w-4 h-4" /></button>
                                                </div>
                                            </div>
                                        </div>

                                        <button onClick={handleDownload} className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-semibold transition-colors flex items-center justify-center gap-2">
                                            <Download className="w-4 h-4" /> Download Credentials
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Step 2: Register On-Chain */}
                        <div className={`transition-all duration-300 ${!burnerWallet ? 'opacity-50 blur-[2px] pointer-events-none' : 'opacity-100'}`}>
                            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-purple-500/20">
                                        2
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Register Node</h2>
                                        <p className="text-sm text-gray-400">Link identity to Execution Contract.</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleRegisterWorker}
                                    disabled={isLoading || isRegistered}
                                    className={`w-full py-4 rounded-xl font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${isRegistered
                                        ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                                        : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-500 hover:to-purple-400 text-white shadow-purple-500/20'
                                        }`}
                                >
                                    {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : isRegistered ? <Check className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
                                    {isRegistered ? 'Node Registered' : 'Register On-Chain'}
                                </button>
                            </div>
                        </div>

                        {/* Step 3: Stake */}
                        <div className={`transition-all duration-300 ${!isRegistered ? 'opacity-50 blur-[2px] pointer-events-none' : 'opacity-100'}`}>
                            <div className="relative bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-700 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-green-500/20">
                                        3
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Stake & Activate</h2>
                                        <p className="text-sm text-gray-400">Lock POL to enable job processing.</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={stakeAmount}
                                            onChange={(e) => setStakeAmount(e.target.value)}
                                            className="w-full pl-12 pr-4 py-4 bg-black/40 border border-white/10 rounded-xl text-white text-lg font-mono focus:outline-none focus:border-green-500/50 transition-colors"
                                        />
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">POL</span>
                                    </div>
                                    <button
                                        onClick={handleStake}
                                        disabled={isLoading}
                                        className="w-full py-4 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <DollarSign className="w-5 h-5" />}
                                        Initialize Stake
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Active Workers & Info */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Status Card */}
                        <div className="bg-gradient-to-br from-gray-900 to-black border border-white/10 rounded-2xl p-6 backdrop-blur-md">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Server className="w-4 h-4 text-blue-400" /> Active Nodes
                            </h3>

                            {userWorkers.length === 0 ? (
                                <div className="text-center py-12 text-gray-500">
                                    <Server className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                    <p>No active workers found.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {userWorkers.map((worker) => (
                                        <div key={worker.address} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <code className="text-white/80 font-mono text-xs bg-black/50 px-2 py-1 rounded">{formatAddress(worker.address)}</code>
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${worker.isBlacklisted ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                                    {worker.isBlacklisted ? 'Banned' : 'Active'}
                                                </span>
                                            </div>
                                            <div className="flex items-end justify-between">
                                                <div>
                                                    <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Staked Balance</div>
                                                    <div className="text-xl font-bold text-white font-mono">{worker.stakedAmount} <span className="text-sm text-gray-500">POL</span></div>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <button
                                                        onClick={() => window.open(`https://amoy.polygonscan.com/address/${worker.address}`, '_blank')}
                                                        className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                                                        title="View on Explorer"
                                                    >
                                                        <ExternalLink className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleWithdraw(worker.address, worker.stakedAmount)}
                                                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 hover:text-red-300 text-xs font-bold uppercase tracking-wide transition-colors"
                                                    >
                                                        <DollarSign className="w-3 h-3" />
                                                        Withdraw Stake
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Info Card */}
                        <div className="bg-blue-900/10 border border-blue-500/10 rounded-2xl p-6">
                            <h4 className="text-blue-300 font-bold mb-2 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" /> Requirement
                            </h4>
                            <p className="text-sm text-blue-200/60 leading-relaxed">
                                Workers must maintain a minimum stake of <strong>2.0 POL</strong>. Processing latency should be under 200ms for optimal rewards. Gas fees for result submission are reimbursed + profit.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Error Toast */}
                {error && (
                    <div className="fixed bottom-6 right-6 bg-red-900/90 border border-red-500/50 text-white px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl animate-in fade-in slide-in-from-bottom-10">
                        <div className="font-bold mb-1">Error Occurred</div>
                        <div className="text-sm opacity-80">{error}</div>
                    </div>
                )}
            </div>
        </div>
    );
}
