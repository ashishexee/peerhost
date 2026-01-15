import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Laptop, Bot, FileCode, 
  Cpu, CheckCircle, Globe 
} from 'lucide-react';

// --- Types ---
type NodeType = 'client' | 'gateway' | 'agent' | 'contract' | 'worker' | 'verifier';

interface NodeConfig {
  id: NodeType | string;
  label: string;
  icon: any;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  color: string;
  description?: string;
}

// --- Configuration ---
const NODES: NodeConfig[] = [
  { id: 'client', label: 'API Client', icon: Laptop, x: 10, y: 50, color: 'blue', description: 'Initiates Request' },
  { id: 'gateway', label: 'Gateway', icon: Globe, x: 30, y: 50, color: 'cyan', description: 'Routing & Auth' },
  { id: 'agent', label: 'AI Agent', icon: Bot, x: 30, y: 80, color: 'pink', description: 'Payment Check' },
  { id: 'contract', label: 'Coordinator', icon: FileCode, x: 50, y: 50, color: 'purple', description: 'On-chain Logic' },
  { id: 'worker1', label: 'Worker A', icon: Cpu, x: 70, y: 25, color: 'orange', description: 'Computing...' },
  { id: 'worker2', label: 'Worker B', icon: Cpu, x: 70, y: 50, color: 'orange', description: 'Computing...' },
  { id: 'worker3', label: 'Worker C', icon: Cpu, x: 70, y: 75, color: 'orange', description: 'Computing...' },
  { id: 'verifier', label: 'Verifier', icon: CheckCircle, x: 90, y: 50, color: 'green', description: 'Proof Validation' },
];

// --- Helper: Bezier Path Generator ---
const getPath = (start: NodeConfig, end: NodeConfig, curvature = 0.4, inverse = false) => {
  const sx = start.x;
  const sy = start.y;
  const ex = end.x;
  const ey = end.y;

  const dist = Math.abs(ex - sx);
  // Control points
  const cp1x = sx + dist * curvature;
  const cp1y = sy + (inverse ? -20 : 0); 
  const cp2x = ex - dist * curvature;
  const cp2y = ey + (inverse ? -20 : 0);

  return `M ${sx} ${sy} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${ex} ${ey}`;
};

// Special path for loopback (Verifier -> Client)
const getLoopbackPath = (start: NodeConfig, end: NodeConfig) => {
  // Arcs heavily upwards
  return `M ${start.x} ${start.y} C ${start.x} 5, ${end.x} 5, ${end.x} ${end.y}`;
};

const ExecutionFlow = () => {
  const [step, setStep] = useState(0);

  // --- Animation Sequence Loop ---
  useEffect(() => {
    const sequence = async () => {
      // Loop forever
      while (true) {
        setStep(1); // Client -> Gateway
        await new Promise(r => setTimeout(r, 1500));
        
        setStep(2); // Gateway -> Agent
        await new Promise(r => setTimeout(r, 1200));
        
        setStep(3); // Agent -> Gateway
        await new Promise(r => setTimeout(r, 1200));
        
        setStep(4); // Gateway -> Contract
        await new Promise(r => setTimeout(r, 1200));
        
        setStep(5); // Contract -> Workers
        await new Promise(r => setTimeout(r, 1800));
        
        setStep(6); // Workers -> Verifier
        await new Promise(r => setTimeout(r, 1800));
        
        setStep(7); // Verifier -> Client (Loopback)
        await new Promise(r => setTimeout(r, 2500));
        
        setStep(0); // Reset/Idle
        await new Promise(r => setTimeout(r, 800));
      }
    };
    
    sequence();
  }, []);

  // --- Render Helpers ---
  const getNode = (id: string) => NODES.find(n => n.id === id)!;

  const renderConnection = (fromId: string, toId: string, activeInStep: number, isLoopback = false) => {
    const start = getNode(fromId);
    const end = getNode(toId);
    const pathD = isLoopback ? getLoopbackPath(start, end) : getPath(start, end);
    const isActive = step === activeInStep;

    return (
      <g key={`${fromId}-${toId}`}>
        {/* Base Wire - Extremely Thin and Subtle */}
        <path d={pathD} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5" />
        
        {/* Active Pulse - Thin Wire */}
        <AnimatePresence>
          {isActive && (
            <motion.path
              d={pathD}
              fill="none"
              stroke={`url(#gradient-${start.color})`}
              strokeWidth="1.5"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ 
                pathLength: 1, 
                opacity: [0, 0.8, 1, 0],
                pathOffset: [0, 1]
              }}
              transition={{ duration: isLoopback ? 2.2 : 1.4, ease: "easeInOut" }}
              strokeLinecap="round"
            />
          )}
        </AnimatePresence>
      </g>
    );
  };

  return (
    <section className="relative w-full py-24 bg-black border-t border-white/10 overflow-hidden">
      {/* Definitions for Gradients */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          <linearGradient id="gradient-blue" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0" />
            <stop offset="50%" stopColor="#3b82f6" stopOpacity="1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradient-cyan" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="1" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradient-pink" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ec4899" stopOpacity="0" />
            <stop offset="50%" stopColor="#ec4899" stopOpacity="1" />
            <stop offset="100%" stopColor="#ec4899" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradient-purple" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
            <stop offset="50%" stopColor="#a855f7" stopOpacity="1" />
            <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradient-orange" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f97316" stopOpacity="0" />
            <stop offset="50%" stopColor="#f97316" stopOpacity="1" />
            <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="gradient-green" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#22c55e" stopOpacity="0" />
            <stop offset="50%" stopColor="#22c55e" stopOpacity="1" />
            <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>

      {/* Clean background - Absolutely no dots */}
      <div className="absolute inset-0 bg-black pointer-events-none"></div>

      <div className="max-w-[1400px] mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <motion.div
             initial={{ opacity: 0, y: 10 }}
             whileInView={{ opacity: 1, y: 0 }}
             className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/5 backdrop-blur-sm mb-4"
          >
             <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
             <span className="text-xs font-mono text-accents-5 uppercase tracking-wider">Live Execution Flow</span>
          </motion.div>
          <h2 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-white to-accents-5">
            Peer-to-Peer Request Lifecycle
          </h2>
        </div>

        {/* --- Flow Canvas --- */}
        <div className="relative w-full aspect-[16/9] md:aspect-[2/1] lg:h-[600px] bg-black border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
           
           {/* SVG Layer for Wires */}
           <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              {/* Step 1: Client -> Gateway */}
              {renderConnection('client', 'gateway', 1)}
              
              {/* Step 2: Gateway -> Agent */}
              {renderConnection('gateway', 'agent', 2)}
              
              {/* Step 3: Agent -> Gateway */}
              {renderConnection('agent', 'gateway', 3)}
              
              {/* Step 4: Gateway -> Contract */}
              {renderConnection('gateway', 'contract', 4)}
              
              {/* Step 5: Contract -> Workers */}
              {renderConnection('contract', 'worker1', 5)}
              {renderConnection('contract', 'worker2', 5)}
              {renderConnection('contract', 'worker3', 5)}
              
              {/* Step 6: Workers -> Verifier (Winner is Worker 2) */}
              {renderConnection('worker2', 'verifier', 6)}
              
              {/* Step 7: Verifier -> Client */}
              {renderConnection('verifier', 'client', 7, true)}
           </svg>

           {/* HTML Layer for Nodes */}
           {NODES.map((node) => {
             const isWorker = node.id.includes('worker');
             // Highlight logic based on step
             let isActive = false;
             if (step === 1 && node.id === 'client') isActive = true;
             if (step === 1 && node.id === 'gateway') isActive = true;
             if (step === 2 && (node.id === 'gateway' || node.id === 'agent')) isActive = true;
             if (step === 3 && (node.id === 'agent' || node.id === 'gateway')) isActive = true;
             if (step === 4 && (node.id === 'gateway' || node.id === 'contract')) isActive = true;
             if (step === 5 && (node.id === 'contract' || isWorker)) isActive = true;
             if (step === 6 && (node.id === 'verifier' || node.id === 'worker2')) isActive = true;
             if (step === 7 && (node.id === 'verifier' || node.id === 'client')) isActive = true;

             return (
               <motion.div
                 key={node.id}
                 className={`absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2 group cursor-pointer z-10`}
                 style={{ left: `${node.x}%`, top: `${node.y}%` }}
                 initial={{ opacity: 0.5, scale: 0.9 }}
                 animate={{ 
                    opacity: isActive ? 1 : 0.4, 
                    scale: isActive ? 1.15 : 1,
                    filter: isActive ? 'grayscale(0%) brightness(1.2)' : 'grayscale(100%) brightness(0.7)'
                 }}
                 transition={{ duration: 0.5, ease: "easeInOut" }}
               >
                 {/* Node Card - No dots, just clean border */}
                 <div className={`
                    relative w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl 
                    bg-black/90 backdrop-blur-md border 
                    flex items-center justify-center shadow-lg transition-all duration-500
                    ${isActive ? `border-${node.color}-500/80 shadow-[0_0_40px_rgba(var(--${node.color}-rgb),0.3)]` : 'border-white/10'}
                 `}>
                    <node.icon className={`w-5 h-5 md:w-8 md:h-8 transition-colors duration-500 ${isActive ? `text-${node.color}-400` : 'text-accents-6'}`} />
                 </div>

                 {/* Label */}
                 <div className="text-center">
                    <div className={`text-[10px] md:text-xs font-bold uppercase tracking-wider transition-colors duration-500 ${isActive ? 'text-white' : 'text-accents-7'}`}>
                        {node.label}
                    </div>
                 </div>
               </motion.div>
             );
           })}

           {/* Floating Status Text */}
           <div className="absolute bottom-6 left-6 font-mono text-xs text-accents-5 bg-black/50 px-3 py-1.5 rounded border border-white/10 backdrop-blur-md">
              STATUS: {step === 0 ? 'IDLE' : 
                       step === 1 ? 'REQUEST_INITIATED' :
                       step === 2 ? 'AUTHORIZING_AGENT' :
                       step === 3 ? 'PAYMENT_VERIFIED' :
                       step === 4 ? 'DISPATCHING_JOB' :
                       step === 5 ? 'DISTRIBUTED_EXECUTION' :
                       step === 6 ? 'VERIFYING_PROOF' : 'RESPONSE_RECEIVED'}
           </div>

        </div>
      </div>
    </section>
  );
};

export default ExecutionFlow;
