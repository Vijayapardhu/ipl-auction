import React from 'react';
import { MessageSquare, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import TextChat from './TextChat';

/**
 * Floating mini chat for the bidding view: read + reply without leaving
 * the arena. Opens as a bottom sheet (mobile) / docked card (desktop).
 */
const MiniChat = ({ roomId, open, setOpen, unread, hidden }) => {
  return (
    <>
      {!open && !hidden && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open chat"
          className="fixed bottom-24 md:bottom-8 right-4 md:right-6 z-[80] w-13 h-13 p-3.5 rounded-full bg-white text-black shadow-[0_8px_30px_rgba(0,0,0,0.6)] transition-transform active:scale-95 hover:scale-105 cursor-pointer"
        >
          <MessageSquare size={20} />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1.5 rounded-full bg-green-500 text-black text-[10px] font-black flex items-center justify-center border-2 border-black">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="fixed z-[85] inset-x-3 bottom-24 md:inset-x-auto md:right-6 md:bottom-8 md:w-96"
          >
            <div className="bg-[#0d0d0e]/98 backdrop-blur-2xl border border-white/10 rounded-3xl overflow-hidden shadow-[0_20px_60px_rgba(0,0,0,0.7)] flex flex-col h-[55dvh] md:h-[520px] max-h-[520px]">
              <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare size={14} className="text-green-400" />
                  <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Live Chat</span>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close chat"
                  className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>
              <TextChat roomId={roomId} autoFocusInput />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default MiniChat;
