import React from 'react';
import { Globe, GitBranch, Terminal } from 'lucide-react';
import { motion } from 'framer-motion';

const Features = () => {
  return (
    <section className="relative w-full border-b border-white/10">
      {/* Top Colorful Bar */}
      <div className="flex h-[300px] w-full relative overflow-hidden">
        {/* Blue Gradient Left */}
        <div className="w-1/2 h-full bg-gradient-to-b from-[#0070f3] to-transparent opacity-20 relative">
             <div className="absolute inset-0 bg-[linear-gradient(to_right,#000_1px,transparent_1px)] bg-[size:40px_100%] opacity-20"></div>
        </div>
        {/* Red Gradient Right */}
        <div className="w-1/2 h-full bg-gradient-to-b from-[#ff0000] to-transparent opacity-20 relative">
             <div className="absolute inset-0 bg-[linear-gradient(to_left,#000_1px,transparent_1px)] bg-[size:40px_100%] opacity-20"></div>
        </div>
        
        {/* Middle Fade Out */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/80 to-black"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pb-32 -mt-32 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-2"
          >
            Use your favorite tools <span className="text-[#a1a1a1] inline-flex items-center">&gt;_</span>
          </motion.h2>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-5xl font-bold tracking-tight mb-2 flex items-center justify-center gap-3"
          >
            Ship globally. Instantly. Trustlessly. <Globe className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </motion.h2>
           <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-4xl md:text-5xl font-bold tracking-tight flex items-center justify-center gap-3"
           >
            Execute with cryptographic guarantees <GitBranch className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </motion.h2>
        </div>
        
        {/* Scale Section integrated here as per flow */}
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="py-20 border-t border-white/10 text-center"
        >
            <h3 className="text-3xl md:text-4xl font-semibold flex flex-wrap items-center justify-center gap-3">
                Scale your 
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-base md:text-lg">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                    Compute
                </span> 
                without owning 
                <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 bg-white/5 text-base md:text-lg">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    Servers
                </span>
            </h3>
        </motion.div>
      </div>
    </section>
  );
};

export default Features;