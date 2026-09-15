import React, { useRef, useState } from 'react';
import { Download, Share2, Loader2 } from 'lucide-react';
import { IPL_PLAYERS } from '../data/players';

const ROLES = ['Batsman', 'Wicket-Keeper', 'All-Rounder', 'Bowler'];

/**
 * Shareable squad card for the auction summary: renders the team's poster
 * and lets managers export it as PNG or share the image directly.
 */
const SquadCard = ({ t, teamDoc, managerName, totalBudget }) => {
  const cardRef = useRef(null);
  const [sharing, setSharing] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [exportError, setExportError] = useState('');

  const squad = (teamDoc?.squad || []).map((s) => {
    const pid = typeof s === 'string' ? s : s.id;
    const bid = typeof s === 'string' ? 0 : s.bid;
    return { ...IPL_PLAYERS.find((p) => p.id === pid), bid };
  }).filter((p) => p && p.id);

  const spent = squad.reduce((sum, p) => sum + (p.bid || 0), 0);
  const budgetLeft = Math.max(0, (totalBudget || 120) - spent);
  const osCount = squad.filter((p) => p.country !== 'IND').length;

  const grouped = ROLES.map((role) => ({
    role,
    players: squad.filter((p) => p.role === role),
  })).filter((g) => g.players.length > 0);

  const renderPng = async () => {
    if (!cardRef.current) return null;
    // Inline every photo as a blob first: remote CDNs often block the
    // CORS fetch html-to-image needs, which would otherwise blank images
    // in the export. Blob URLs always inline cleanly.
    const imgs = Array.from(cardRef.current.querySelectorAll('img'));
    const originalSrcs = new Map();
    const blobUrls = [];
    await Promise.all(imgs.map(async (img) => {
      const src = img.currentSrc || img.getAttribute('src') || '';
      if (!src || src.startsWith('data:') || src.startsWith('blob:')) return;
      originalSrcs.set(img, img.getAttribute('src'));
      try {
        const res = await fetch(src, { mode: 'cors' });
        if (!res.ok) throw new Error('img fetch failed');
        const blob = await res.blob();
        const objectUrl = URL.createObjectURL(blob);
        blobUrls.push(objectUrl);
        img.setAttribute('src', objectUrl);
      } catch (e) {
        img.setAttribute(
          'src',
          'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(img.alt || 'Player')
        );
      }
    }));
    await Promise.all(imgs.map((img) => {
      try {
        return img.decode ? img.decode().catch(() => {}) : Promise.resolve();
      } catch (e) {
        return Promise.resolve();
      }
    }));
    try {
      const { toPng } = await import('html-to-image');
      return await toPng(cardRef.current, {
        cacheBust: false,
        pixelRatio: 2,
        skipFonts: true,
        imagePlaceholder: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      });
    } finally {
      originalSrcs.forEach((src, img) => {
        try { img.setAttribute('src', src); } catch (e) { /* ignore */ }
      });
      blobUrls.forEach((u) => { try { URL.revokeObjectURL(u); } catch (e) { /* ignore */ } });
    }
  };

  const exportPng = async () => {
    setExportError('');
    setDownloading(true);
    try {
      const dataUrl = await renderPng();
      if (!dataUrl) throw new Error('render failed');
      const link = document.createElement('a');
      link.download = `${t.name.replace(/\s+/g, '_')}_Squad.png`;
      link.href = dataUrl;
      // Must be in the DOM — detached clicks are ignored on mobile browsers.
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      setExportError('Download failed — try Share Image instead');
      setTimeout(() => setExportError(''), 3000);
    } finally {
      setDownloading(false);
    }
  };

  const shareImage = async () => {
    setSharing(true);
    try {
      const dataUrl = await renderPng();
      if (!dataUrl) return;
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `${t.name.replace(/\s+/g, '_')}_Squad.png`, { type: 'image/png' });
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: `${t.name} IPL Squad` });
      } else {
        const link = document.createElement('a');
        link.download = file.name;
        link.href = dataUrl;
        link.click();
      }
    } catch (e) { /* dismissed or unsupported */ }
    finally {
      setSharing(false);
    }
  };

  return (
    <div>
      {/* ── Captured squad poster ── */}
      <div ref={cardRef} className="bg-[#0c0c0c] rounded-2xl sm:rounded-[2rem] p-4 sm:p-6 space-y-4 sm:space-y-5 border border-white/5">
        {/* Poster header */}
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/5 border border-white/10 p-1.5 sm:p-2 flex items-center justify-center shrink-0">
            <img src={t.logo} alt="" className="w-full h-full object-contain" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-white truncate">{t.name}</h3>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest bg-[#ff5500]/15 border border-[#ff5500]/30 text-[#ff5500] rounded-lg px-2 py-0.5 shrink-0">{t.id}</span>
            </div>
            <p className="text-[9px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] truncate">
              Managed by {managerName || 'N/A'} • {squad.length} players
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Spent</p>
            <p className="text-base sm:text-xl font-black text-yellow-500">₹{spent.toFixed(1)} Cr</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-[8px] sm:text-[9px] font-black uppercase tracking-wider">
          <span className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-gray-300">Left ₹{budgetLeft.toFixed(1)} Cr</span>
          <span className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-purple-400">Overseas {osCount}</span>
        </div>

        {/* Players by role */}
        {grouped.map(({ role, players }) => (
          <div key={role}>
            <div className="flex items-center gap-2 px-1 mb-2">
              <span className="text-[8px] font-black text-orange-500 uppercase tracking-[0.25em]">{role}s</span>
              <div className="flex-1 h-px bg-orange-500/20" />
              <span className="text-[8px] font-black text-gray-600">{players.length}</span>
            </div>
            <div className="space-y-1.5">
              {players.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-white/[0.03] border border-white/5 p-2 sm:p-2.5 rounded-xl gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://api.dicebear.com/7.x/initials/svg?seed=' + encodeURIComponent(p.name || 'Player');
                      }}
                      className="w-8 h-8 rounded-lg object-cover bg-white/5 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-black uppercase truncate text-white">{p.name}</p>
                      <p className="text-[8px] font-bold text-gray-500 uppercase">
                        {p.role}{p.country !== 'IND' ? ' • ✈' : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-black italic text-green-500 shrink-0">₹{(p.bid || 0).toFixed(2)} Cr</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {squad.length === 0 && (
          <p className="text-center text-[10px] text-gray-600 font-bold py-6 uppercase tracking-widest">No players in this squad</p>
        )}

        {/* Brand footer — baked into every export/share */}
        <div className="flex items-center justify-between border-t border-white/10 pt-3">
          <span className="text-[9px] font-black uppercase tracking-[0.25em] text-white">IPL Auction Hub</span>
          <span className="text-[9px] font-bold tracking-wider text-[#ff5500]">auction.vijayaapardhu.dev</span>
        </div>
      </div>

      {/* ── Actions (never captured) ── */}
      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          onClick={exportPng}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-300 hover:text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />} {downloading ? 'Saving…' : 'Export PNG'}
        </button>
        <button
          onClick={shareImage}
          disabled={sharing}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#ff5500]/10 hover:bg-[#ff5500]/20 border border-[#ff5500]/25 text-[9px] font-black uppercase tracking-widest text-[#ff5500] hover:text-white transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          {sharing ? <Loader2 size={12} className="animate-spin" /> : <Share2 size={12} />} Share Image
        </button>
      </div>
      {exportError && (
        <p className="mt-2 text-[10px] text-red-400 font-bold">{exportError}</p>
      )}
    </div>
  );
};

export default SquadCard;
