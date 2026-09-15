import React, { useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, Loader2, Users } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import { useVoiceChat } from '../hooks/useVoiceChat';

const PeerRow = ({ name, teamId, muted, connected, self }) => {
  const initial = (name || '?').trim().charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 bg-white/[0.03] border border-white/5 rounded-2xl px-3 py-2.5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${connected ? 'bg-green-500/15 text-green-400 border border-green-500/20' : 'bg-white/5 text-gray-400 border border-white/10'}`}>
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-black text-white uppercase tracking-wider truncate">
          {name}{self ? ' (You)' : ''}
        </p>
        {teamId ? (
          <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{teamId}</p>
        ) : (
          <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest">In voice</p>
        )}
      </div>
      {connected ? (
        muted ? (
          <MicOff size={15} className="text-red-400 shrink-0" />
        ) : (
          <Volume2 size={15} className="text-green-400 shrink-0" />
        )
      ) : (
        <span className="flex items-center gap-1.5 text-[8px] font-black text-amber-400 uppercase tracking-widest shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          Joining
        </span>
      )}
    </div>
  );
};

const VoiceChat = ({ roomId, onJoinedChange }) => {
  const { user } = useAuth();
  const { team } = useAuction();
  const {
    supported, turnConfigured, joined, joining, muted, peers, connectedUids, error, join, leave, toggleMute,
  } = useVoiceChat({
    roomId,
    user,
    displayName: user?.displayName || 'Manager',
    teamId: team?.teamId || team?.team || '',
    teamName: team?.teamName || '',
  });

  useEffect(() => {
    if (onJoinedChange) onJoinedChange(joined);
  }, [joined, onJoinedChange]);

  if (!supported) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <MicOff size={28} className="text-gray-700 mb-3" />
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Voice not supported in this browser</p>
      </div>
    );
  }

  if (!joined) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-green-500/10 border border-green-500/20 flex items-center justify-center mb-4">
          <Mic size={24} className="text-green-400" />
        </div>
        <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Room Voice Chat</h4>
        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-5 leading-relaxed">
          Talk live with friends<br />during the auction
        </p>
        <button
          onClick={join}
          disabled={joining}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-[#050505] font-black uppercase tracking-[0.2em] text-xs shadow-[0_4px_20px_rgba(34,197,94,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
        >
          {joining ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
          {joining ? 'Connecting Mic…' : 'Join Voice'}
        </button>
        <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-3">
          {peers.length > 0 ? `${peers.length} friend${peers.length === 1 ? '' : 's'} already in voice` : 'Best on Chrome / Edge'}
        </p>
        {error && <p className="mt-3 text-[10px] text-red-400 font-bold">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 p-3 sm:p-4 gap-3">
      <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 rounded-2xl p-3">
        <button
          onClick={toggleMute}
          className={`flex-1 h-12 rounded-xl font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2 ${muted
            ? 'bg-red-500/15 border border-red-500/30 text-red-400'
            : 'bg-green-500/15 border border-green-500/30 text-green-400 hover:bg-green-500/20'}`}
        >
          {muted ? <MicOff size={16} /> : <Mic size={16} />}
          {muted ? 'Unmute' : 'Mute'}
        </button>
        <button
          onClick={leave}
          className="h-12 w-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all active:scale-95 cursor-pointer flex items-center justify-center shrink-0"
          title="Leave voice"
        >
          <PhoneOff size={16} />
        </button>
      </div>

      <div className="flex items-center gap-2 px-1">
        <Users size={12} className="text-gray-500" />
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
          {peers.length + 1} in voice
        </span>
        <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded ${turnConfigured ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-600'}`}>
          {turnConfigured ? 'Relay ON' : 'Direct only'}
        </span>
        <div className="flex-1 h-px bg-white/5" />
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto custom-scrollbar">
        <PeerRow name={user?.displayName || 'Manager'} teamId={team?.teamId || team?.team || ''} muted={muted} connected self />
        {peers.map((p) => (
          <PeerRow
            key={p.uid}
            name={p.name}
            teamId={p.teamId}
            muted={p.muted}
            connected={connectedUids.includes(p.uid)}
          />
        ))}
      </div>

      {error && <p className="text-[10px] text-red-400 font-bold text-center">{error}</p>}
    </div>
  );
};

export default VoiceChat;
