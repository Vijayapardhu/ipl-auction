import React from 'react';
import { TEAMS } from '../data/teams';

/**
 * Mini auction strip pinned on top of the Chat page: current player,
 * live bid, countdown, and a working bid button — so users can follow
 * and bid without leaving the conversation.
 */
const AuctionMiniBar = ({
  currentPlayer,
  currentBid,
  highBidderId,
  highBidderTeamId,
  nextBidAmount,
  timeLeft,
  status,
  isBidding,
  isOnline,
  isLeading,
  onBid,
}) => {
  const teamLogo = TEAMS.find((t) => t.id === highBidderTeamId)?.logo;
  const biddingLive = status === 'bidding';
  const urgent = timeLeft < 5;

  const buttonLabel = !isOnline
    ? 'RECONNECTING…'
    : isBidding
      ? 'PLACING…'
      : status === 'paused'
        ? 'PAUSED'
        : status === 'sold'
          ? 'SOLD'
          : status === 'unsold'
            ? 'UNSOLD'
            : isLeading
              ? 'LEADING ✓'
              : `BID ₹${(nextBidAmount || 0).toFixed(2)} Cr`;

  return (
    <div className="shrink-0 p-3 border-b border-white/5 bg-white/[0.02]">
      <div className="flex items-center gap-3">
        <img
          src={currentPlayer?.image}
          alt={currentPlayer?.name || 'Player'}
          loading="lazy"
          decoding="async"
          className="w-11 h-14 rounded-xl object-cover object-top border border-white/10 bg-white/5 shrink-0"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(currentPlayer?.name || 'Player');
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-black text-white uppercase tracking-wide truncate">
            {currentPlayer?.name || 'Waiting…'}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-black text-yellow-500">₹{(currentBid || 0).toFixed(2)} Cr</span>
            {teamLogo && (
              <img src={teamLogo} alt="" className="w-4 h-4 object-contain" />
            )}
          </div>
        </div>
        <div className={`w-11 h-11 rounded-full flex flex-col items-center justify-center border-2 shrink-0 transition-colors ${urgent && biddingLive
          ? 'border-red-500 bg-red-500/10 text-red-500'
          : 'border-green-500/30 bg-green-500/5 text-green-400'}`}>
          <span className="text-sm font-black leading-none">{timeLeft}</span>
          <span className="text-[7px] font-bold uppercase">Sec</span>
        </div>
      </div>
      <button
        onClick={onBid}
        disabled={!biddingLive || timeLeft === 0 || isBidding || !isOnline || isLeading}
        className={`mt-2.5 w-full h-11 rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-[0.98] disabled:opacity-50 disabled:grayscale cursor-pointer flex items-center justify-center gap-2 ${isLeading
          ? 'bg-white/5 text-green-500 border border-green-500/20'
          : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-[#050505] shadow-[0_4px_20px_rgba(34,197,94,0.2)]'}`}
      >
        {buttonLabel}
      </button>
    </div>
  );
};

export default AuctionMiniBar;
