
import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { Github, Folder, ArrowRight, Loader2, Play } from 'lucide-react';

export default function Dashboard() {
    const { address } = useWallet();
    const [githubUser, setGithubUser] = useState('');
    const [repos, setRepos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedRepo, setSelectedRepo] = useState<any>(null);

    const fetchRepos = async () => {
        if (!githubUser) return;
        setLoading(true);
        try {
            const res = await fetch(`https://api.github.com/users/${githubUser}/repos?sort=updated`);
            const data = await res.json();
            if (Array.isArray(data)) {
                setRepos(data);
            } else {
                alert(data.message || "Failed to fetch repos");
            }
        } catch (err) {
            console.error(err);
            alert("Error fetching repositories");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pt-24 min-h-screen max-w-[1400px] mx-auto px-6 pb-20">
            <header className="mb-12">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
                    Developer Console
                </h1>
                <p className="text-gray-400 mt-2">Manage your decentralized functions.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Col: GitHub Integration */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Github className="w-5 h-5 text-white" />
                            <h2 className="text-lg font-semibold text-white">Connect Code</h2>
                        </div>
                        <p className="text-sm text-gray-400 mb-4">
                            Enter your GitHub username to list public repositories.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="github-username"
                                className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white w-full outline-none focus:border-white/30"
                                value={githubUser}
                                onChange={(e) => setGithubUser(e.target.value)}
                            />
                            <button
                                onClick={fetchRepos}
                                disabled={loading || !githubUser}
                                className="bg-white text-black px-4 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>

                    {/* Repo List */}
                    {repos.length > 0 && (
                        <div className="space-y-2">
                            <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Select Repository</h3>
                            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                {repos.map(repo => (
                                    <div
                                        key={repo.id}
                                        onClick={() => setSelectedRepo(repo)}
                                        className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedRepo?.id === repo.id
                                                ? 'bg-white/10 border-white text-white'
                                                : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <Folder className="w-4 h-4" />
                                            <span className="font-medium truncate">{repo.name}</span>
                                        </div>
                                        <div className="text-xs mt-1 opacity-50 truncate">{repo.description || "No description"}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>


                {/* Right Col: Deployment / Details */}
                <div className="lg:col-span-2">
                    {selectedRepo ? (
                        <div className="bg-white/5 border border-white/10 rounded-xl p-8 min-h-[400px] flex flex-col justify-center items-center text-center">
                            <Github className="w-12 h-12 text-white mb-4 opacity-50" />
                            <h2 className="text-2xl font-bold text-white mb-2">{selectedRepo.full_name}</h2>
                            <p className="text-gray-400 max-w-md mb-6">
                                Ready to deploy? Enter the function filename to deploy (e.g., <code>hello.js</code> or <code>index.js</code>).
                            </p>

                            <div className="w-full max-w-xs mb-4 text-left">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">BASE DIRECTORY</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-white/30"
                                    placeholder="functions"
                                    defaultValue="functions"
                                    id="base-dir"
                                />
                            </div>

                            <div className="w-full max-w-xs mb-4 text-left">
                                <label className="block text-xs font-semibold text-gray-500 mb-1">FUNCTION FILENAME</label>
                                <input
                                    type="text"
                                    className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-white outline-none focus:border-white/30"
                                    placeholder="hello.js"
                                    defaultValue="hello.js"
                                    id="fn-entry"
                                />
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={async () => {
                                        const fnName = (document.getElementById('fn-entry') as HTMLInputElement).value;
                                        const baseDir = (document.getElementById('base-dir') as HTMLInputElement).value;

                                        if (!address) return alert("Connect Wallet First");

                                        setLoading(true);
                                        try {
                                            const res = await fetch('https://peerhost-jl8u.vercel.app/deploy', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                    wallet: address,
                                                    repoUrl: selectedRepo.clone_url,
                                                    functionName: fnName,
                                                    baseDir: baseDir
                                                })
                                            });
                                            const data = await res.json();
                                            if (data.success) {
                                                alert(`Deployed! Live at: ${data.url}`);
                                                window.open(data.url, '_blank');
                                            } else {
                                                alert("Deployment failed: " + JSON.stringify(data));
                                            }
                                        } catch (e: any) {
                                            alert("Error: " + e.message);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="bg-white text-black px-6 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                                    Deploy to PeerHost
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full border border-dashed border-white/10 rounded-xl flex flex-col items-center justify-center text-gray-500 p-8">
                            <Folder className="w-12 h-12 mb-4 opacity-20" />
                            <p>Select a repository to begin deployment</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
