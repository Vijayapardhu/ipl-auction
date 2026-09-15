import React from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { useVoice } from '../contexts/VoiceContext';

/**
 * Persistent mini voice controls. Visible on every page while in voice,
 * so friends keep talking (and can mute/leave) after navigating away
 * from the auction room.
 */
const VoiceFloatBar = () => {
  const { joined, muted, toggleMute, leave, activeRoomId, peers } = useVoice();

  if (!joined) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-[90] flex items-center gap-2 bg-[#0a0a0a]/90 backdrop-blur-xl border border-green-500/20 rounded-full pl-3 pr-2 py-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.6)]">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
      </span>
      <span className="text-[9px] font-black text-white uppercase tracking-[0.2em] max-w-[120px] truncate">
        {activeRoomId}
      </span>
      <span className="text-[9px] font-bold text-gray-500 uppercase">
        {peers.length + 1}
      </span>
      <button
        onClick={toggleMute}
        title={muted ? 'Unmute' : 'Mute'}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all active:scale-95 cursor-pointer ${muted
          ? 'bg-red-500/20 text-red-400'
          : 'bg-green-500/15 text-green-400 hover:bg-green-500/25'}`}
      >
        {muted ? <MicOff size={14} /> : <Mic size={14} />}
      </button>
      <button
        onClick={leave}
        title="Leave voice"
        className="w-8 h-8 rounded-full bg-red-500/10 text-red-400 hover:bg-red-500/25 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
      >
        <PhoneOff size={14} />
      </button>
    </div>
  );
};

export default VoiceFloatBar;
