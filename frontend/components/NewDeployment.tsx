import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Github, Folder, ArrowRight, Loader2, Play, Trash2, Plus, FileCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function NewDeployment() {
    const { address } = useWallet();
    const navigate = useNavigate();
    const [githubUser, setGithubUser] = useState('');
    const [repos, setRepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [deploying, setDeploying] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<any>(null);

    // Env Vars State
    const [envVars, setEnvVars] = useState<{ key: string, value: string }[]>([{ key: '', value: '' }]);

    const addEnvVar = () => setEnvVars([...envVars, { key: '', value: '' }]);
    const removeEnvVar = (index: number) => setEnvVars(envVars.filter((_, i) => i !== index));
    const updateEnvVar = (index: number, field: 'key' | 'value', value: string) => {
        const newVars = [...envVars];
        newVars[index][field] = value;
        setEnvVars(newVars);
    };

    // Monetization State
    const [isMonetized, setIsMonetized] = useState(false);
    const [price, setPrice] = useState('');
    const [beneficiary, setBeneficiary] = useState('');

    // Sync beneficiary with wallet address if not set
    React.useEffect(() => {
        if (address && !beneficiary) {
            setBeneficiary(address);
        }
    }, [address]);

    // OAuth State
    const [gitToken, setGitToken] = useState<string | null>(localStorage.getItem('git_token'));

    // Auto-set token from storage on mount
    React.useEffect(() => {
        // Token logic handled by AuthCallback, but we double-check here
        const t = localStorage.getItem('git_token');
        if (t) setGitToken(t);
    }, []);

    const fetchRepos = async () => {
        setLoading(true);
        try {
            let url = `https://api.github.com/users/${githubUser}/repos?sort=updated`;
            let headers: Record<string, string> = {};

            const token = gitToken || localStorage.getItem('git_token');

            if (token) {
                url = `https://api.github.com/user/repos?sort=updated&type=all`;
                headers['Authorization'] = `token ${token}`;
            } else if (!githubUser) {
                return;
            }

            const res = await fetch(url, { headers });
            const data = await res.json();

            if (Array.isArray(data)) {
                setRepos(data);
                if (token && data.length > 0 && !githubUser) {
                    setGithubUser(data[0].owner.login);
                }
            } else {
                console.error("Repo fetch failed", data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    React.useEffect(() => {
        if (gitToken) fetchRepos();
    }, [gitToken]);

    const handleDisconnectGitHub = () => {
        localStorage.removeItem('git_token');
        setGitToken(null);
        setGithubUser('');
        setRepos([]);
        setSelectedRepo(null);
        toast.success("Disconnected from GitHub");
    };

    const handleConnectGitHub = () => {
        window.location.href = 'https://peerhost-jl8u.vercel.app/auth/github/login';
    };

    const handlePublicRepo = async () => {
        const urlInput = (document.getElementById('public-repo-url') as HTMLInputElement).value;
        if (!urlInput) return toast.error("Please enter a URL");

        const toastId = toast.loading("Validating repository...");
        try {
            const url = new URL(urlInput);
            const pathParts = url.pathname.split('/').filter(Boolean);
            if (pathParts.length < 2) throw new Error("Invalid GitHub URL");

            const owner = pathParts[0];
            const name = pathParts[1];
            const apiUrl = `https://api.github.com/repos/${owner}/${name}`;

            const headers: Record<string, string> = {};
            const token = gitToken || localStorage.getItem('git_token');
            if (token) headers['Authorization'] = `token ${token}`;

            const res = await fetch(apiUrl, { headers });
            if (!res.ok) throw new Error("Repository not found or private");

            const repoData = await res.json();
            setSelectedRepo(repoData);
            toast.success("Repository connected!", { id: toastId });

            // Clear input
            (document.getElementById('public-repo-url') as HTMLInputElement).value = '';

        } catch (e: any) {
            toast.error(e.message || "Invalid GitHub URL", { id: toastId });
        }
    };

    const handleScanEndpoints = async () => {
        const baseDirInput = (document.getElementById('base-dir') as HTMLInputElement).value.replace(/^\/|\/$/g, '');
        if (!selectedRepo) return;

        const toastId = toast.loading("Scanning repository recursively...");
        try {
            // Use Git Tree API for recursive scan
            const branch = selectedRepo.default_branch || 'main';
            const treeUrl = `${selectedRepo.url}/git/trees/${branch}?recursive=1`;

            const headers: Record<string, string> = {};
            const token = gitToken || localStorage.getItem('git_token');
            if (token) headers['Authorization'] = `token ${token}`;

            const res = await fetch(treeUrl, { headers });

            if (!res.ok) {
                if (res.status === 404) throw new Error(`Branch '${branch}' not found`);
                if (res.status === 403) throw new Error("Access denied (Check GitHub connection)");
                throw new Error("Failed to scan repository");
            }

            const data = await res.json();

            if (data.tree && Array.isArray(data.tree)) {
                const jsFiles = data.tree
                    .filter((f: any) => {
                        // Must be a blob (file) and end with .js
                        if (f.type !== 'blob' || !f.path.endsWith('.js')) return false;

                        // If baseDir is specified (and not dot), file must start with it
                        if (baseDirInput && baseDirInput !== '.') {
                            return f.path.startsWith(baseDirInput + '/');
                        }
                        return true;
                    })
                    .map((f: any) => {
                        // Strip baseDir from path for the input field
                        if (baseDirInput && baseDirInput !== '.') {
                            return f.path.substring(baseDirInput.length + 1);
                        }
                        return f.path;
                    });

                if (jsFiles.length > 0) {
                    (document.getElementById('fn-entry') as HTMLInputElement).value = jsFiles.join(', ');
                    toast.success(`Found ${jsFiles.length} functions!`, { id: toastId });
                } else {
                    toast.warning(`No .js files found in '${baseDirInput}'`, { id: toastId });
                }
            } else {
                toast.error("Unexpected response from GitHub", { id: toastId });
            }
        } catch (e: any) {
            console.error(e);
            toast.error(e.message, { id: toastId });
        } finally {
            // Dismiss loading if not already handled
            setTimeout(() => toast.dismiss(toastId), 3000);
        }
    };

    const handleDeploy = async () => {
        const fnInput = (document.getElementById('fn-entry') as HTMLInputElement).value;
        const baseDir = (document.getElementById('base-dir') as HTMLInputElement).value;
        const projectName = (document.getElementById('project-name') as HTMLInputElement).value;

        // Convert comma-separated string to array
        const functionNames = fnInput.split(',').map(s => s.trim()).filter(s => s.length > 0);

        if (functionNames.length === 0) return toast.error("Please specify at least one file");
        if (!projectName) return toast.error("Project Name is required");

        if (!address) return toast.error("Please Connect Wallet First");

        const cleanEnvVars = envVars.reduce((acc, curr) => {
            if (curr.key.trim()) acc[curr.key.trim()] = curr.value;
            return acc;
        }, {} as Record<string, string>);

        setDeploying(true);
        const toastId = toast.loading("Deploying to PeerHost Network...");

        try {
            const res = await fetch('https://peerhost-jl8u.vercel.app/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    wallet: address,
                    repoUrl: selectedRepo.clone_url,
                    projectName: projectName,
                    functionName: functionNames,
                    baseDir: baseDir,
                    envVars: cleanEnvVars,
                    gitToken: gitToken,
                    // x402 Metadata
                    monetization: isMonetized ? {
                        price: price || '0',
                        beneficiary: beneficiary || address
                    } : null
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Deployment Successful!", { id: toastId });

                // Base URL Display
                const baseUrl = `https://peerhost-jl8u.vercel.app/run/${address}/${projectName}/`;

                toast.custom((t) => (
                    <div className="bg-[#111] border border-white/10 p-4 rounded-lg shadow-xl text-white min-w-[300px]">
                        <h3 className="font-bold text-green-400 mb-1">Deployment Complete!</h3>
                        <p className="text-xs text-gray-400 mb-3">Your service is live at:</p>
                        <div className="bg-black/50 p-2 rounded text-xs font-mono text-blue-300 break-all mb-3 border border-white/5 flex items-center justify-between gap-2">
                            <span>{baseUrl}</span>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(baseUrl);
                                    toast.success("Copied!");
                                }}
                                className="text-gray-400 hover:text-white p-1"
                                title="Copy URL"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                            </button>
                        </div>

                        <div className="text-sm space-y-1 text-gray-400 max-h-40 overflow-y-auto">
                            {data.results && data.results.map((r: any) => (
                                <div key={r.function} className="flex justify-between items-center border-b border-white/5 py-1">
                                    <span>{r.function}</span>
                                    {r.success ? (
                                        <a href={r.url} target="_blank" rel="noreferrer" className="text-xs bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white transition-colors">
                                            Open
                                        </a>
                                    ) : (
                                        <span className="text-red-400 text-xs">Failed</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ), { duration: 6000 }); // Auto-dismiss after 6 seconds

                navigate('/deploy');
            } else {
                toast.error("Deployment failed: " + (data.error || "Unknown Error"), { id: toastId });
            }
        } catch (e: any) {
            toast.error("Network Error: " + e.message, { id: toastId });
        } finally {
            setDeploying(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold text-white mb-8">Deploy New Service</h1>
            {!selectedRepo ? (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8">
                    <h2 className="text-xl font-semibold text-white mb-4">1. Connect Code Repository</h2>
                    <p className="text-gray-400 mb-6">Connect your GitHub account to access private repositories.</p>

                    <div className="flex gap-4 mb-8">
                        {!gitToken && !githubUser ? (
                            <button
                                onClick={handleConnectGitHub}
                                className="bg-[#24292e] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#2f363d] flex items-center gap-2 transition-colors"
                            >
                                <Github className="w-5 h-5" />
                                Connect GitHub
                            </button>
                        ) : (
                            <div className="flex gap-4 w-full">
                                <div className="flex items-center gap-2 bg-white/10 px-4 rounded-lg text-white">
                                    <Github className="w-4 h-4" />
                                    {githubUser || 'Connected'}
                                </div>
                                <button
                                    onClick={fetchRepos}
                                    disabled={loading}
                                    className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                                    Fetch Repos
                                </button>
                                <button
                                    onClick={handleDisconnectGitHub}
                                    className="bg-red-500/10 text-red-400 px-4 py-3 rounded-lg font-bold hover:bg-red-500/20 border border-red-500/20 flex items-center gap-2"
                                    title="Disconnect GitHub"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="border-b border-white/5 pb-6 mb-6">
                        <p className="text-gray-400 text-sm mb-3">Or paste a public repository URL:</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                id="public-repo-url"
                                placeholder="https://github.com/username/repo"
                                className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-white/30"
                            />
                            <button
                                onClick={handlePublicRepo}
                                className="bg-white/10 text-white px-4 py-2 rounded-lg font-bold hover:bg-white/20 transition-colors"
                            >
                                Use Public Repo
                            </button>
                        </div>
                    </div>

                    {repos.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {repos.map(repo => (
                                <div
                                    key={repo.id}
                                    onClick={() => setSelectedRepo(repo)}
                                    className="bg-white/5 border border-white/5 p-4 rounded-lg cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all flex items-center gap-3"
                                >
                                    <Folder className="w-5 h-5 text-gray-400" />
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-white font-medium truncate">{repo.name}</h3>
                                        <p className="text-xs text-gray-500 truncate">{repo.full_name}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-gray-500" />
                                </div>
                            ))}
                        </div>
                    )}


                </div>
            ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 animate-in fade-in slide-in-from-bottom-4">
                    <button
                        onClick={() => setSelectedRepo(null)}
                        className="text-sm text-gray-400 hover:text-white mb-6 flex items-center gap-1"
                    >
                        ← Back to Repos
                    </button>

                    <div className="flex items-center gap-4 mb-8 pb-8 border-b border-white/10">
                        <Github className="w-10 h-10 text-white" />
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedRepo.name}</h2>
                            <p className="text-gray-400">{selectedRepo.clone_url}</p>
                        </div>
                    </div>
                    <div className="mb-8 p-6 bg-purple-900/10 rounded-xl border border-purple-500/20">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                    Monetization (x402)
                                    <span className="text-xs font-normal text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">Agentic Payments</span>
                                </h3>
                                <p className="text-sm text-gray-400 mt-1">Charge AI agents to use this function.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="monetization-toggle"
                                    className="sr-only peer"
                                    checked={isMonetized}
                                    onChange={(e) => setIsMonetized(e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                            </label>
                        </div>

                        {isMonetized && (
                            <div id="monetization-inputs" className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-purple-300 mb-1">Price per Execution (USDC)</label>
                                        <input
                                            type="number"
                                            id="price-input"
                                            step="0.0001"
                                            placeholder="0.01"
                                            value={price}
                                            onChange={(e) => setPrice(e.target.value)}
                                            className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-purple-300 mb-1">Beneficiary Address</label>
                                        <input
                                            type="text"
                                            id="beneficiary-input"
                                            value={beneficiary}
                                            onChange={(e) => setBeneficiary(e.target.value)}
                                            placeholder="0x..."
                                            className="w-full bg-black/50 border border-purple-500/30 rounded-lg px-4 py-2 text-white outline-none focus:border-purple-500 font-mono text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">Project Name</label>
                            <input
                                type="text"
                                id="project-name"
                                defaultValue={selectedRepo.name}
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-white/30"
                            />
                            <p className="text-xs text-gray-500 mt-2">URL: <code>peerhost-jl8u.vercel.app/run/{address?.slice(0, 6)}.../{'{'}PROJECT_NAME{'}'}/fn</code></p>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-400 mb-2">Base Directory</label>
                            <input
                                type="text"
                                id="base-dir"
                                defaultValue="functions"
                                className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-white/30"
                            />
                            <p className="text-xs text-gray-500 mt-2">Remote path (e.g. <code>.</code> or <code>functions</code>)</p>
                        </div>
                    </div>

                    <div className="mb-8">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-400">Entry Files</label>
                            <button
                                onClick={handleScanEndpoints}
                                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                            >
                                <FileCode className="w-3 h-3" /> Get All Endpoints
                            </button>
                        </div>
                        <input
                            type="text"
                            id="fn-entry"
                            defaultValue="hello.js"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white outline-none focus:border-white/30"
                        />
                        <p className="text-xs text-gray-500 mt-2">Comma separated (e.g. <code>hello.js, index.js</code>)</p>
                    </div>

                    {/* Env Vars Section */}
                    <div className="mb-8 p-6 bg-black/20 rounded-xl border border-white/5">
                        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            Environment Variables
                            <span className="text-xs font-normal text-gray-500 bg-white/10 px-2 py-0.5 rounded">Optional</span>
                        </h3>
                        <div className="space-y-3">
                            {envVars.map((env, index) => (
                                <div key={index} className="flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="KEY (e.g. API_URL)"
                                        value={env.key}
                                        onChange={(e) => updateEnvVar(index, 'key', e.target.value)}
                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-white/30 text-sm font-mono"
                                    />
                                    <input
                                        type="text"
                                        placeholder="VALUE"
                                        value={env.value}
                                        onChange={(e) => updateEnvVar(index, 'value', e.target.value)}
                                        className="flex-1 bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-white outline-none focus:border-white/30 text-sm font-mono"
                                    />
                                    <button
                                        onClick={() => removeEnvVar(index)}
                                        className="p-2 text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={addEnvVar}
                                className="text-sm font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-2"
                            >
                                <Plus className="w-3 h-3" /> Add Variable
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={handleDeploy}
                        disabled={deploying}
                        className="w-full bg-white text-black text-lg font-bold py-4 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {deploying ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
                        Deploy Service
                    </button>
                </div>
            )}
        </div>
    );
}
