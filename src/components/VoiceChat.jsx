import React, { useEffect } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, Loader2, Users, Repeat } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useAuction } from '../contexts/AuctionContext';
import { useVoice } from '../contexts/VoiceContext';

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

const VoiceChat = ({ roomId, onJoinedChange, compact }) => {
  const { user } = useAuth();
  const { team } = useAuction();
  const {
    supported, turnConfigured, joined, joining, activeRoomId,
    muted, peers, connectedUids, error, joinVoice, leave, toggleMute,
  } = useVoice();
  const teamId = team?.teamId || team?.team || '';
  const joinArgs = {
    roomId,
    user,
    displayName: user?.displayName || 'Manager',
    teamId,
    teamName: team?.teamName || '',
  };
  const joinedHere = joined && activeRoomId === roomId;

  useEffect(() => {
    if (onJoinedChange) onJoinedChange(joinedHere);
  }, [joinedHere, onJoinedChange]);

  if (!supported) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <MicOff size={28} className="text-gray-700 mb-3" />
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Voice not supported in this browser</p>
      </div>
    );
  }

  if (!joinedHere) {
    // In voice in a different room — offer to switch without losing context.
    if (joined) {
      return (
        <div className={compact
          ? "shrink-0 flex items-center gap-3 p-3"
          : "flex-1 flex flex-col items-center justify-center p-6 text-center"}>
          <div className={`${compact ? 'w-10 h-10 rounded-xl' : 'w-14 h-14 rounded-2xl'} bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 ${compact ? '' : 'mb-4'}`}>
            <Volume2 size={compact ? 18 : 24} className="text-green-400" />
          </div>
          <div className={compact ? 'min-w-0 flex-1' : ''}>
            <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Voice Active Elsewhere</h4>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed truncate">
              Talking in {activeRoomId}
            </p>
          </div>
          <button
            onClick={() => joinVoice(joinArgs)}
            disabled={joining}
            className={`${compact ? 'h-10 px-4 w-auto' : 'w-full h-12'} rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-[#050505] font-black uppercase tracking-[0.2em] text-xs shadow-[0_4px_20px_rgba(34,197,94,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0`}
          >
            {joining ? <Loader2 size={16} className="animate-spin" /> : <Repeat size={16} />}
            {joining ? 'Switching…' : 'Switch'}
          </button>
          {!compact && (
            <button
              onClick={leave}
              className="mt-2 w-full h-10 rounded-xl text-[10px] font-black text-gray-500 hover:text-red-400 uppercase tracking-[0.2em] transition-colors cursor-pointer"
            >
              Leave Voice
            </button>
          )}
          {error && <p className="mt-3 text-[10px] text-red-400 font-bold">{error}</p>}
        </div>
      );
    }
    return (
      <div className={compact
        ? "shrink-0 flex items-center gap-3 p-3 text-left"
        : "flex-1 flex flex-col items-center justify-center p-6 text-center"}>
        <div className={`${compact ? 'w-10 h-10 rounded-xl' : 'w-14 h-14 rounded-2xl'} bg-green-500/10 border border-green-500/20 flex items-center justify-center shrink-0 ${compact ? '' : 'mb-4'}`}>
          <Mic size={compact ? 18 : 24} className="text-green-400" />
        </div>
        <div className={compact ? 'min-w-0 flex-1' : ''}>
          <h4 className="text-sm font-black text-white uppercase tracking-widest mb-1">Room Voice Chat</h4>
          <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-relaxed">
            Talk live with friends{compact ? '' : <><br />during the auction</>}
          </p>
        </div>
        <button
          onClick={() => joinVoice(joinArgs)}
          disabled={joining}
          className={`${compact ? 'h-10 px-5 w-auto' : 'w-full h-12'} rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-[#050505] font-black uppercase tracking-[0.2em] text-xs shadow-[0_4px_20px_rgba(34,197,94,0.2)] transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 shrink-0`}
        >
          {joining ? <Loader2 size={16} className="animate-spin" /> : <Mic size={16} />}
          {joining ? 'Connecting…' : 'Join'}
        </button>
        {!compact && (
          <p className="text-[8px] text-gray-600 font-bold uppercase tracking-widest mt-3">
            Best on Chrome / Edge
          </p>
        )}
        {error && <p className="mt-3 text-[10px] text-red-400 font-bold">{error}</p>}
      </div>
    );
  }

  return (
    <div className={compact
      ? "shrink-0 flex flex-col p-3 gap-2.5"
      : "flex-1 flex flex-col min-h-0 p-3 sm:p-4 gap-3"}>
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

      <div className={`flex flex-col gap-2 custom-scrollbar ${compact ? 'overflow-y-auto max-h-36' : 'overflow-y-auto'}`}>
        <PeerRow name={user?.displayName || 'Manager'} teamId={teamId} muted={muted} connected self />
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
