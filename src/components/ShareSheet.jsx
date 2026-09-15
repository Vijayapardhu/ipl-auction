import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Share2, Copy, Check, MessageCircle, Send, QrCode } from 'lucide-react';

/**
 * Best-in-class room sharing: big tappable code, native share sheet,
 * WhatsApp / Telegram intents, copy actions, and a QR for same-room scans.
 */
const ShareSheet = ({ roomId, modeLabel, hostName, onClose }) => {
  const [copied, setCopied] = useState(null);
  const [showQr, setShowQr] = useState(false);

  const joinUrl = typeof window !== 'undefined' ? `${window.location.origin}/lobby/${roomId}` : '';
  const message = `🏏 Join my IPL Auction room!\nCode: ${roomId}${modeLabel ? ` • ${modeLabel}` : ''}${hostName ? ` • Host: ${hostName}` : ''}\nTap to join: ${joinUrl}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(joinUrl)}`;
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const copyText = async (text, which) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch (e) {
      // Clipboard API blocked (permissions) — legacy fallback.
      try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      } catch (err) { /* ignore */ }
    }
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  };

  const nativeShare = async () => {
    if (!canNativeShare) {
      copyText(joinUrl, 'link');
      return;
    }
    try {
      await navigator.share({ title: 'IPL Auction Room', text: message, url: joinUrl });
    } catch (e) { /* user dismissed */ }
  };

  const actions = [
    ...(canNativeShare ? [{ id: 'share', label: 'Share', icon: Share2, tint: 'text-white bg-white/10 border-white/15', fn: nativeShare }] : []),
    {
      id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, tint: 'text-[#25D366] bg-[#25D366]/10 border-[#25D366]/20',
      fn: () => window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener'),
    },
    {
      id: 'telegram', label: 'Telegram', icon: Send, tint: 'text-sky-400 bg-sky-500/10 border-sky-500/20',
      fn: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(joinUrl)}&text=${encodeURIComponent(`🏏 Join my IPL Auction room! Code: ${roomId}`)}`, '_blank', 'noopener'),
    },
    {
      id: 'code', label: copied === 'code' ? 'Copied!' : 'Copy Code',
      icon: copied === 'code' ? Check : Copy,
      tint: copied === 'code' ? 'text-green-400 bg-green-500/10 border-green-500/20' : 'text-gray-300 bg-white/5 border-white/10',
      fn: () => copyText(roomId, 'code'),
    },
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-md"
      />
      <motion.div
        initial={{ opacity: 0, y: 60, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 60, scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
        className="relative w-full sm:max-w-sm bg-[#0d0d0e] border border-white/10 rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-2xl"
      >
        <button
          onClick={onClose}
          aria-label="Close share"
          className="absolute top-4 right-4 w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          <X size={16} />
        </button>

        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">Invite friends</p>
        <h3 className="text-lg font-black text-white uppercase tracking-tight mb-4">Share this room</h3>

        {/* Big tappable code */}
        <button
          onClick={() => copyText(roomId, 'code')}
          className="w-full bg-gradient-to-br from-[#ff5500]/15 to-[#ff8c00]/5 border border-[#ff5500]/30 rounded-2xl py-4 px-4 mb-3 cursor-pointer active:scale-[0.98] transition-transform group"
          title="Tap to copy code"
        >
          <span className="block text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">
            {copied === 'code' ? 'Copied to clipboard!' : 'Tap code to copy'}
          </span>
          <span className="block text-3xl font-black text-white tracking-[0.35em] group-hover:text-[#ff5500] transition-colors">
            {roomId}
          </span>
        </button>

        {/* Link row */}
        <button
          onClick={() => copyText(joinUrl, 'link')}
          className="w-full flex items-center gap-2 bg-black/40 border border-white/10 hover:border-white/25 rounded-xl px-4 py-3 mb-4 transition-all cursor-pointer active:scale-[0.99]"
          title="Tap to copy invite link"
        >
          <span className="flex-1 text-[11px] text-gray-400 font-medium truncate text-left">{joinUrl}</span>
          {copied === 'link' ? <Check size={15} className="text-green-400 shrink-0" /> : <Copy size={15} className="text-gray-500 shrink-0" />}
        </button>

        {/* Share actions */}
        <div className={`grid ${actions.length >= 4 ? 'grid-cols-4' : 'grid-cols-3'} gap-2.5 mb-3`}>
          {actions.map((a) => (
            <button
              key={a.id}
              onClick={a.fn}
              className={`flex flex-col items-center gap-1.5 py-3 rounded-2xl border transition-all active:scale-95 cursor-pointer ${a.tint} hover:brightness-125`}
            >
              <a.icon size={19} />
              <span className="text-[8px] font-black uppercase tracking-wider">{a.label}</span>
            </button>
          ))}
        </div>

        {/* QR toggle */}
        <button
          onClick={() => setShowQr(!showQr)}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[9px] font-black text-gray-500 hover:text-white uppercase tracking-[0.25em] transition-colors cursor-pointer"
        >
          <QrCode size={14} /> {showQr ? 'Hide QR code' : 'Show QR code'}
        </button>
        {showQr && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="overflow-hidden">
            <div className="bg-white p-3 rounded-2xl w-fit mx-auto mt-2">
              <img src={qrUrl} alt={`QR code to join room ${roomId}`} loading="lazy" className="w-40 h-40 object-contain" />
            </div>
            <p className="text-center text-[8px] font-bold text-gray-600 uppercase tracking-widest mt-2">Scan with any phone camera</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default ShareSheet;
