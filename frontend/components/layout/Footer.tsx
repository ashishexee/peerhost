import React from 'react';
import { Github, Linkedin, Twitter, Youtube, Moon, Sun, Monitor } from 'lucide-react';

const FooterColumn = ({ title, links }: { title: string, links: string[] }) => (
  <div className="flex flex-col gap-3">
    <h4 className="text-sm font-semibold text-white">{title}</h4>
    <ul className="flex flex-col gap-2">
      {links.map((link) => (
        <li key={link}>
          <a href="#" className="text-sm text-accents-5 hover:text-white transition-colors">
            {link}
          </a>
        </li>
      ))}
    </ul>
  </div>
);

const Footer = () => {
  return (
    <footer className="bg-black pt-16 pb-12 border-t border-white/10">
      <div className="max-w-[1400px] mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-16">
          <FooterColumn 
            title="Protocol" 
            links={['Network', 'Security', 'Serverless Functions', 'Observability', 'Domains', 'Sandbox', 'CLI & SDKs']} 
          />
          <FooterColumn 
            title="Resources" 
            links={['Documentation', 'Node Runner Guide', 'Gateway Operator Manual', 'Smart Contract Specs', 'Security Model', 'Economic Model', 'Whitepaper', 'Protocol Audits']} 
          />
          <FooterColumn 
            title="Company" 
            links={['About PeerHost', 'Research', 'Open Source', 'Careers', 'Changelog', 'Governance', 'Community', 'Grants']} 
          />
          <FooterColumn 
            title="Social" 
            links={['GitHub', 'X (Twitter)', 'Discord', 'Telegram']} 
          />
          {/* Spacer columns for layout match */}
          <div className="hidden lg:block"></div>
          <div className="hidden lg:block"></div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#0070f3]"></div>
            <span className="text-sm text-[#0070f3] font-medium">PeerHost Network Status: All Workers Online.</span>
          </div>

          <div className="flex items-center gap-4">
             <div className="flex items-center border border-accents-2 rounded-full p-1 bg-black">
                 <button className="p-1.5 rounded-full bg-accents-2 text-white">
                     <Monitor size={14} />
                 </button>
                 <button className="p-1.5 rounded-full text-accents-5 hover:text-white transition-colors">
                     <Sun size={14} />
                 </button>
                 <button className="p-1.5 rounded-full text-accents-5 hover:text-white transition-colors">
                     <Moon size={14} />
                 </button>
             </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;