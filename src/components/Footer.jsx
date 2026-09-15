import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="mt-24 w-full relative z-10 overflow-hidden">
      {/* Glow accents */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-72 h-72 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-72 h-72 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      {/* ── Wordmark ── */}
      <div aria-hidden className="select-none pointer-events-none px-2 pt-14">
        <p className="text-center font-black uppercase leading-[0.85] tracking-tighter text-[15.5vw] lg:text-[11rem] bg-gradient-to-b from-white/[0.13] to-white/[0.02] bg-clip-text text-transparent whitespace-nowrap">
          Auction Hub
        </p>
        <p className="text-center font-black uppercase leading-none tracking-[0.45em] text-[3.4vw] lg:text-2xl text-transparent pb-6 -mt-1 sm:-mt-2" style={{ WebkitTextStroke: '1px rgba(255,85,0,0.35)' }}>
          IPL Simulator
        </p>
      </div>

      <div className="flex justify-center pb-10">
        <a
          href="https://vijayaapardhu.dev"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white transition-colors"
        >
          vijayaapardhu.dev
          <ArrowUpRight size={13} className="text-gray-600 group-hover:text-[#ff5500] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
        </a>
      </div>
    </footer>
  );
};

export default Footer;
