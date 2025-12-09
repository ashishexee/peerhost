import React, { useState } from 'react';
import { Play, Plus, Trash2, Loader2, AlertCircle, CheckCircle2, DollarSign, Copy, Check } from 'lucide-react';
import { useWallet } from '../context/WalletContext';
import { BrowserProvider, parseUnits } from 'ethers';
import { toast } from 'sonner';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface Header {
    key: string;
    value: string;
}

export default function ApiTester() {
    const { address, isConnected } = useWallet();

    // Request State
    const [method, setMethod] = useState<Method>('GET');
    const [url, setUrl] = useState('');
    const [headers, setHeaders] = useState<Header[]>([{ key: '', value: '' }]);
    const [body, setBody] = useState('');
    const [activeTab, setActiveTab] = useState<'params' | 'headers' | 'body'>('body');

    // Response State
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<{
        status: number;
        statusText: string;
        data: any;
        headers: any;
        time: number;
    } | null>(null);

    // Payment State
    const [paymentRequired, setPaymentRequired] = useState<{
        amount: string;
        currency: string;
        receiver: string;
        network: string;
        description?: string;
    } | null>(null);
    const [paying, setPaying] = useState(false);
    const [activePaymentToken, setActivePaymentToken] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);

    // Helpers
    const copyToClipboard = (text: string, id: string) => {
        navigator.clipboard.writeText(text);
        setCopied(id);
        toast.success("Copied to clipboard");
        setUrl(text); // Also auto-fill for convenience
        setTimeout(() => setCopied(null), 2000);
    };
    const addHeader = () => setHeaders([...headers, { key: '', value: '' }]);
    const removeHeader = (index: number) => setHeaders(headers.filter((_, i) => i !== index));
    const updateHeader = (index: number, field: 'key' | 'value', value: string) => {
        const newHeaders = [...headers];
        newHeaders[index][field] = value;
        setHeaders(newHeaders);
    };

    const handleSend = async (bypassPayment = false, overrideToken?: string) => {
        if (!url) {
            toast.error("Please enter a URL");
            return;
        }

        setLoading(true);
        setResponse(null);

        // Strict Reset: Always clear payment state if this is a fresh request (not a retry)
        // This ensures every "Send" click starts fresh and checks for 402
        if (!bypassPayment) {
            setPaymentRequired(null);
            setActivePaymentToken(null);
        }

        const startTime = performance.now();

        try {
            const reqHeaders: Record<string, string> = {};
            headers.forEach(h => {
                if (h.key) reqHeaders[h.key] = h.value;
            });

            // If we just paid (or are retrying), add the proof header
            // Priority: Override Token -> Active Token -> Null
            const tokenToUse = overrideToken || (bypassPayment ? activePaymentToken : null);

            if (tokenToUse) {
                reqHeaders['x-payment'] = tokenToUse;
            }

            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    ...reqHeaders
                },
                body: ['GET', 'HEAD'].includes(method) ? undefined : (body || undefined),
            });

            const endTime = performance.now();
            const time = Math.round(endTime - startTime);

            // Handle 402
            if (res.status === 402) {
                const authHeader = res.headers.get('WWW-Authenticate');
                if (authHeader && authHeader.includes('x402')) {
                    // Start parsing x402 params
                    try {
                        const tokenMatch = authHeader.match(/token="([^"]+)"/);
                        if (tokenMatch) {
                            const tokenJson = atob(tokenMatch[1]);
                            const token = JSON.parse(tokenJson);

                            setPaymentRequired({
                                amount: token.amount, // Likely string or number
                                currency: token.currency,
                                receiver: token.receiver,
                                network: token.network
                            });

                            // Don't show generic response for 402, show specific payment UI
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.error("Failed to parse x402 header", e);
                    }
                }
            }

            // Normal Response
            let data;
            const contentType = res.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await res.json();
            } else {
                data = await res.text();
            }

            setResponse({
                status: res.status,
                statusText: res.statusText,
                data,
                headers: Object.fromEntries(res.headers.entries()),
                time
            });

        } catch (err: any) {
            toast.error("Request Failed: " + err.message);
            setResponse({
                status: 0,
                statusText: "Error",
                data: err.message,
                headers: {},
                time: 0
            });
        } finally {
            setLoading(false);
        }
    };

    const handlePayment = async () => {
        if (!paymentRequired || !address) return;
        setPaying(true);

        try {
            if (!window.ethereum) throw new Error("No wallet found");

            const provider = new BrowserProvider(window.ethereum);
            const signer = await provider.getSigner();

            // Send Transaction
            // Note: Using explicit high gas limit (500k) to prevent "Internal JSON-RPC error" 
            // which often happens on Amoy testnet or with complex contract interactions.
            const txt = await signer.sendTransaction({
                to: paymentRequired.receiver,
                value: 0,
                gasLimit: 500000
            });

            await txt.wait();

            // Create Proof
            const proof = {
                payer: address,
                txHash: txt.hash,
                amount: paymentRequired.amount,
                currency: paymentRequired.currency
            };

            const proofHeader = btoa(JSON.stringify(proof));
            setActivePaymentToken(proofHeader);
            setPaymentRequired(null);

            // Auto Retry
            // Pass the fresh token directly to handleSend to avoid stale state issues
            toast.success("Payment confirmed! Retrying request...");
            setTimeout(() => handleSend(true, proofHeader), 1000);

        } catch (err: any) {
            console.error(err);
            if (err.code === "INSUFFICIENT_FUNDS" || err.message?.includes("insufficient funds")) {
                toast.error("Insufficient MATIC for gas fees on Polygon Amoy.");
            } else if (err.code === 4001 || err.message?.includes("user rejected")) {
                toast.error("Transaction rejected by user.");
            } else {
                toast.error("Payment failed: " + (err.reason || err.message || "Unknown Error"));
            }
        } finally {
            setPaying(false);
        }
    };

    return (
        <div className="space-y-8 max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-600">
                API Tester
            </h1>

            {/* Quick Start Examples */}
            <div className="bg-[#1A1B23] border border-white/10 rounded-xl p-4">
                <h3 className="text-gray-400 text-xs font-medium mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Play size={14} /> Quick Start Endpoints
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Free Endpoint */}
                    <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                        <span className="text-[10px] font-bold text-green-400 px-2 py-0.5 bg-green-500/10 rounded uppercase tracking-wider border border-green-500/20">Free</span>
                        <span className="flex-1 text-xs text-gray-300 font-mono truncate" title="https://peerhost-jl8u.vercel.app/run/0xda684a91a506f3e303834c97784dee2b31bbc6bc/peerhostfree/hello">
                            .../peerhostfree/hello
                        </span>
                        <button
                            onClick={() => copyToClipboard('https://peerhost-jl8u.vercel.app/run/0xda684a91a506f3e303834c97784dee2b31bbc6bc/peerhostfree/hello', 'free')}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-all"
                            title="Copy & Use"
                        >
                            {copied === 'free' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                    </div>

                    {/* Paid Endpoint */}
                    <div className="flex items-center gap-3 bg-black/20 p-2.5 rounded-lg border border-white/5 group hover:border-white/10 transition-colors">
                        <span className="text-[10px] font-bold text-yellow-400 px-2 py-0.5 bg-yellow-500/10 rounded uppercase tracking-wider border border-yellow-500/20">Paid</span>
                        <span className="flex-1 text-xs text-gray-300 font-mono truncate" title="https://peerhost-jl8u.vercel.app/run/0xda684a91a506f3e303834c97784dee2b31bbc6bc/peerhostefjb/hello">
                            .../peerhostefjb/hello
                        </span>
                        <button
                            onClick={() => copyToClipboard('https://peerhost-jl8u.vercel.app/run/0xda684a91a506f3e303834c97784dee2b31bbc6bc/peerhostefjb/hello', 'paid')}
                            className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 rounded-md transition-all"
                            title="Copy & Use"
                        >
                            {copied === 'paid' ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Request Builder */}
            <div className="bg-[#1A1B23] border border-white/10 rounded-xl p-6 space-y-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value as Method)}
                        className="bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors w-full md:w-32"
                    >
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                        <option>PATCH</option>
                    </select>
                    <input
                        type="text"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://api.peerhost.com/..."
                        className="flex-1 bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white font-mono focus:outline-none focus:border-purple-500 transition-colors"
                    />
                    <button
                        onClick={() => handleSend(false)}
                        disabled={loading}
                        className="bg-white/5 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-medium transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 border border-white/10"
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
                        Send Request
                    </button>
                </div>

                {/* Tabs */}
                <div>
                    <div className="border-b border-white/10 flex gap-6 mb-4">
                        {['body', 'headers'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab as any)}
                                className={`pb-2 text-sm font-medium transition-colors ${activeTab === tab ? 'text-purple-400 border-b-2 border-purple-400' : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                            </button>
                        ))}
                    </div>

                    <div className="min-h-[150px]">
                        {activeTab === 'headers' && (
                            <div className="space-y-3">
                                {headers.map((header, idx) => (
                                    <div key={idx} className="flex gap-3">
                                        <input
                                            placeholder="Key"
                                            value={header.key}
                                            onChange={(e) => updateHeader(idx, 'key', e.target.value)}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                                        />
                                        <input
                                            placeholder="Value"
                                            value={header.value}
                                            onChange={(e) => updateHeader(idx, 'value', e.target.value)}
                                            className="flex-1 bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-sm text-white font-mono focus:border-purple-500 focus:outline-none"
                                        />
                                        <button
                                            onClick={() => removeHeader(idx)}
                                            className="p-2 text-gray-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                <button
                                    onClick={addHeader}
                                    className="text-sm text-purple-400 hover:text-purple-300 flex items-center gap-1 mt-2 font-medium"
                                >
                                    <Plus size={14} /> Add Header
                                </button>
                            </div>
                        )}

                        {activeTab === 'body' && (
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                placeholder='{"key": "value"}'
                                className="w-full h-48 bg-black/20 border border-white/10 rounded-xl p-4 text-sm text-white font-mono focus:outline-none focus:border-purple-500 resize-none transition-colors"
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Response Section */}
            {paymentRequired ? (
                <div className="bg-[#1A1B23] border border-yellow-500/30 rounded-xl p-8 flex flex-col items-center text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 shadow-lg shadow-yellow-900/10">
                    <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center text-yellow-500 ring-1 ring-yellow-500/30">
                        <DollarSign size={32} />
                    </div>

                    <div className="max-w-md">
                        <h3 className="text-2xl font-bold text-white mb-2">Payment Required</h3>
                        <p className="text-gray-400">This API endpoint requires a micropayment to process your request.</p>
                    </div>

                    <div className="bg-black/20 rounded-xl p-6 w-full max-w-sm border border-white/10 space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-500 text-sm">Cost</span>
                            <span className="text-white font-bold text-lg">{paymentRequired.amount} USDC</span>
                        </div>
                        <div className="h-px bg-white/5 my-2" />
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Receiver</span>
                            <span className="text-purple-300 font-mono bg-purple-500/10 px-2 py-0.5 rounded">
                                {paymentRequired.receiver.slice(0, 6)}...{paymentRequired.receiver.slice(-4)}
                            </span>
                        </div>
                    </div>

                    <button
                        onClick={handlePayment}
                        disabled={paying}
                        className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold px-10 py-3 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 flex items-center gap-2 shadow-lg shadow-yellow-500/20"
                    >
                        {paying ? <Loader2 className="animate-spin" /> : "Unlock Access"}
                    </button>

                    <p className="text-xs text-gray-600">
                        A MetaMask transaction will be triggered to confirm payment.
                    </p>
                </div>
            ) : response && (
                <div className="bg-[#1A1B23] border border-white/10 rounded-xl overflow-hidden shadow-xl">
                    <div className="bg-white/5 p-4 border-b border-white/10 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 rounded text-xs font-bold ${response.status >= 200 && response.status < 300 ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                                {response.status}
                            </span>
                            <span className="text-gray-300 font-mono text-xs">{response.statusText}</span>
                        </div>
                        <span className="text-gray-500 text-xs font-mono">{response.time}ms</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/10">
                        <div className="md:col-span-2 p-0">
                            <div className="px-4 py-2 border-b border-white/10 bg-white/5 text-xs text-gray-500 font-medium uppercase tracking-wider">
                                Response Body
                            </div>
                            <pre className="p-4 text-xs text-blue-300 overflow-x-auto whitespace-pre-wrap max-h-[500px] overflow-y-auto font-mono leading-relaxed bg-black/20">
                                {typeof response.data === 'object'
                                    ? JSON.stringify(response.data, null, 2)
                                    : String(response.data)}
                            </pre>
                        </div>
                        <div className="md:col-span-1 border-l border-white/10">
                            <div className="px-4 py-2 border-b border-white/10 bg-white/5 text-xs text-gray-500 font-medium uppercase tracking-wider">
                                Headers
                            </div>
                            <div className="max-h-[500px] overflow-y-auto">
                                {Object.entries(response.headers).map(([k, v]) => (
                                    <div key={k} className="p-3 border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <div className="text-gray-500 text-xs mb-1">{k}</div>
                                        <div className="text-gray-300 text-xs font-mono break-all">{String(v)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
