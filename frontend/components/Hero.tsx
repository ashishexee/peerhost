import React from 'react';
import { Triangle, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

import { useWallet } from '../context/WalletContext';
import { toast } from 'sonner';

const PolygonLogo = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.524 21.642L12 24L7.476 21.642V16.926L12 14.568L16.524 16.926V21.642Z" fill="#8247E5" fillOpacity="0.8"/>
    <path d="M16.524 7.074L12 9.432L7.476 7.074V2.358L12 0L16.524 2.358V7.074Z" fill="#8247E5" fillOpacity="0.8"/>
    <path d="M7.476 16.926L2.952 14.568L2.952 9.432L7.476 7.074L12 9.432V14.568L7.476 16.926Z" fill="#8247E5"/>
    <path d="M16.524 16.926L21.048 14.568V9.432L16.524 7.074L12 9.432V14.568L16.524 16.926Z" fill="#8247E5"/>
  </svg>
);

const Hero = () => {
  const navigate = useNavigate();
  const { isConnected } = useWallet();

  const handleStartBuilding = () => {
      if (!isConnected) {
          toast.error("Please connect your wallet first", {
              description: "You need a wallet to deploy on the network."
          });
          return;
      }
      navigate('/deploy');
  };

  return (
    <section className="relative pt-32 pb-20 overflow-hidden min-h-[90vh] flex flex-col items-center justify-center border-b border-white/10">
      {/* Background Grids */}
      <div className="absolute inset-0 bg-grid-large-white opacity-20 pointer-events-none [mask-image:linear-gradient(to_bottom,transparent,black)]"></div>
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
        
        {/* Polygon Network Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-8 fill-[#8247E5]"
        >
          <a 
            href="https://amoy.polygonscan.com/address/0x087a2d886fc8eadf5d03f6ea5acd0b1430c13fb8"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 hover:border-[#8247E5]/50 hover:bg-[#8247E5]/10 transition-all cursor-pointer backdrop-blur-sm group"
          >
            <span className="text-xs font-medium text-accents-5 group-hover:text-white transition-colors">
              Native x402 Execution on <span className="text-white">Polygon</span>
            </span>
            <ExternalLink className="w-3 h-3 text-gray-600 group-hover:text-[#8247E5] ml-1" />
          </a>
        </motion.div>

        {/* Main Heading */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-accents-4 leading-[1.1] max-w-5xl mx-auto"
        >
          The Decentralized & Monetizable Serverless Network.
        </motion.h1>
        
        {/* Subheading */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl text-accents-5 max-w-3xl mx-auto mb-10 leading-relaxed"
        >
          Run your code on a global, censorship-resistant worker grid. Monetize natively with the x402 Protocol. PeerHost is the execution layer for the Agentic Economy, where AI Agents and Humans pay for compute.
        </motion.p>
        
        {/* Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <button 
             onClick={handleStartBuilding}
             className="h-12 px-8 rounded-full bg-white text-black font-medium text-base hover:bg-gray-200 transition-all flex items-center gap-2"
          >
             <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M12 2L2 22H22L12 2Z" fill="currentColor" />
              </svg>
            Start Building
          </button>
          <button 
            onClick={() => navigate('/workers')}
            className="h-12 px-8 rounded-full bg-accents-1 border border-accents-2 text-white font-medium text-base hover:bg-accents-2 transition-all"
          >
            Register as Worker
          </button>
        </motion.div>
      </div>

      {/* Triangular Light Effect at Bottom - slightly animated entry */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[1000px] h-[400px] pointer-events-none"
      >
          {/* The colorful glow behind */}
          <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-hero-glow blur-[100px] opacity-40 rounded-full mix-blend-screen animate-pulse"></div>
          
          {/* The grid lines overlay on the glow */}
          <div className="absolute inset-0 bg-grid-large-white opacity-30 [mask-image:linear-gradient(to_top,black,transparent)]"></div>

          {/* The triangle shape mask simulation */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[300px] border-r-[300px] border-b-[400px] border-l-transparent border-r-transparent border-b-black opacity-90 scale-150 origin-bottom"></div>
          
          {/* Actual Triangle Lines */}
          <svg className="absolute bottom-0 left-1/2 -translate-x-1/2 overflow-visible" width="600" height="300" viewBox="0 0 600 300">
             <defs>
                <linearGradient id="line-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                   <stop offset="0%" stopColor="white" stopOpacity="0" />
                   <stop offset="50%" stopColor="white" stopOpacity="0.5" />
                   <stop offset="100%" stopColor="white" stopOpacity="1" />
                </linearGradient>
             </defs>
             {/* Simplified wireframe pyramid lines */}
             <path d="M300 0 L0 300" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.5" />
             <path d="M300 0 L600 300" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.5" />
             <path d="M300 0 L300 300" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.2" />
             <path d="M300 0 L150 300" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.3" />
             <path d="M300 0 L450 300" stroke="url(#line-gradient)" strokeWidth="1" opacity="0.3" />
             
             {/* Horizontal lines to make it look like steps */}
             {Array.from({ length: 15 }).map((_, i) => (
                <line 
                  key={i} 
                  x1={300 - i * 20} 
                  y1={i * 20} 
                  x2={300 + i * 20} 
                  y2={i * 20} 
                  stroke="white" 
                  strokeOpacity="0.1" 
                  strokeWidth="1" 
                />
             ))}
          </svg>
      </motion.div>
    </section>
  );
};

export default Hero;