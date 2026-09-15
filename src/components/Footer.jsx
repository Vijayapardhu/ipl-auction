import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Mail, Cpu } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path></svg>, href: "https://github.com/vijayapardhu", label: "GitHub" },
    { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>, href: "https://vijayaapardhu.dev", label: "Portfolio" },
    { icon: <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>, href: "https://linkedin.com/in/vijayaapardhu", label: "LinkedIn" }
  ];

  const techStack = [
    { name: "React & Vite", href: "https://vite.dev" },
    { name: "Tailwind CSS", href: "https://tailwindcss.com" },
    { name: "Firebase", href: "https://firebase.google.com" },
    { name: "Framer Motion", href: "https://motion.dev" }
  ];

  return (
    <footer className="mt-24 w-full relative z-10 overflow-hidden">
      {/* Glow accents */}
      <div className="absolute top-0 left-1/4 -translate-y-1/2 w-72 h-72 bg-orange-600/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-1/4 -translate-y-1/2 w-72 h-72 bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-6">
        {/* Top row: brand + link columns */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-10 md:gap-8 pt-14 pb-12 border-t border-white/5">
          <div className="col-span-1 sm:col-span-12 md:col-span-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-black tracking-[0.2em] uppercase text-white">
                IPL Auction Hub
              </span>
              <a
                href="https://auction.vijayaapardhu.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-600 hover:text-[#ff5500] transition-colors"
                title="auction.vijayaapardhu.dev"
              >
                <ArrowUpRight size={14} />
              </a>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed font-medium max-w-sm">
              The real-time multiplayer IPL auction simulator. Build your dream franchise squad,
              manage budgets and overseas slots, and outbid your friends live.
            </p>
            <div className="flex gap-3 pt-2">
              {socialLinks.map((social) => (
                <motion.a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ y: -3, scale: 1.05, backgroundColor: "rgba(255, 255, 255, 0.08)", borderColor: "rgba(255, 255, 255, 0.2)" }}
                  whileTap={{ scale: 0.95 }}
                  className="w-10 h-10 rounded-xl bg-white/[0.03] border border-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all duration-300"
                  title={social.label}
                >
                  {social.icon}
                </motion.a>
              ))}
            </div>
          </div>

          <div className="col-span-1 sm:col-span-6 md:col-span-3 space-y-4">
            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Built With</h4>
            <ul className="space-y-2">
              {techStack.map((tech) => (
                <li key={tech.name}>
                  <a
                    href={tech.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-500 hover:text-white font-bold uppercase tracking-wider transition-colors duration-200 flex items-center gap-1 group w-fit"
                  >
                    {tech.name}
                    <Cpu size={10} className="text-gray-700 group-hover:text-white transition-colors duration-200" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-1 sm:col-span-6 md:col-span-3 space-y-4">
            <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.3em]">Developer</h4>
            <div className="space-y-2">
              <a
                href="https://vijayaapardhu.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="block group w-fit"
              >
                <span className="text-xs font-black text-gray-400 group-hover:text-white transition-colors uppercase tracking-widest block">
                  Vijaya Pardhu
                </span>
                <span className="text-[9px] font-bold text-gray-600 uppercase tracking-widest block">
                  Software Engineer
                </span>
              </a>
              <div className="pt-1">
                <a
                  href="mailto:vijaypardhu17@gmail.com"
                  className="text-[10px] font-bold text-gray-500 hover:text-white uppercase tracking-widest flex items-center gap-1.5 transition-colors"
                >
                  <Mail size={12} /> Email Me
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Wordmark ── */}
      <div aria-hidden className="select-none pointer-events-none px-2">
        <p className="text-center font-black uppercase leading-[0.85] tracking-tighter text-[15.5vw] lg:text-[11rem] bg-gradient-to-b from-white/[0.13] to-white/[0.02] bg-clip-text text-transparent whitespace-nowrap">
          Auction Hub
        </p>
        <p className="text-center font-black uppercase leading-none tracking-[0.45em] text-[3.4vw] lg:text-2xl text-transparent pb-6 -mt-1 sm:-mt-2" style={{ WebkitTextStroke: '1px rgba(255,85,0,0.35)' }}>
          IPL Simulator
        </p>
      </div>

      <div className="border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest text-center sm:text-left leading-relaxed">
            &copy; {currentYear} IPL Auction Hub • auction.vijayaapardhu.dev 🏏
          </p>
          <span className="text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] leading-none">
            Secure Realtime Sync Enabled
          </span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
