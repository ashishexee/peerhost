import React from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone, Monitor, Globe,
  Shield, Router,
  FileCode, Link as LinkIcon,
  Box, Cpu,
  Database, HardDrive, Network,
  Server, Layers
} from 'lucide-react';

const LayerPlate = ({ z, color, title, icons, delay, subLabel, details }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, translateZ: z + 200 }}
      whileInView={{ opacity: 1, translateZ: z }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 1, delay, type: "spring", stiffness: 50 }}
      className={`absolute inset-0 w-[280px] h-[280px] md:w-[400px] md:h-[400px] mx-auto border border-white/10 bg-black/60 backdrop-blur-[4px] rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col items-center justify-center group hover:bg-black/90 hover:border-${color}-500/80 transition-all duration-500`}
      style={{
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Glowing Edge */}
      <div className={`absolute inset-0 rounded-2xl border-2 border-${color}-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>

      {/* Corner Accents */}
      <div className={`absolute top-0 left-0 w-4 h-4 border-t border-l border-${color}-500/50 rounded-tl-lg group-hover:border-${color}-400 transition-colors`}></div>
      <div className={`absolute top-0 right-0 w-4 h-4 border-t border-r border-${color}-500/50 rounded-tr-lg group-hover:border-${color}-400 transition-colors`}></div>
      <div className={`absolute bottom-0 left-0 w-4 h-4 border-b border-l border-${color}-500/50 rounded-bl-lg group-hover:border-${color}-400 transition-colors`}></div>
      <div className={`absolute bottom-0 right-0 w-4 h-4 border-b border-r border-${color}-500/50 rounded-br-lg group-hover:border-${color}-400 transition-colors`}></div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)] bg-[size:40px_40px] rounded-2xl"></div>

      {/* Content Container */}
      <div className="relative z-10 flex flex-col items-center gap-3 transform group-hover:scale-105 transition-transform duration-500">
        <div className={`flex gap-6 text-${color}-400 drop-shadow-[0_0_15px_rgba(0,0,0,1)] group-hover:text-${color}-300 transition-colors`}>
          {icons}
        </div>
        <div className="text-center">
          <div className="text-xs md:text-sm font-bold tracking-widest text-white uppercase bg-black/80 px-3 py-1.5 rounded border border-white/20 shadow-lg backdrop-blur-md font-mono group-hover:border-white/40 transition-colors">
            {title}
          </div>
          {subLabel && <div className="text-[10px] text-accents-5 mt-2 font-mono uppercase tracking-wide group-hover:text-white transition-colors duration-300">{subLabel}</div>}
          {details && <div className="text-[9px] text-white/40 mt-1 font-sans max-w-[200px] leading-tight group-hover:text-white/90 transition-colors duration-300">{details}</div>}
        </div>
      </div>
    </motion.div>
  );
};

const Label = ({ text, side = 'left', top, delay }: any) => (
  <motion.div
    initial={{ opacity: 0, x: side === 'left' ? -20 : 20 }}
    whileInView={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`absolute ${side === 'left' ? 'left-4 md:left-20 text-right' : 'right-4 md:right-20 text-left'} w-32 md:w-48 hidden md:block`}
    style={{ top }}
  >
    <div className="text-xs font-mono text-accents-5 mb-1 tracking-wider">FEATURE</div>
    <div className="text-sm font-semibold text-white">{text}</div>
    <div className={`absolute top-1/2 ${side === 'left' ? '-right-4 md:-right-12' : '-left-4 md:-left-12'} w-8 md:w-16 h-[1px] bg-white/20`}></div>
  </motion.div>
);

const Architecture = () => {
  return (
    <section className="relative w-full py-10 bg-black overflow-hidden border-t border-white/10">

      {/* Section Header */}
      <div className="absolute top-12 left-0 w-full text-center z-20 px-6">
        <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-b from-white to-accents-5">Protocol Architecture</h2>
        <p className="text-accents-5 max-w-xl mx-auto">A fully decentralized stack from request to response.</p>
      </div>
      <div className="w-full h-[750px] flex items-center justify-center relative perspective-[2000px]">

        {/* Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-900/20 blur-[120px] rounded-full pointer-events-none"></div>

        {/* 3D Scene Container */}
        <div
          className="relative w-[300px] h-[300px] md:w-[400px] md:h-[400px] mt-[420px]"
          style={{
            transformStyle: 'preserve-3d',
            transform: 'rotateX(55deg) rotateZ(-45deg)',
          }}
        >
          {/* Layer 5: Worker (Bottom) */}
          <LayerPlate
            z={0}
            color="pink"
            title="Global Worker Grid"
            subLabel="Sandbox • microVMs • Bare Metal"
            details="Node operators running secured execution environments"
            delay={0.5}
            icons={<><Server size={24} /><Box size={24} /><Cpu size={24} /></>}
          />

          {/* Layer 4: Blockchain */}
          <LayerPlate
            z={100}
            color="purple"
            title="ExecutionCoordinator.sol"
            subLabel="Trustless Job Dispatcher"
            details="Verifies compute proofs & manages payouts on-chain"
            delay={0.4}
            icons={<><FileCode size={24} /><LinkIcon size={24} /><Layers size={24} /></>}
          />

          {/* Layer 3: Gateway */}
          <LayerPlate
            z={200}
            color="cyan"
            title="Gateway & Control"
            subLabel="Auth • Rate Limits • Routing"
            delay={0.3}
            icons={<><Shield size={24} /><Router size={24} /></>}
          />

          {/* Layer 2: IPFS */}
          <LayerPlate
            z={300}
            color="indigo"
            title="IPFS & Storage"
            subLabel="Immutable Code Storage"
            delay={0.2}
            icons={<><Database size={24} /><HardDrive size={24} /><Network size={24} /></>}
          />

          {/* Layer 1: User (Top) */}
          <LayerPlate
            z={400}
            color="blue"
            title="Applications"
            subLabel="Clients • dApps • Dashboards"
            delay={0.1}
            icons={<><Smartphone size={24} /><Monitor size={24} /><Globe size={24} /></>}
          />

          {/* Vertical Flow Indicators (Decorative Lines) */}
          <motion.div
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          />
        </div>

        {/* Floating Labels (Outside the 3D transform for readability) */}
        <div className="absolute inset-0 max-w-5xl mx-auto pointer-events-none">
          <Label text="User Interfaces" top="32%" side="left" delay={0.6} />
          <Label text="IPFS Decentralized Storage" top="57%" side="right" delay={0.7} />
          <Label text="API Gateway" top="45%" side="left" delay={0.8} />
          <Label text="Smart Contracts" top="68%" side="right" delay={0.9} />
          <Label text="Sandboxed Execution(Worker)" top="77%" side="left" delay={1.0} />
        </div>

      </div>
    </section>
  );
};

export default Architecture;
