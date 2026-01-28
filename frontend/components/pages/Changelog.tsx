import React from 'react';
import Navbar from '../layout/Navbar';
import { motion } from 'framer-motion';
import { CheckCircle2, Shield, Zap, DollarSign, Terminal, Lock, Gavel, Cpu, Network, Database, RefreshCw } from 'lucide-react';

export default function Changelog() {
    const changes = [
        {
            version: 'Wave 5 (Current)',
            date: 'January 2026',
            title: 'Optimistic Consensus, Staking & Speed',
            items: [
                {
                    icon: Zap,
                    title: 'Result Speed Optimizations (7-11s Latency)',
                    desc: 'Execution latency slashed from ~20s to ~7-11s via "Optimistic Response". The Gateway now returns the first valid result immediately while ensuring finality in the background.'
                },
                {
                    icon: Network,
                    title: 'Optimistic Majority Voting & Rewards',
                    desc: 'Hybrid consensus mechanism: Immediate user response followed by a 30-second voting window. If >66% consensus is reached, the result is signed. The fastest worker claims 0.03 POL, while 0.02 POL is distributed among honest voters as an incentive for verification.'
                },
                {
                    icon: DollarSign,
                    title: 'Payment System & Usage Controls',
                    desc: 'Introduced a "Freemium" model: Each endpoint receives 20 free requests. Beyond this, usage requires Credits purchased with POL (50 Credits = 1 POL). Added "Pause/Resume" functionality for granular control over endpoint availability. Project creation is unlimited—scale freely and pay only for actual execution.'
                },
                {
                    icon: Cpu,
                    title: 'Worker Staking & Rational Integrity',
                    desc: 'Permissionless "Burner Node" architecture. Workers must stake >2 POL to participate. This bond is subject to immediate slashing implementation in `ExecutionCoordinator.sol` upon proven dishonesty. Honest workers can withdraw anytime, subject to a safety cooldown.'
                },
                {
                    icon: Shield,
                    title: 'Long-Term Network Security',
                    desc: 'Self-healing grid driven by economic incentives. As the network grows, the cost of attack rises exponentially while the probability of success drops to near zero.'
                },
                {
                    icon: Gavel,
                    title: 'Stealth Auditor System (Project Canary)',
                    desc: 'A "Sword of Damocles" for the worker grid. The Gateway functions as an invisible auditor, injecting random, indistinguishable test cases into the request stream. Workers never know if a job is real or a test. If they return a malicious result for a canary job, their stake is immediately revoked (slashed). This constant, probabilistic threat ensures workers act honestly at all times to protect their capital.'
                },
                {
                    icon: RefreshCw,
                    title: 'Blacklist & Redemption Protocol',
                    desc: 'New "Unban" mechanism in smart contracts. Blacklisted workers can re-enter the network by paying a strict 1 POL penalty and undergoing a probation period, allowing for redemption while maintaining high standards.'
                },
                {
                    icon: Database,
                    title: 'x402 Transaction Logging',
                    desc: 'Full transparency for paid API calls. All x402 micropayments are now indexed in Supabase (`transactions` table) linking the Payer, Beneficiary, and Resource ID for immutable audit trails.'
                }
            ]
        },
        {
            version: 'Wave 4',
            date: 'December 2025',
            title: 'Foundation & Prototype',
            items: [
                {
                    icon: CheckCircle2,
                    title: 'MVP Launch',
                    desc: 'Initial release of PeerHost. Basic worker node functionality, GitHub-based deployment pipeline, and simple HTTP gateway.'
                }
            ]
        }
    ];

    return (
        <div className="min-h-screen bg-black text-white selection:bg-[#0070f3] selection:text-white pb-20">
            <Navbar />
            <div className="max-w-4xl mx-auto px-6 pt-32">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-center mb-16"
                >
                    <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 mb-6">
                        Changelog
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Tracking the evolution of the PeerHost Network.
                    </p>
                </motion.div>

                <div className="relative border-l border-white/10 ml-4 md:ml-10 space-y-12">
                    {changes.map((change, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            className="relative pl-8 md:pl-12"
                        >
                            {/* Timeline Dot */}
                            <div className="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-black" />

                            <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4 mb-4">
                                <h2 className="text-2xl font-bold text-white">{change.version}</h2>
                                <span className="text-sm font-mono text-gray-500 bg-white/5 px-2 py-1 rounded border border-white/10">
                                    {change.date}
                                </span>
                            </div>
                            <h3 className="text-lg text-blue-400 font-medium mb-6">{change.title}</h3>

                            <div className="grid gap-4">
                                {change.items.map((item, i) => (
                                    <div key={i} className="bg-white/5 border border-white/5 rounded-xl p-4 hover:border-white/10 transition-colors flex items-start gap-4">
                                        <div className="p-2 bg-black/50 rounded-lg text-gray-400 shrink-0">
                                            <item.icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                                            <p className="text-sm text-gray-400 leading-relaxed text-left">
                                                {item.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
