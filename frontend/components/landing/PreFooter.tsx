import React from 'react';
import { motion } from 'framer-motion';

const PreFooter = () => {
  return (
    <section className="w-full border-t border-white/10 relative">
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 relative">
          
        {/* Vertical line divider */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-white/10 hidden md:block"></div>
        {/* Plus marker top left */}
        <div className="absolute top-[-8px] left-[0px] w-4 h-4 text-accents-2 font-thin">+</div>
         {/* Plus marker top center */}
        <div className="absolute top-[-8px] left-1/2 -translate-x-1/2 w-4 h-4 text-accents-2 font-thin hidden md:block">+</div>

        {/* Left Column */}
        <div className="p-8 md:p-16 border-b md:border-b-0 border-white/10 relative">
             <div className="bg-grid-small-white absolute inset-0 opacity-10 pointer-events-none"></div>
             <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="relative z-10"
             >
                <h3 className="text-3xl font-bold mb-2">Ready to deploy? <span className="text-accents-5 font-normal">Start building on PeerHost (Free on Testnet).</span></h3>
                <h3 className="text-3xl font-normal text-accents-5 mb-8">Talk to the team for <span className="text-[#3291ff]">Mainnet</span> & <span className="text-[#a046b6]">Enterprise</span> integrations.</h3>
                
                <div className="flex flex-wrap gap-3">
                    <button className="h-10 px-5 rounded-full bg-white text-black font-medium text-sm hover:bg-gray-200 transition-all">
                        Start Building
                    </button>
                    <button className="h-10 px-5 rounded-full bg-black border border-accents-2 text-accents-5 font-medium text-sm hover:text-white hover:border-white transition-all">
                        Talk to an Expert
                    </button>
                </div>
             </motion.div>
        </div>

        {/* Right Column */}
        <div className="p-8 md:p-16 relative">
            <div className="bg-grid-small-white absolute inset-0 opacity-10 pointer-events-none"></div>
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="relative z-10"
            >
                <h3 className="text-lg font-medium mb-2">Explore PeerHost Protocol <span className="text-accents-5 font-normal">with an interactive product tour, whitepaper, or a personalized demo.</span></h3>
                <button className="mt-6 h-10 px-5 rounded-full bg-black border border-accents-2 text-accents-5 font-medium text-sm hover:text-white hover:border-white transition-all">
                    Explore Protocol
                </button>
            </motion.div>
        </div>
      </div>
      
       {/* Plus marker bottom right of container approx */}
       <div className="absolute bottom-[-8px] right-0 w-4 h-4 text-accents-2 font-thin">+</div>
    </section>
  );
};

export default PreFooter;